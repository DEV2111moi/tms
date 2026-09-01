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
async function autoLogTrips() {
  try {
    // Check and log for the last 3 days, from oldest (offset 2) to newest (offset 0)
    for (let offset = 2; offset >= 0; offset--) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const targetDateStr = new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);

      // Get all assignments with route details
      const assignments = await query(`
        SELECT a.bus_id, a.driver_id, a.route_id, a.shift,
               r.route_code, r.route_name, r.total_distance, r.origin, r.destination
        FROM assignments a
        JOIN routes r ON r.id = a.route_id
        WHERE a.bus_id IS NOT NULL
      `);

      for (const assign of assignments) {
        // Find scheduled start and end times based on route stops
        const stopsInfo = await query(`
          SELECT MIN(scheduled_time) AS start_t, MAX(scheduled_time) AS end_t
          FROM stops
          WHERE route_id = ?
        `, [assign.route_id]);

        const start_t = (stopsInfo[0] && stopsInfo[0].start_t) || '07:30:00';
        const end_t = (stopsInfo[0] && stopsInfo[0].end_t) || null;

        // Sensible shift cutoff: morning shifts finish by 09:30 AM, evening shifts by 06:00 PM
        const isMorning = String(assign.shift || '').startsWith('morning');
        const defaultEnd = isMorning ? '09:30:00' : '18:00:00';
        const effectiveEnd = (isMorning && end_t && end_t > '12:00:00') ? defaultEnd : (end_t || defaultEnd);

        // If checking for today, ensure current time is past the shift's end time
        if (offset === 0) {
          const now = new Date();
          const nowStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(11, 19);
          if (nowStr < effectiveEnd) {
            continue; // Skip because the shift hasn't finished yet today
          }
        }

        // Check if trip log already exists for this bus, date, and shift
        const existing = await query(`
          SELECT id, start_km, end_km FROM trip_logs
          WHERE bus_id = ? AND log_date = ? AND shift = ?
          LIMIT 1
        `, [assign.bus_id, targetDateStr, assign.shift]);

        if (existing.length > 0) {
          // If the existing log was saved with 0 distance (start_km === end_km), but the route now has distance, update it!
          const dist = Number(assign.total_distance || 0);
          if (dist > 0 && Number(existing[0].start_km) === Number(existing[0].end_km)) {
            const newEnd = Number(existing[0].start_km) + dist;
            await query(`
              UPDATE trip_logs
              SET end_km = ?,
                  start_stop = CASE WHEN start_stop IS NULL OR start_stop = 'Start' THEN ? ELSE start_stop END,
                  end_stop = CASE WHEN end_stop IS NULL OR end_stop = 'End' THEN ? ELSE end_stop END
              WHERE id = ?
            `, [newEnd, assign.origin || 'Start', assign.destination || 'End', existing[0].id]);
          }
          continue;
        }

        let linkedUserId = null;
        if (assign.driver_id) {
          const driverUser = await query(`
            SELECT user_id FROM drivers WHERE id = ?
          `, [assign.driver_id]);
          linkedUserId = (driverUser[0] && driverUser[0].user_id) || null;
        }

          // Determine start_km: last logged end_km for this bus, or current bus odometer
          const lastTrip = await query(`
            SELECT end_km FROM trip_logs
            WHERE bus_id = ? AND end_km IS NOT NULL
            ORDER BY log_date DESC, end_time DESC, id DESC
            LIMIT 1
          `, [assign.bus_id]);

          let start_km = 0;
          if (lastTrip.length > 0 && lastTrip[0].end_km != null) {
            start_km = Number(lastTrip[0].end_km);
          } else {
            const busOdom = await query(`
              SELECT current_odometer_km FROM buses WHERE id = ?
            `, [assign.bus_id]);
            start_km = Number((busOdom[0] && busOdom[0].current_odometer_km) || 0);
          }

          const dist = Number(assign.total_distance || 0);
          const end_km = start_km + dist;

          // Insert trip log
          await query(`
            INSERT INTO trip_logs 
            (bus_id, driver_id, log_date, shift, start_time, start_km, end_time, end_km, start_stop, end_stop)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            assign.bus_id,
            linkedUserId,
            targetDateStr,
            assign.shift,
            `${targetDateStr} ${start_t}`,
            start_km,
            `${targetDateStr} ${end_t}`,
            end_km,
            assign.origin || 'Start',
            assign.destination || 'End'
          ]);

          // Update bus odometer in buses table
          await query(`
            UPDATE buses
            SET current_odometer_km = ?
            WHERE id = ?
          `, [end_km, assign.bus_id]);
      }
    }
  } catch (err) {
    console.error('autoLogTrips error:', err);
  }
}

// GET /api/reports/distance
exports.distance = async (req, res) => {
  const { from, to, inst } = range(req);
  try {
    // Automatically trigger calculation & insertion of any missing assignment trips
    await autoLogTrips();

    const cond = `tl.end_km IS NOT NULL AND tl.start_km IS NOT NULL AND tl.log_date BETWEEN ? AND ? AND (? IS NULL OR r.institution_id = ?)`;
    const days = await query(
      `SELECT tl.log_date AS date, SUM(tl.end_km - tl.start_km) AS km, COUNT(*) AS trips
       FROM trip_logs tl 
       JOIN buses b ON b.id = tl.bus_id 
       LEFT JOIN assignments a ON a.bus_id = tl.bus_id AND a.shift = tl.shift
       LEFT JOIN routes r ON r.id = a.route_id
       WHERE ${cond}
       GROUP BY tl.log_date ORDER BY tl.log_date`, [from, to, inst, inst]);
    
    const byBus = await query(
      `SELECT b.registration_number, 
              COALESCE(i.short_name, '—') AS institution,
              COALESCE(r.route_code, '—') AS route_code,
              COALESCE(r.route_name, '—') AS route_name,
              COALESCE(dr.name, u.name, '—') AS driver_name,
              
              -- Morning 1
              SUM(CASE WHEN tl.shift IN ('morning1', 'morning') THEN (tl.end_km - tl.start_km) ELSE 0 END) AS morning1_km,
              MAX(CASE WHEN tl.shift IN ('morning1', 'morning') THEN tl.start_stop END) AS morning1_start,
              MAX(CASE WHEN tl.shift IN ('morning1', 'morning') THEN tl.end_stop END) AS morning1_end,
              
              -- Morning 2
              SUM(CASE WHEN tl.shift = 'morning2' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS morning2_km,
              MAX(CASE WHEN tl.shift = 'morning2' THEN tl.start_stop END) AS morning2_start,
              MAX(CASE WHEN tl.shift = 'morning2' THEN tl.end_stop END) AS morning2_end,
              
              -- Evening 1
              SUM(CASE WHEN tl.shift IN ('evening1', 'evening') THEN (tl.end_km - tl.start_km) ELSE 0 END) AS evening1_km,
              MAX(CASE WHEN tl.shift IN ('evening1', 'evening') THEN tl.start_stop END) AS evening1_start,
              MAX(CASE WHEN tl.shift IN ('evening1', 'evening') THEN tl.end_stop END) AS evening1_end,
              
              -- Evening 2
              SUM(CASE WHEN tl.shift = 'evening2' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS evening2_km,
              MAX(CASE WHEN tl.shift = 'evening2' THEN tl.start_stop END) AS evening2_start,
              MAX(CASE WHEN tl.shift = 'evening2' THEN tl.end_stop END) AS evening2_end,

              COUNT(tl.id) AS trips,
              SUM(tl.end_km - tl.start_km) AS km
       FROM trip_logs tl
       JOIN buses b ON b.id = tl.bus_id
       LEFT JOIN assignments a ON a.bus_id = tl.bus_id AND a.shift = tl.shift
       LEFT JOIN routes r ON r.id = a.route_id
       LEFT JOIN institutions i ON i.id = r.institution_id
       LEFT JOIN users u ON u.id = tl.driver_id
       LEFT JOIN drivers dr ON dr.id = a.driver_id
       WHERE ${cond}
       GROUP BY b.id, b.registration_number, i.id, i.short_name, r.id, r.route_code, r.route_name, dr.name, u.name
       ORDER BY km DESC`, [from, to, inst, inst]);

    const byInstitution = await query(
      `SELECT COALESCE(i.short_name,'Unassigned') AS institution, COUNT(tl.id) AS trips, SUM(tl.end_km - tl.start_km) AS km
       FROM trip_logs tl 
       JOIN buses b ON b.id = tl.bus_id 
       LEFT JOIN assignments a ON a.bus_id = tl.bus_id AND a.shift = tl.shift
       LEFT JOIN routes r ON r.id = a.route_id
       LEFT JOIN institutions i ON i.id = r.institution_id 
       WHERE ${cond}
       GROUP BY i.short_name ORDER BY km DESC`, [from, to, inst, inst]);
    
    const num = (a) => a.map((r) => ({ 
      ...r, 
      km: Number(r.km || 0), 
      trips: Number(r.trips || 0),
      morning1_km: Number(r.morning1_km || 0),
      morning2_km: Number(r.morning2_km || 0),
      evening1_km: Number(r.evening1_km || 0),
      evening2_km: Number(r.evening2_km || 0)
    }));
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

exports.autoLogTrips = autoLogTrips;
