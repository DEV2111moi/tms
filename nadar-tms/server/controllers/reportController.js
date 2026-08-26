const { query } = require('../db/pool');

const range = (req) => {
  const to = req.query.to || new Date().toISOString().slice(0, 10);
  const from = req.query.from || to;
  const inst = req.query.institutionId || null;
  return { from, to, inst };
};

// GET /api/reports/absentees
exports.absentees = async (req, res) => {
  const { from, to, inst } = range(req);
  try {
    const days = await query(
      `SELECT t.trip_date AS date,
              COUNT(DISTINCT s.id) AS expected,
              COUNT(DISTINCT CASE WHEN a.status='present' THEN a.student_id END) AS present
       FROM trips t
       JOIN students s ON s.route_id = t.route_id AND (? IS NULL OR s.institution_id = ?)
       LEFT JOIN attendance a ON a.student_id = s.id AND a.attendance_date = t.trip_date AND a.status='present'
       WHERE t.trip_date BETWEEN ? AND ?
       GROUP BY t.trip_date ORDER BY t.trip_date`, [inst, inst, from, to]);
    const students = await query(
      `SELECT s.student_id, s.name, s.class_grade, i.short_name AS institution, r.route_code,
              (SELECT COUNT(DISTINCT t.trip_date) FROM trips t WHERE t.route_id = s.route_id AND t.trip_date BETWEEN ? AND ?) AS school_days,
              (SELECT COUNT(DISTINCT a.attendance_date) FROM attendance a WHERE a.student_id = s.id AND a.status='present' AND a.attendance_date BETWEEN ? AND ?) AS present_days
       FROM students s
       LEFT JOIN routes r ON r.id = s.route_id
       LEFT JOIN institutions i ON i.id = s.institution_id
       WHERE (? IS NULL OR s.institution_id = ?)
       ORDER BY s.name`, [from, to, from, to, inst, inst]);
    const rows = students.map((s) => ({ ...s, absent_days: Math.max(0, (s.school_days || 0) - (s.present_days || 0)) }))
      .sort((a, b) => b.absent_days - a.absent_days);
    res.json({ from, to,
      days: days.map((d) => ({ date: d.date, expected: Number(d.expected), present: Number(d.present), absent: Number(d.expected) - Number(d.present) })),
      students: rows });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not build the absentee report.' }); }
};

// GET /api/reports/fuel-usage
exports.fuel = async (req, res) => {
  const { from, to, inst } = range(req);
  try {
    const days = await query(
      `SELECT fl.fuel_date AS date, SUM(fl.liters) AS liters, SUM(fl.cost) AS cost, COUNT(*) AS fills
       FROM fuel_logs fl JOIN buses b ON b.id = fl.bus_id
       WHERE fl.fuel_date BETWEEN ? AND ? AND (? IS NULL OR b.institution_id = ?)
       GROUP BY fl.fuel_date ORDER BY fl.fuel_date`, [from, to, inst, inst]);
    const byBus = await query(
      `SELECT b.registration_number, i.short_name AS institution, COUNT(fl.id) AS fills, SUM(fl.liters) AS liters, SUM(fl.cost) AS cost
       FROM fuel_logs fl JOIN buses b ON b.id = fl.bus_id LEFT JOIN institutions i ON i.id = b.institution_id
       WHERE fl.fuel_date BETWEEN ? AND ? AND (? IS NULL OR b.institution_id = ?)
       GROUP BY b.id, b.registration_number, i.short_name ORDER BY liters DESC`, [from, to, inst, inst]);
    const byInstitution = await query(
      `SELECT COALESCE(i.short_name,'Unassigned') AS institution, COUNT(fl.id) AS fills, SUM(fl.liters) AS liters, SUM(fl.cost) AS cost
       FROM fuel_logs fl JOIN buses b ON b.id = fl.bus_id LEFT JOIN institutions i ON i.id = b.institution_id
       WHERE fl.fuel_date BETWEEN ? AND ? AND (? IS NULL OR b.institution_id = ?)
       GROUP BY i.short_name ORDER BY liters DESC`, [from, to, inst, inst]);
    const num = (a) => a.map((r) => ({ ...r, liters: Number(r.liters || 0), cost: Number(r.cost || 0), fills: Number(r.fills || 0) }));
    res.json({ from, to, days: num(days), byBus: num(byBus), byInstitution: num(byInstitution) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not build the fuel report.' }); }
};

// GET /api/reports/distance
exports.distance = async (req, res) => {
  const { from, to, inst } = range(req);
  try {
    const cond = `tl.end_km IS NOT NULL AND tl.start_km IS NOT NULL AND tl.log_date BETWEEN ? AND ? AND (? IS NULL OR b.institution_id = ?)`;
    const days = await query(
      `SELECT tl.log_date AS date, SUM(tl.end_km - tl.start_km) AS km, COUNT(*) AS trips
       FROM trip_logs tl JOIN buses b ON b.id = tl.bus_id WHERE ${cond}
       GROUP BY tl.log_date ORDER BY tl.log_date`, [from, to, inst, inst]);
    const byBus = await query(
      `SELECT b.registration_number, i.short_name AS institution, COUNT(tl.id) AS trips, SUM(tl.end_km - tl.start_km) AS km
       FROM trip_logs tl JOIN buses b ON b.id = tl.bus_id LEFT JOIN institutions i ON i.id = b.institution_id WHERE ${cond}
       GROUP BY b.id, b.registration_number, i.short_name ORDER BY km DESC`, [from, to, inst, inst]);
    const byInstitution = await query(
      `SELECT COALESCE(i.short_name,'Unassigned') AS institution, COUNT(tl.id) AS trips, SUM(tl.end_km - tl.start_km) AS km
       FROM trip_logs tl JOIN buses b ON b.id = tl.bus_id LEFT JOIN institutions i ON i.id = b.institution_id WHERE ${cond}
       GROUP BY i.short_name ORDER BY km DESC`, [from, to, inst, inst]);
    const num = (a) => a.map((r) => ({ ...r, km: Number(r.km || 0), trips: Number(r.trips || 0) }));
    res.json({ from, to, days: num(days), byBus: num(byBus), byInstitution: num(byInstitution) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not build the distance report.' }); }
};

// GET /api/reports/maintenance
exports.maintenance = async (req, res) => {
  const { from, to, inst } = range(req);
  try {
    const records = await query(
      `SELECT m.service_date, m.service_type, m.cost, m.odometer, m.notes,
              b.registration_number, COALESCE(i.short_name,'Unassigned') AS institution
       FROM maintenance_logs m JOIN buses b ON b.id = m.bus_id LEFT JOIN institutions i ON i.id = b.institution_id
       WHERE m.service_date BETWEEN ? AND ? AND (? IS NULL OR b.institution_id = ?)
       ORDER BY m.service_date DESC`, [from, to, inst, inst]);
    const byBus = await query(
      `SELECT b.registration_number, COALESCE(i.short_name,'Unassigned') AS institution, COUNT(m.id) AS jobs, SUM(m.cost) AS cost
       FROM maintenance_logs m JOIN buses b ON b.id = m.bus_id LEFT JOIN institutions i ON i.id = b.institution_id
       WHERE m.service_date BETWEEN ? AND ? AND (? IS NULL OR b.institution_id = ?)
       GROUP BY b.id, b.registration_number, i.short_name ORDER BY cost DESC`, [from, to, inst, inst]);
    const byInstitution = await query(
      `SELECT COALESCE(i.short_name,'Unassigned') AS institution, COUNT(m.id) AS jobs, SUM(m.cost) AS cost
       FROM maintenance_logs m JOIN buses b ON b.id = m.bus_id LEFT JOIN institutions i ON i.id = b.institution_id
       WHERE m.service_date BETWEEN ? AND ? AND (? IS NULL OR b.institution_id = ?)
       GROUP BY i.short_name ORDER BY cost DESC`, [from, to, inst, inst]);
    const numC = (a) => a.map((r) => ({ ...r, cost: Number(r.cost || 0), jobs: Number(r.jobs || 0) }));
    res.json({ from, to, records: records.map((r) => ({ ...r, cost: Number(r.cost || 0) })), byBus: numC(byBus), byInstitution: numC(byInstitution) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not build the maintenance report.' }); }
};

// GET /api/reports/driver-trips
exports.driverTrips = async (req, res) => {
  const { from, to } = range(req);
  try {
    const records = await query(
      `SELECT tl.log_date, tl.shift, tl.start_km, tl.end_km, tl.end_stop,
              u.name AS driver_name, b.registration_number
       FROM trip_logs tl LEFT JOIN users u ON u.id = tl.driver_id LEFT JOIN buses b ON b.id = tl.bus_id
       WHERE tl.log_date BETWEEN ? AND ?
       ORDER BY tl.log_date DESC, u.name, tl.shift`, [from, to]);
    const byDriver = await query(
      `SELECT u.name AS driver_name,
              COUNT(tl.id) AS trips,
              SUM(CASE WHEN tl.end_time IS NOT NULL THEN 1 ELSE 0 END) AS completed,
              SUM(CASE WHEN tl.end_km IS NOT NULL AND tl.start_km IS NOT NULL THEN tl.end_km - tl.start_km ELSE 0 END) AS km,
              COUNT(DISTINCT tl.log_date) AS days
       FROM trip_logs tl LEFT JOIN users u ON u.id = tl.driver_id
       WHERE tl.log_date BETWEEN ? AND ?
       GROUP BY u.name ORDER BY trips DESC`, [from, to]);
    res.json({ from, to,
      records: records.map(r => ({ ...r, km: (r.end_km!=null && r.start_km!=null) ? (r.end_km - r.start_km) : null })),
      byDriver: byDriver.map(d => ({ ...d, trips: Number(d.trips), completed: Number(d.completed), km: Number(d.km || 0), days: Number(d.days) })) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not build the driver trips report.' }); }
};

// GET /api/reports/routes-stops
exports.routesStops = async (req, res) => {
  const inst = req.query.institutionId || null;
  try {
    const routes = await query(
      `SELECT r.id, r.route_code, r.route_name, r.origin, r.destination, r.total_distance, r.shift,
              COALESCE(i.short_name, 'Unassigned') AS institution,
              (SELECT COUNT(*) FROM stops s WHERE s.route_id = r.id) AS total_stops
       FROM routes r
       LEFT JOIN institutions i ON i.id = r.institution_id
       WHERE (? IS NULL OR r.institution_id = ?)
       ORDER BY r.route_code`, [inst, inst]);
    
    const stops = await query(
      `SELECT s.id, s.route_id, s.stop_name, s.sequence, s.scheduled_time,
              r.route_code, r.route_name, COALESCE(i.short_name, 'Unassigned') AS institution
       FROM stops s
       JOIN routes r ON r.id = s.route_id
       LEFT JOIN institutions i ON i.id = r.institution_id
       WHERE (? IS NULL OR r.institution_id = ?)
       ORDER BY r.route_code, s.sequence`, [inst, inst]);
    
    res.json({ routes, stops });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not build the routes & stops report.' });
  }
};
