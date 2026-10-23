/**
 * Nadar TMS - Live GPS Telemetry Service
 * Listens for GPS packets from bus GPS tracking devices via TCP socket & HTTP webhook.
 * Protocol Format:
 * @@<IMEI>,,,<hhmmss>,<lat>,<lat_dir>,<lon>,<lon_dir>,<speed_knots>,<ddmmyy>,<validity>,<status>,...#
 */

const net = require('net');
const EventEmitter = require('events');
const { query } = require('../db/pool');

// Real-time telemetry event emitter for live provider streams
const gpsEmitter = new EventEmitter();
gpsEmitter.setMaxListeners(100);

// In-memory cache for ultra-fast live location retrieval
const liveBusLocations = new Map();

/**
 * Converts NMEA coordinate string (DDMM.MMMM or DDDMM.MMMM) to standard decimal degrees
 * e.g. "1100.7754", "N" -> 11.012923
 *      "07657.7117", "E" -> 76.961862
 */
function nmeaToDecimal(coord, direction) {
  if (!coord || typeof coord !== 'string') return null;
  const clean = coord.trim();
  const dotIndex = clean.indexOf('.');
  if (dotIndex < 2) return null;

  const degDigits = dotIndex - 2;
  const degrees = parseFloat(clean.substring(0, degDigits));
  const minutes = parseFloat(clean.substring(degDigits));
  if (isNaN(degrees) || isNaN(minutes)) return null;

  let decimal = degrees + (minutes / 60);
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }
  return parseFloat(decimal.toFixed(6));
}

/**
 * Parses raw GPS ASCII packet string
 */
function parseGpsPacket(raw) {
  if (!raw) return null;
  const str = raw.toString().trim();
  if (!str.startsWith('@') || !str.includes('#')) return null;

  // Strip leading '@' and trailing '#'
  const content = str.replace(/^@+/, '').replace(/#.*$/, '');
  const parts = content.split(',');

  if (parts.length < 11) {
    return { valid: false, error: 'Incomplete packet format', raw: str };
  }

  const imei = parts[0]?.trim();
  const timeUtc = parts[3]?.trim();     // hhmmss
  const rawLat = parts[4]?.trim();      // DDMM.MMMM
  const latDir = (parts[5] || 'N').trim().toUpperCase();
  const rawLon = parts[6]?.trim();      // DDDMM.MMMM
  const lonDir = (parts[7] || 'E').trim().toUpperCase();
  const speedKnots = parseFloat(parts[8] || '0');
  const dateStr = parts[9]?.trim();     // ddmmyy
  const validity = (parts[10] || '').trim().toUpperCase(); // 'A' = Valid, 'V'/'N'/'D' = Invalid
  const statusFlags = (parts[11] || '0000').trim();

  // Status bits: [ignition, door, out1, out2]
  const ignition = statusFlags.charAt(0) === '1';
  const doorOpen = statusFlags.charAt(1) === '1';

  // Validity check: 'A' means active satellite fix
  const isValidFix = validity === 'A';

  const latitude = nmeaToDecimal(rawLat, latDir);
  const longitude = nmeaToDecimal(rawLon, lonDir);
  const speedKm = parseFloat((speedKnots * 1.852).toFixed(1));

  // Construct ISO timestamp if date & time are present
  let recordedAt = new Date();
  if (dateStr && dateStr.length === 6 && timeUtc && timeUtc.length >= 6) {
    const day = parseInt(dateStr.substring(0, 2), 10);
    const month = parseInt(dateStr.substring(2, 4), 10) - 1;
    const year = 2000 + parseInt(dateStr.substring(4, 6), 10);
    const hour = parseInt(timeUtc.substring(0, 2), 10);
    const min = parseInt(timeUtc.substring(2, 4), 10);
    const sec = parseInt(timeUtc.substring(4, 6), 10);
    const parsedDate = new Date(Date.UTC(year, month, day, hour, min, sec));
    if (!isNaN(parsedDate.getTime())) {
      recordedAt = parsedDate;
    }
  }

  return {
    imei,
    valid: isValidFix,
    validityCode: validity,
    latitude,
    longitude,
    speedKm,
    ignition,
    doorOpen,
    recordedAt,
    raw: str
  };
}

/**
 * Handles incoming parsed telemetry and stores into DB and live cache
 */
async function processTelemetry(parsed) {
  if (!parsed || !parsed.imei) return null;

  // 1. Look up bus matching this IMEI
  let bus = null;
  try {
    const rows = await query(
      `SELECT b.id, b.registration_number, b.bus_code, b.bus_name, 
              COALESCE(r.id, ar.id) AS route_id, b.institution_id,
              COALESCE(r.route_code, ar.route_code) AS route_code, 
              COALESCE(r.route_name, ar.route_name) AS route_name, 
              i.short_name AS institution_name,
              COALESCE(d.name, dr.name, ad.name) AS driver_name,
              COALESCE(d.phone, dr.phone, ad.phone) AS driver_phone
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
       LEFT JOIN drivers dr ON dr.route_id = b.route_id
       LEFT JOIN drivers ad ON ad.route_id = a.route_id
       WHERE b.gps_device_id = ?
       LIMIT 1`,
      [parsed.imei]
    );
    if (rows && rows.length > 0) {
      bus = rows[0];
    }
  } catch (err) {
    console.error('Error fetching bus by IMEI:', err.message);
  }

  // 2. Check if there is an active trip today for this bus
  let tripId = null;
  if (bus) {
    try {
      const activeTrips = await query(
        `SELECT id FROM trips WHERE (bus_id = ? OR route_id = ?) AND trip_date = CURDATE() ORDER BY id DESC LIMIT 1`,
        [bus.id, bus.route_id]
      );
      if (activeTrips && activeTrips.length > 0) {
        tripId = activeTrips[0].id;
      }
    } catch (e) {}
  }

  // 3. Save into bus_locations table if we have valid coordinates
  if (parsed.valid && parsed.latitude && parsed.longitude) {
    try {
      await query(
        `INSERT INTO bus_locations (bus_id, trip_id, imei, latitude, longitude, speed_km, ignition, recorded_at, raw_packet)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bus?.id || null,
          tripId || null,
          parsed.imei,
          parsed.latitude,
          parsed.longitude,
          parsed.speedKm || 0,
          parsed.ignition ? 1 : 0,
          parsed.recordedAt || new Date(),
          parsed.raw ? parsed.raw.substring(0, 255) : null
        ]
      );
    } catch (err) {
      console.error('Failed saving bus_locations:', err.message);
    }
  }

  // 4. Update in-memory live location cache
  const liveEntry = {
    imei: parsed.imei,
    bus_id: bus?.id || null,
    registration_number: bus?.registration_number || `IMEI: ${parsed.imei}`,
    bus_code: bus?.bus_code || '',
    bus_name: bus?.bus_name || '',
    route_id: bus?.route_id || null,
    route_code: bus?.route_code || '—',
    route_name: bus?.route_name || '—',
    institution_name: bus?.institution_name || '—',
    driver_name: bus?.driver_name || '—',
    driver_phone: bus?.driver_phone || '—',
    trip_id: tripId,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    speed_km: parsed.speedKm,
    ignition: parsed.ignition,
    valid: parsed.valid,
    recorded_at: parsed.recordedAt,
    updated_at: new Date()
  };

  liveBusLocations.set(parsed.imei, liveEntry);
  if (bus?.id) {
    liveBusLocations.set(`bus_${bus.id}`, liveEntry);
  }

  // Broadcast to all connected web clients via SSE
  gpsEmitter.emit('telemetry', liveEntry);

  return liveEntry;
}

/**
 * Returns all current live locations
 */
function getAllLiveLocations() {
  const seenBusIds = new Set();
  const list = [];
  for (const [key, loc] of liveBusLocations.entries()) {
    if (key.startsWith('bus_')) continue;
    if (loc.bus_id && seenBusIds.has(loc.bus_id)) continue;
    if (loc.bus_id) seenBusIds.add(loc.bus_id);
    list.push(loc);
  }
  return list;
}

/**
 * Starts the TCP Socket Server for live GPS devices
 */
let tcpServerInstance = null;

function startGpsTcpServer(port = 5050) {
  if (tcpServerInstance) return tcpServerInstance;

  const server = net.createServer((socket) => {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`🔌 GPS Device connected from ${clientAddress}`);

    let buffer = '';

    socket.on('data', async (chunk) => {
      buffer += chunk.toString('ascii');

      // Packets typically end with '#' or '\n'
      while (buffer.includes('#')) {
        const hashIdx = buffer.indexOf('#');
        const packet = buffer.substring(0, hashIdx + 1).trim();
        buffer = buffer.substring(hashIdx + 1);

        if (packet.startsWith('@')) {
          const parsed = parseGpsPacket(packet);
          if (parsed) {
            const result = await processTelemetry(parsed);
            if (result && parsed.valid) {
              console.log(`📍 GPS Live [${result.registration_number}] Lat: ${parsed.latitude}, Lon: ${parsed.longitude}, Speed: ${parsed.speedKm} km/h, Ignition: ${parsed.ignition ? 'ON' : 'OFF'}`);
            }
          }
        }
      }
    });

    socket.on('error', (err) => {
      console.warn(`GPS socket error from ${clientAddress}:`, err.message);
    });

    socket.on('close', () => {
      // Disconnected cleanly
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ GPS TCP Port ${port} is already in use. Please check other instances.`);
    } else {
      console.error('GPS TCP Server error:', err);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`\n  📡 GPS Telemetry TCP Socket Listener active on Port: ${port} (0.0.0.0)`);
    console.log(`  👉 Devices can send raw "@@<IMEI>...#" packets to this port.\n`);
  });

  tcpServerInstance = server;
  return server;
}

module.exports = {
  nmeaToDecimal,
  parseGpsPacket,
  processTelemetry,
  getAllLiveLocations,
  liveBusLocations,
  startGpsTcpServer,
  gpsEmitter
};
