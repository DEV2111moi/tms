/**
 * Nadar TMS - GPS Telemetry Controller
 * Manages live GPS queries, packet parsing, and simulation testing
 */

const {
  parseGpsPacket,
  processTelemetry,
  getAllLiveLocations,
  liveBusLocations,
  gpsEmitter,
  invalidateBusImeiCache
} = require('../services/gpsReceiver');
const { query } = require('../db/pool');

/**
 * GET /api/gps/live
 * Returns the latest GPS coordinates and status for all tracked buses
 */
exports.getLive = async (req, res) => {
  try {
    // 1. Get real-time in-memory locations
    const memoryLocations = getAllLiveLocations();

    // 2. Also retrieve latest location from database for all buses that have GPS enabled
    const dbBuses = await query(`
      SELECT b.id AS bus_id,
             b.registration_number,
             b.bus_code,
             b.bus_name,
             b.gps_device_id,
             b.gps_enabled,
             COALESCE(r.id, ar.id) AS route_id,
             COALESCE(r.route_code, ar.route_code) AS route_code,
             COALESCE(r.route_name, ar.route_name) AS route_name,
             i.id AS institution_id,
             i.short_name AS institution_name,
             COALESCE(d.name, dr.name, ad.name) AS driver_name,
             COALESCE(d.phone, dr.phone, ad.phone) AS driver_phone,
             bl.latitude,
             bl.longitude,
             bl.speed_km,
             bl.ignition,
             bl.recorded_at
      FROM buses b
      LEFT JOIN routes r ON r.id = b.route_id
      LEFT JOIN institutions i ON i.id = b.institution_id
      LEFT JOIN (
        SELECT bus_id, MAX(route_id) AS route_id, MAX(driver_id) AS driver_id
        FROM assignments
        WHERE bus_id IS NOT NULL
        GROUP BY bus_id
      ) a ON a.bus_id = b.id
      LEFT JOIN routes ar ON ar.id = a.route_id
      LEFT JOIN drivers d ON d.id = a.driver_id
      LEFT JOIN (
        SELECT route_id, MIN(name) AS name, MIN(phone) AS phone
        FROM drivers
        WHERE status = 'active' OR status IS NULL
        GROUP BY route_id
      ) dr ON dr.route_id = b.route_id
      LEFT JOIN (
        SELECT route_id, MIN(name) AS name, MIN(phone) AS phone
        FROM drivers
        WHERE status = 'active' OR status IS NULL
        GROUP BY route_id
      ) ad ON ad.route_id = a.route_id
      LEFT JOIN (
        SELECT bl1.*
        FROM bus_locations bl1
        INNER JOIN (
          SELECT bus_id, MAX(id) as max_id
          FROM bus_locations
          WHERE bus_id IS NOT NULL
          GROUP BY bus_id
        ) bl2 ON bl1.id = bl2.max_id
      ) bl ON bl.bus_id = b.id
      WHERE b.status = 'active'
      ORDER BY b.registration_number ASC
    `);

    // Guarantee strict bus_id uniqueness (preventing any duplicate rows)
    const uniqueDbBuses = [];
    const seenBusIds = new Set();
    for (const b of dbBuses) {
      if (!seenBusIds.has(b.bus_id)) {
        seenBusIds.add(b.bus_id);
        uniqueDbBuses.push(b);
      }
    }

    // Merge memory (real-time latest) with DB records
    const mappedImeis = new Set();
    const combined = uniqueDbBuses.map((b) => {
      const live = (b.gps_device_id && liveBusLocations.get(b.gps_device_id)) ||
                   liveBusLocations.get(`bus_${b.bus_id}`);

      if (b.gps_device_id) {
        mappedImeis.add(b.gps_device_id);
      }

      if (live) {
        if (live.imei) mappedImeis.add(live.imei);
        return {
          ...b,
          latitude: live.latitude ?? b.latitude,
          longitude: live.longitude ?? b.longitude,
          speed_km: live.speed_km ?? b.speed_km ?? 0,
          ignition: live.ignition !== undefined ? live.ignition : (b.ignition === 1),
          recorded_at: live.recorded_at ?? b.recorded_at,
          is_online: true
        };
      }

      const hasRecentLoc = b.recorded_at && (Date.now() - new Date(b.recorded_at).getTime() < 15 * 60 * 1000);

      return {
        ...b,
        speed_km: b.speed_km || 0,
        ignition: b.ignition === 1,
        is_online: Boolean(hasRecentLoc)
      };
    });

    // Also include any active live GPS devices that transmitted telemetry even if not yet mapped to a bus
    for (const mem of memoryLocations) {
      if (mem.imei && !mappedImeis.has(mem.imei) && mem.latitude && mem.longitude) {
        combined.unshift({
          bus_id: null,
          registration_number: `Test Tracker (${mem.imei.slice(-6)})`,
          bus_code: 'TEST-GPS',
          bus_name: `Vendor Device ${mem.imei}`,
          gps_device_id: mem.imei,
          gps_enabled: 1,
          route_code: 'TEST',
          route_name: 'Raw Vendor Telemetry Feed',
          institution_name: 'Vendor GPS Device',
          driver_name: 'Live Device',
          driver_phone: '',
          latitude: mem.latitude,
          longitude: mem.longitude,
          speed_km: mem.speed_km || 0,
          ignition: Boolean(mem.ignition),
          recorded_at: mem.recorded_at,
          is_online: true
        });
      }
    }

    res.json({
      success: true,
      count: combined.length,
      online_count: combined.filter(c => c.is_online).length,
      items: combined
    });
  } catch (err) {
    console.error('getLive GPS error:', err);
    res.status(500).json({ error: 'Could not fetch live GPS locations: ' + err.message });
  }
};

/**
 * POST /api/gps/raw
 * Endpoint to receive raw packet over HTTP POST (e.g. from vendor webhook or test tool)
 * Body: { packet: "@@863071010318308,,,070739,1100.7754,N,07657.7117,E,0.43,210813,A,0101,1,0,0000,0000,#" }
 * Or plain text body: @@863071...#
 */
exports.receiveRaw = async (req, res) => {
  try {
    // 1. Support standard JSON provider payloads: { imei, registration_number, latitude, longitude, speed }
    if (req.body && typeof req.body === 'object' && req.body.latitude && req.body.longitude) {
      let targetImei = req.body.imei;
      if (!targetImei && req.body.registration_number) {
        const rows = await query('SELECT gps_device_id FROM buses WHERE registration_number = ? LIMIT 1', [req.body.registration_number]);
        if (rows.length && rows[0].gps_device_id) targetImei = rows[0].gps_device_id;
      }
      if (!targetImei) targetImei = '863071010318308';

      const parsed = {
        imei: String(targetImei),
        valid: true,
        validityCode: 'A',
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
        speedKm: parseFloat(req.body.speed_km || req.body.speed || 0),
        ignition: req.body.ignition !== undefined ? Boolean(req.body.ignition) : true,
        doorOpen: false,
        recordedAt: req.body.recorded_at ? new Date(req.body.recorded_at) : new Date(),
        raw: JSON.stringify(req.body)
      };

      const result = await processTelemetry(parsed);
      return res.json({
        success: true,
        message: 'Live GPS provider payload processed',
        parsed,
        telemetry: result
      });
    }

    let raw = '';
    if (typeof req.body === 'string') {
      raw = req.body;
    } else if (req.body && req.body.packet) {
      raw = req.body.packet;
    } else if (req.body && req.body.data) {
      raw = req.body.data;
    }

    if (!raw) {
      return res.status(400).json({ error: 'Missing raw packet. Send { packet: "@@..." }, { latitude, longitude } or plain text.' });
    }

    const parsed = parseGpsPacket(raw);
    if (!parsed) {
      return res.status(400).json({ error: 'Unrecognized packet format. Expected @@<IMEI>...#' });
    }

    const result = await processTelemetry(parsed);

    res.json({
      success: true,
      parsed,
      telemetry: result
    });
  } catch (err) {
    console.error('receiveRaw GPS error:', err);
    res.status(500).json({ error: 'Failed to process raw GPS packet: ' + err.message });
  }
};

/**
 * POST /api/gps/simulate
 * Simulates a test GPS packet for a given bus registration number or sample IMEI
 */
exports.simulate = async (req, res) => {
  const { bus_id, registration_number, imei, latitude, longitude, speed } = req.body || {};

  try {
    let targetImei = imei;
    let bus = null;

    if (bus_id) {
      const rows = await query('SELECT id, registration_number, gps_device_id FROM buses WHERE id = ? LIMIT 1', [bus_id]);
      if (rows.length) bus = rows[0];
    } else if (registration_number) {
      const rows = await query('SELECT id, registration_number, gps_device_id FROM buses WHERE registration_number = ? LIMIT 1', [registration_number]);
      if (rows.length) bus = rows[0];
    }

    if (bus && bus.gps_device_id) {
      targetImei = bus.gps_device_id;
    } else if (bus && !bus.gps_device_id) {
      // Temporarily assign sample IMEI for testing if not assigned
      targetImei = '863071010318308';
      await query('UPDATE buses SET gps_device_id = ?, gps_enabled = 1 WHERE id = ?', [targetImei, bus.id]);
    }

    if (!targetImei) {
      targetImei = '863071010318308';
    }

    // Default coordinates: Theni / Madurai area, Tamil Nadu
    const lat = latitude || 10.0104;
    const lng = longitude || 77.4768;

    // Convert decimal degrees back to NMEA format for authentic simulation
    const latDeg = Math.floor(Math.abs(lat));
    const latMin = ((Math.abs(lat) - latDeg) * 60).toFixed(4);
    const nmeaLat = `${String(latDeg).padStart(2, '0')}${String(latMin).padStart(7, '0')}`;
    const latDir = lat >= 0 ? 'N' : 'S';

    const lngDeg = Math.floor(Math.abs(lng));
    const lngMin = ((Math.abs(lng) - lngDeg) * 60).toFixed(4);
    const nmeaLng = `${String(lngDeg).padStart(3, '0')}${String(lngMin).padStart(7, '0')}`;
    const lngDir = lng >= 0 ? 'E' : 'W';

    const speedKnots = ((speed || 35) / 1.852).toFixed(2);
    const now = new Date();
    const timeStr = [now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()]
      .map(v => String(v).padStart(2, '0')).join('');
    const dateStr = [now.getUTCDate(), now.getUTCMonth() + 1, String(now.getUTCFullYear()).slice(-2)]
      .map(v => String(v).padStart(2, '0')).join('');

    const simulatedPacket = `@@${targetImei},,,${timeStr},${nmeaLat},${latDir},${nmeaLng},${lngDir},${speedKnots},${dateStr},A,0101,1,0,0000,0000,#`;

    const parsed = parseGpsPacket(simulatedPacket);
    const result = await processTelemetry(parsed);

    res.json({
      success: true,
      message: 'Simulated GPS telemetry packet received & processed',
      packet: simulatedPacket,
      parsed,
      telemetry: result
    });
  } catch (err) {
    console.error('Simulate error:', err);
    res.status(500).json({ error: 'Simulation failed: ' + err.message });
  }
};

/**
 * GET /api/gps/stream
 * Server-Sent Events (SSE) stream for real-time live GPS telemetry from provider
 */
exports.stream = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial ping to establish connection
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  const onTelemetry = (data) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'telemetry', bus: data })}\n\n`);
    } catch (err) {}
  };

  gpsEmitter.on('telemetry', onTelemetry);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (e) {}
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    gpsEmitter.off('telemetry', onTelemetry);
  });
};

/**
 * POST /api/gps/assign-imei
 * Updates or assigns GPS device IMEI for a bus, syncs cache, and activates tracking
 */
exports.assignImei = async (req, res) => {
  const { bus_id, imei, gps_enabled = 1 } = req.body || {};
  if (!bus_id) {
    return res.status(400).json({ error: 'bus_id is required' });
  }

  const cleanImei = imei ? String(imei).trim() : null;

  try {
    // If IMEI provided, check uniqueness across other buses
    if (cleanImei) {
      const existing = await query(
        'SELECT id, registration_number, bus_code FROM buses WHERE gps_device_id = ? AND id != ? LIMIT 1',
        [cleanImei, bus_id]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          error: `IMEI ${cleanImei} is already assigned to Bus ${existing[0].registration_number} (${existing[0].bus_code || 'Fleet'}). Please unassign it first or use a unique tracker IMEI.`
        });
      }
    }

    // Update bus record in MySQL
    await query(
      'UPDATE buses SET gps_device_id = ?, gps_enabled = ? WHERE id = ?',
      [cleanImei, cleanImei ? (gps_enabled ? 1 : 0) : 0, bus_id]
    );

    // Invalidate in-memory receiver cache so next telemetry packet immediately resolves the new mapping
    if (typeof invalidateBusImeiCache === 'function') {
      invalidateBusImeiCache(cleanImei);
      invalidateBusImeiCache(); // clears lookup map
    }

    // Return updated bus details
    const rows = await query(
      `SELECT b.id AS bus_id, b.registration_number, b.bus_code, b.bus_name, b.gps_device_id, b.gps_enabled,
              COALESCE(r.id, ar.id) AS route_id,
              COALESCE(r.route_code, ar.route_code) AS route_code,
              COALESCE(r.route_name, ar.route_name) AS route_name
       FROM buses b
       LEFT JOIN routes r ON r.id = b.route_id
       LEFT JOIN (
         SELECT bus_id, MAX(route_id) AS route_id
         FROM assignments
         WHERE bus_id IS NOT NULL
         GROUP BY bus_id
       ) a ON a.bus_id = b.id
       LEFT JOIN routes ar ON ar.id = a.route_id
       WHERE b.id = ? LIMIT 1`,
      [bus_id]
    );

    const updated = rows[0] || { bus_id, gps_device_id: cleanImei, gps_enabled };

    res.json({
      success: true,
      message: cleanImei
        ? `GPS Device IMEI ${cleanImei} successfully assigned to ${updated.registration_number}!`
        : `GPS Tracker unlinked from ${updated.registration_number}`,
      bus: updated
    });
  } catch (err) {
    console.error('assignImei error:', err);
    res.status(500).json({ error: 'Failed to assign GPS IMEI: ' + err.message });
  }
};
