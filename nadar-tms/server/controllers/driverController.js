const { query } = require('../db/pool');

// GET /api/driver/me
exports.me = async (req, res) => {
  try {
    const dr = await query('SELECT * FROM drivers WHERE user_id=? LIMIT 1', [req.user.id]);
    const driver = dr[0] || null;
    let assignments = [];
    if (driver) {
      assignments = await query(`SELECT a.shift, r.route_code, r.route_name, r.origin, r.destination, b.id AS bus_id, b.registration_number
        FROM assignments a JOIN routes r ON r.id=a.route_id
        LEFT JOIN buses b ON b.id=a.bus_id
        WHERE a.driver_id=? ORDER BY a.shift`, [driver.id]);
    }
    const open = await query(`SELECT tl.*, b.registration_number FROM trip_logs tl
      LEFT JOIN buses b ON b.id=tl.bus_id WHERE tl.driver_id=? AND tl.end_time IS NULL ORDER BY tl.id DESC LIMIT 1`, [req.user.id]);
    const todayRows = await query(`SELECT tl.*, b.registration_number FROM trip_logs tl
      LEFT JOIN buses b ON b.id=tl.bus_id WHERE tl.driver_id=? AND tl.log_date=CURDATE()`, [req.user.id]);
    const today = {}; todayRows.forEach(t => { today[t.shift] = t; });
    const trips = await query(`SELECT tl.*, b.registration_number FROM trip_logs tl
      LEFT JOIN buses b ON b.id=tl.bus_id WHERE tl.driver_id=? ORDER BY tl.id DESC LIMIT 20`, [req.user.id]);
    const fuel = await query(`SELECT fl.*, b.registration_number FROM fuel_logs fl
      LEFT JOIN buses b ON b.id=fl.bus_id WHERE fl.driver_id=? ORDER BY fl.id DESC LIMIT 20`, [req.user.id]);
    res.json({ driver, assignments, open: open[0] || null, today, logs: { trips, fuel } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load your driver info.' }); }
};

// GET /api/driver/buses
exports.buses = async (req, res) => {
  try {
    const rows = await query(`SELECT b.id, b.registration_number, r.route_code
      FROM buses b LEFT JOIN routes r ON r.id = b.route_id ORDER BY b.registration_number`);
    res.json({ items: rows });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load buses.' }); }
};

// GET /api/driver/open
exports.open = async (req, res) => {
  try {
    const rows = await query(`SELECT tl.*, b.registration_number
      FROM trip_logs tl LEFT JOIN buses b ON b.id = tl.bus_id
      WHERE tl.driver_id = ? AND tl.end_time IS NULL ORDER BY tl.id DESC LIMIT 1`, [req.user.id]);
    res.json({ open: rows[0] || null });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load your trip.' }); }
};

// POST /api/driver/trip/start
exports.startTrip = async (req, res) => {
  const { bus_id, start_km } = req.body || {};
  const shift = ['trip1','trip2','trip3','trip4','trip5'].includes((req.body||{}).shift) ? req.body.shift : 'trip1';
  if (!bus_id || start_km == null || start_km === '') return res.status(400).json({ error: 'Choose a bus and enter the opening kilometer.' });
  try {
    const existing = await query(
      'SELECT id, end_time FROM trip_logs WHERE driver_id=? AND log_date=CURDATE() AND shift=? LIMIT 1',
      [req.user.id, shift]);
    if (existing.length) {
      return res.status(409).json({ error: existing[0].end_time
        ? `Today's ${shift.replace('trip','trip ')} is already completed — it cannot be entered again.`
        : `Today's ${shift.replace('trip','trip ')} is already started — enter the closing km to finish it.` });
    }
    const r = await query(
      'INSERT INTO trip_logs (bus_id, driver_id, log_date, shift, start_time, start_km) VALUES (?,?,CURDATE(),?,NOW(),?)',
      [bus_id, req.user.id, shift, start_km]);
    res.status(201).json({ id: r.insertId });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not start the trip.' }); }
};

// POST /api/driver/trip/end
exports.endTrip = async (req, res) => {
  const { id, end_km, end_stop } = req.body || {};
  if (!id || end_km == null || end_km === '') return res.status(400).json({ error: 'Enter the ending kilometer.' });
  try {
    await query('UPDATE trip_logs SET end_time = NOW(), end_km = ?, end_stop = ? WHERE id = ? AND driver_id = ?',
      [end_km, end_stop || null, id, req.user.id]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not end the trip.' }); }
};

// POST /api/driver/fuel
exports.addFuel = async (req, res) => {
  const { bus_id, liters, cost, odometer, fuel_date, driver_id } = req.body || {};
  if (!bus_id || liters == null || liters === '') return res.status(400).json({ error: 'Choose a bus and enter the litres of diesel.' });
  try {
    let uid = req.user.id;
    if (driver_id) {
      const d = (await query('SELECT user_id FROM drivers WHERE id=?', [driver_id]))[0];
      uid = d && d.user_id ? d.user_id : null;
    }
    const r = await query(
      'INSERT INTO fuel_logs (bus_id, driver_id, liters, cost, odometer, fuel_date) VALUES (?,?,?,?,?,?)',
      [bus_id, uid, liters, cost || null, odometer || null, fuel_date || new Date().toISOString().slice(0, 10)]);
    res.status(201).json({ id: r.insertId });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not save the diesel entry.' }); }
};

// GET /api/driver/logs
exports.logs = async (req, res) => {
  try {
    const trips = await query(`SELECT tl.*, b.registration_number FROM trip_logs tl
      JOIN buses b ON b.id = tl.bus_id WHERE tl.driver_id = ? ORDER BY tl.id DESC LIMIT 20`, [req.user.id]);
    const fuel = await query(`SELECT fl.*, b.registration_number FROM fuel_logs fl
      JOIN buses b ON b.id = fl.bus_id WHERE fl.driver_id = ? ORDER BY fl.id DESC LIMIT 20`, [req.user.id]);
    res.json({ trips, fuel });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load your logs.' }); }
};

// GET /api/reports/fuel
exports.fuelReport = async (req, res) => {
  try {
    const fuel = await query(`SELECT b.id, b.registration_number, b.institution_id,
        i.short_name AS institution, i.name AS institution_name,
        COUNT(fl.id) AS fills, COALESCE(SUM(fl.liters),0) AS liters,
        COALESCE(SUM(fl.cost),0) AS cost, MAX(fl.fuel_date) AS last_fill
      FROM buses b
      LEFT JOIN fuel_logs fl ON fl.bus_id = b.id
      LEFT JOIN institutions i ON i.id = b.institution_id
      GROUP BY b.id, b.registration_number, b.institution_id, i.short_name, i.name
      ORDER BY liters DESC`);
    const km = await query(`SELECT bus_id, COALESCE(SUM(end_km - start_km),0) AS km
      FROM trip_logs WHERE end_km IS NOT NULL AND start_km IS NOT NULL GROUP BY bus_id`);
    const kmBy = Object.fromEntries(km.map((r) => [r.bus_id, Number(r.km)]));
    const rows = fuel.map((r) => {
      const litres = Number(r.liters), distance = kmBy[r.id] || 0;
      return { ...r, liters: litres, cost: Number(r.cost), fills: Number(r.fills), km: distance,
        mileage: litres > 0 ? Math.round((distance / litres) * 10) / 10 : null };
    });
    const instMap = {};
    rows.forEach((r) => {
      const key = r.institution_id || 0;
      if (!instMap[key]) instMap[key] = { institution_id: r.institution_id, institution: r.institution || 'Unassigned',
        institution_name: r.institution_name || 'Unassigned', buses: 0, fills: 0, liters: 0, cost: 0 };
      instMap[key].buses += 1; instMap[key].fills += r.fills;
      instMap[key].liters += r.liters; instMap[key].cost += r.cost;
    });
    const byInstitution = Object.values(instMap).sort((a, b) => b.liters - a.liters);
    res.json({ rows, byInstitution });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load diesel usage.' }); }
};

// GET /api/fuel/bus/:busId
exports.busFuel = async (req, res) => {
  try {
    const bus = (await query('SELECT registration_number FROM buses WHERE id=?', [req.params.busId]))[0];
    const fills = await query(
      `SELECT fl.id, fl.fuel_date, fl.liters, fl.cost, fl.odometer, u.name AS driver_name
       FROM fuel_logs fl LEFT JOIN users u ON u.id = fl.driver_id
       WHERE fl.bus_id = ? ORDER BY fl.fuel_date DESC, fl.id DESC`, [req.params.busId]);
    const totalL = fills.reduce((s, f) => s + Number(f.liters || 0), 0);
    const totalC = fills.reduce((s, f) => s + Number(f.cost || 0), 0);
    res.json({
      registration_number: bus ? bus.registration_number : '',
      count: fills.length,
      totalLiters: Math.round(totalL * 100) / 100,
      totalCost: Math.round(totalC * 100) / 100,
      fills: fills.map((f) => ({ ...f, liters: Number(f.liters), cost: Number(f.cost || 0) })),
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load diesel fills for this bus.' }); }
};
