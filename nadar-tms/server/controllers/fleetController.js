const { query } = require('../db/pool');

// GET /api/fleet/alerts?days=30
exports.alerts = async (req, res) => {
  const days = Number(req.query.days) || 30;
  try {
    const buses = await query('SELECT id, registration_number, fc_number, fc_expiry, insurance_expiry, permit_expiry, puc_expiry FROM buses');
    const drivers = await query('SELECT id, name, license_number, license_expiry FROM drivers');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysLeft = (d) => d ? Math.ceil((new Date(d) - today) / 86400000) : null;

    const alerts = [];
    const flag = (subject, type, date) => {
      const left = daysLeft(date);
      if (left === null) return;
      if (left <= days) alerts.push({ subject, type, date, daysLeft: left, expired: left < 0 });
    };
    buses.forEach((b) => {
      flag(b.registration_number, 'Fitness Certificate (FC)', b.fc_expiry);
      flag(b.registration_number, 'Insurance', b.insurance_expiry);
      flag(b.registration_number, 'Permit', b.permit_expiry);
      flag(b.registration_number, 'Pollution (PUC)', b.puc_expiry);
    });
    drivers.forEach((d) => flag(d.name + ' (licence)', 'Driving Licence', d.license_expiry));

    const services = await query(`SELECT m.next_due_date, b.registration_number
      FROM maintenance_logs m LEFT JOIN buses b ON b.id = m.bus_id
      WHERE m.next_due_date IS NOT NULL`);
    services.forEach((m) => flag(m.registration_number || 'Bus', 'Service due', m.next_due_date));

    alerts.sort((a, b) => a.daysLeft - b.daysLeft);
    res.json({ withinDays: days, count: alerts.length, alerts });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load compliance alerts.' }); }
};

// POST /api/assignments
exports.assign = async (req, res) => {
  const { route_id, bus_id, driver_id, incharge_id } = req.body || {};
  const shift = req.body && req.body.shift;
  if (!route_id) return res.status(400).json({ error: 'Choose a route.' });
  const shifts = (!shift || shift === 'both') ? ['morning1', 'evening1'] : [shift];
  const inchargeOnly = req.user.role === 'institution';
  try {
    for (const sh of shifts) {
      if (inchargeOnly) {
        await query(
          `INSERT INTO assignments (route_id, shift, incharge_id) VALUES (?,?,?)
           ON DUPLICATE KEY UPDATE incharge_id=VALUES(incharge_id)`,
          [route_id, sh, incharge_id || null]);
      } else {
        await query(
          `INSERT INTO assignments (route_id, shift, bus_id, driver_id, incharge_id) VALUES (?,?,?,?,?)
           ON DUPLICATE KEY UPDATE bus_id=VALUES(bus_id), driver_id=VALUES(driver_id), incharge_id=VALUES(incharge_id)`,
          [route_id, sh, bus_id || null, driver_id || null, incharge_id || null]);
      }
    }
    try {
      const r = (await query('SELECT route_code, route_name, institution_id FROM routes WHERE id=?', [route_id]))[0] || {};
      const b = bus_id ? (await query('SELECT registration_number FROM buses WHERE id=?', [bus_id]))[0] : null;
      const d = driver_id ? (await query('SELECT name FROM drivers WHERE id=?', [driver_id]))[0] : null;
      const u = incharge_id ? (await query('SELECT name FROM users WHERE id=?', [incharge_id]))[0] : null;
      const msg = `Route ${r.route_code || route_id} (${shifts.join(' & ')}) assigned — Bus ${b ? b.registration_number : '—'}, Driver ${d ? d.name : '—'}, Incharge ${u ? u.name : '—'}`;
      await query('INSERT INTO notifications (message, route_id, institution_id, incharge_id) VALUES (?,?,?,?)',
        [msg.slice(0, 255), route_id, r.institution_id || null, incharge_id || null]);
    } catch (e) { console.error('notify failed', e); }
    
    // Automatically trigger calculation & insertion of any missing assignment trips immediately
    try {
      const { autoLogTrips } = require('./reportController');
      autoLogTrips().catch(err => console.error('Async autoLogTrips error:', err));
    } catch (err) {
      console.error('Failed to run autoLogTrips:', err);
    }

    res.json({ ok: true, shifts });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not save the assignment.' }); }
};

// GET /api/assignments
exports.assignments = async (req, res) => {
  try {
    const rows = await query(`
      SELECT a.id, a.route_id, a.shift, a.bus_id, a.driver_id, a.incharge_id,
             r.route_code, r.route_name, r.total_distance, b.registration_number,
             d.name AS driver_name, u.name AS incharge_name,
             COALESCE(i.short_name, '—') AS institution_name
      FROM assignments a
      JOIN routes r ON r.id = a.route_id
      LEFT JOIN institutions i ON i.id = r.institution_id
      LEFT JOIN buses b   ON b.id = a.bus_id
      LEFT JOIN drivers d ON d.id = a.driver_id
      LEFT JOIN users u   ON u.id = a.incharge_id
      ORDER BY r.route_code, a.shift`);
    res.json({ items: rows });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load assignments.' }); }
};

// POST /api/trips/:tripId/location
exports.pushLocation = async (req, res) => {
  const { latitude, longitude, stopId } = req.body || {};
  if (latitude == null || longitude == null) return res.status(400).json({ error: 'Location is required.' });
  try {
    await query('INSERT INTO bus_locations (trip_id, latitude, longitude, stop_id) VALUES (?,?,?,?)',
      [req.params.tripId, latitude, longitude, stopId || null]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not save location.' }); }
};

// GET /api/parent/me
exports.parentView = async (req, res) => {
  try {
    const kids = await query(`
      SELECT s.id, s.student_id, s.name, s.class_grade, s.route_id, s.stop_id,
             r.route_code, r.route_name, st.stop_name
      FROM students s
      LEFT JOIN routes r ON r.id = s.route_id
      LEFT JOIN stops st ON st.id = s.stop_id
      WHERE s.parent_user_id = ?`, [req.user.id]);
    if (!kids.length) return res.status(404).json({ error: 'No student is linked to your account.' });

    const child = kids[0];
    const trips = await query(
      'SELECT id, status FROM trips WHERE route_id=? AND trip_date=CURDATE() ORDER BY id DESC LIMIT 1',
      [child.route_id]);
    let location = null, attendance = null, stops = [];
    if (trips.length) {
      const tripId = trips[0].id;
      const loc = await query(
        `SELECT bl.latitude, bl.longitude, bl.recorded_at, s.stop_name
         FROM bus_locations bl LEFT JOIN stops s ON s.id = bl.stop_id
         WHERE bl.trip_id=? ORDER BY bl.recorded_at DESC LIMIT 1`, [tripId]);
      location = loc[0] || null;
      const att = await query('SELECT status, boarding_time FROM attendance WHERE trip_id=? AND student_id=?',
        [tripId, child.id]);
      attendance = att[0] || { status: 'absent' };
      stops = await query('SELECT id, stop_name, sequence, scheduled_time FROM stops WHERE route_id=? ORDER BY sequence',
        [child.route_id]);
    }
    res.json({ child: { ...child, trip: trips[0] || null }, location, attendance, stops });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load tracking info.' }); }
};

// GET /api/fleet/refs
exports.refs = async (req, res) => {
  try {
    const [routes, buses, drivers, incharges, institutions] = await Promise.all([
      query('SELECT id, route_code, route_name, institution_id FROM routes ORDER BY route_code'),
      query('SELECT id, registration_number, institution_id FROM buses ORDER BY registration_number'),
      query('SELECT id, name FROM drivers ORDER BY name'),
      query("SELECT id, name, institution_id FROM users WHERE role='incharge' ORDER BY name"),
      query('SELECT id, code, name, short_name FROM institutions ORDER BY name'),
    ]);
    res.json({ routes, buses, drivers, incharges, institutions });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load reference data.' }); }
};
