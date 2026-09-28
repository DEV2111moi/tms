const { query } = require('../db/pool');

const range = (req) => {
  const to = req.query.to || new Date().toISOString().slice(0, 10);
  const from = req.query.from || to;
  const inst = req.query.institutionId || null;
  const busId = req.query.busId || null;
  return { from, to, inst, busId };
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

      // Get all assignments with route details, prioritizing assignments that have a driver assigned
      const rawAssignments = await query(`
        SELECT a.bus_id, a.driver_id, a.route_id, a.shift,
               r.route_code, r.route_name, r.total_distance, r.origin, r.destination
        FROM assignments a
        JOIN routes r ON r.id = a.route_id
        WHERE a.bus_id IS NOT NULL
        ORDER BY (a.driver_id IS NOT NULL) DESC, a.id DESC
      `);

      // Deduplicate so each (bus_id, shift) is processed once with the most relevant assignment
      const seen = new Set();
      const assignments = [];
      for (const a of rawAssignments) {
        const key = `${a.bus_id}_${a.shift}`;
        if (!seen.has(key)) {
          seen.add(key);
          assignments.push(a);
        }
      }

      // Sort shifts in chronological sequence so odometer advances continuously
      const shiftOrder = {
        morning: 1, morning1: 1, morning2: 2, morning3: 3, morning4: 4,
        evening: 5, evening1: 5, evening2: 6, evening3: 7, evening4: 8,
        night: 9
      };
      assignments.sort((a, b) => (shiftOrder[a.shift] || 99) - (shiftOrder[b.shift] || 99));

      // Get all active / daily substitutions for this date
      const daySubs = await query(`
        SELECT ds.*,
               b_orig.registration_number AS orig_bus_number,
               b_sub.registration_number AS sub_bus_number
        FROM daily_substitutions ds
        JOIN buses b_orig ON b_orig.id = ds.original_bus_id
        JOIN buses b_sub ON b_sub.id = ds.substitute_bus_id
        WHERE (ds.sub_date = ? OR ds.status = 'active')
      `, [targetDateStr]);

      for (const assign of assignments) {
        // Check if assigned bus was broken down and substituted
        const sub = daySubs.find(s => 
          Number(s.original_bus_id) === Number(assign.bus_id) && 
          (s.shifts === 'all' || !s.shifts || s.shifts === assign.shift)
        );

        const targetBusId = sub ? sub.substitute_bus_id : assign.bus_id;
        const effectiveDriverId = sub ? (sub.substitute_driver_id || assign.driver_id) : assign.driver_id;

        // If trip was previously logged under broken-down bus, update to substitute bus
        if (sub) {
          await query(`
            UPDATE trip_logs 
            SET bus_id = ?
            WHERE bus_id = ? AND log_date = ? AND shift = ?
          `, [targetBusId, assign.bus_id, targetDateStr, assign.shift]);
        }

        // Find scheduled start and end times based on route stops
        const stopsInfo = await query(`
          SELECT MIN(scheduled_time) AS start_t, MAX(scheduled_time) AS end_t
          FROM stops
          WHERE route_id = ?
        `, [assign.route_id]);

        const isMorning = String(assign.shift || '').startsWith('morning');
        let defaultStart = '07:30:00';
        let defaultEnd = '09:30:00';
        if (assign.shift === 'morning2') {
          defaultStart = '08:30:00';
          defaultEnd = '10:30:00';
        } else if (assign.shift === 'morning3') {
          defaultStart = '09:30:00';
          defaultEnd = '11:30:00';
        } else if (assign.shift === 'morning4') {
          defaultStart = '10:30:00';
          defaultEnd = '12:30:00';
        } else if (assign.shift === 'evening1' || assign.shift === 'evening') {
          defaultStart = '15:30:00';
          defaultEnd = '17:30:00';
        } else if (assign.shift === 'evening2') {
          defaultStart = '16:30:00';
          defaultEnd = '18:30:00';
        } else if (assign.shift === 'evening3') {
          defaultStart = '17:30:00';
          defaultEnd = '19:30:00';
        } else if (assign.shift === 'evening4') {
          defaultStart = '18:30:00';
          defaultEnd = '20:30:00';
        }

        const start_t = (stopsInfo[0] && stopsInfo[0].start_t) || defaultStart;
        const end_t = (stopsInfo[0] && stopsInfo[0].end_t) || null;

        // Sensible shift cutoff
        const effectiveEnd = (isMorning && end_t && end_t > '13:00:00') ? defaultEnd : (end_t || defaultEnd);

        // If checking for today, ensure current time is past the shift's end time
        if (offset === 0) {
          const now = new Date();
          const nowStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(11, 19);
          if (nowStr < effectiveEnd) {
            continue; // Skip because the shift hasn't finished yet today
          }
        }

        let linkedUserId = null;
        if (effectiveDriverId) {
          const driverUser = await query(`
            SELECT user_id FROM drivers WHERE id = ?
          `, [effectiveDriverId]);
          linkedUserId = (driverUser[0] && driverUser[0].user_id) || null;
        }

        // Check if trip log already exists for this bus, date, and shift
        const existing = await query(`
          SELECT id, route_id, driver_id, start_km, end_km, start_stop, end_stop FROM trip_logs
          WHERE bus_id = ? AND log_date = ? AND shift = ?
          LIMIT 1
        `, [targetBusId, targetDateStr, assign.shift]);

        if (existing.length > 0) {
          const ex = existing[0];
          const dist = Math.round(Number(assign.total_distance || 0));

          let shouldUpdate = false;
          let newRouteId = ex.route_id;
          let newDriverId = ex.driver_id;
          let newStartStop = ex.start_stop;
          let newEndStop = ex.end_stop;
          let newEndKm = ex.end_km;

          // If route was mismatched or updated in assignments
          if (ex.route_id !== assign.route_id) {
            newRouteId = assign.route_id;
            newStartStop = assign.origin || 'Start';
            newEndStop = assign.destination || 'End';
            if (dist > 0 && ex.start_km != null) {
              newEndKm = Number(ex.start_km) + dist;
            }
            shouldUpdate = true;
          }

          // If linked user is available now
          if (linkedUserId && ex.driver_id !== linkedUserId) {
            newDriverId = linkedUserId;
            shouldUpdate = true;
          }

          // If existing distance was 0 but route has distance
          if (dist > 0 && Number(ex.start_km) === Number(ex.end_km)) {
            newEndKm = Number(ex.start_km) + dist;
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            await query(`
              UPDATE trip_logs
              SET route_id = ?,
                  driver_id = ?,
                  start_stop = ?,
                  end_stop = ?,
                  end_km = ?
              WHERE id = ?
            `, [newRouteId, newDriverId, newStartStop, newEndStop, newEndKm, ex.id]);
          }
          continue;
        }

        // Determine start_km: last logged end_km for this bus, or current bus odometer
        const lastTrip = await query(`
          SELECT end_km FROM trip_logs
          WHERE bus_id = ? AND end_km IS NOT NULL
          ORDER BY log_date DESC, end_time DESC, id DESC
          LIMIT 1
        `, [targetBusId]);

        let start_km = 0;
        if (lastTrip.length > 0 && lastTrip[0].end_km != null) {
          start_km = Number(lastTrip[0].end_km);
        } else {
          const busOdom = await query(`
            SELECT current_odometer_km FROM buses WHERE id = ?
          `, [targetBusId]);
          start_km = Number((busOdom[0] && busOdom[0].current_odometer_km) || 0);
        }

        const dist = Math.round(Number(assign.total_distance || 0));
        const end_km = start_km + dist;

        // Insert trip log
        await query(`
          INSERT INTO trip_logs 
          (bus_id, route_id, driver_id, log_date, shift, start_time, start_km, end_time, end_km, start_stop, end_stop)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          targetBusId,
          assign.route_id,
          linkedUserId,
          targetDateStr,
          assign.shift,
          `${targetDateStr} ${start_t || defaultStart}`,
          start_km,
          `${targetDateStr} ${effectiveEnd || defaultEnd}`,
          end_km,
          assign.origin || 'Start',
          assign.destination || 'End'
        ]);

        // Update bus odometer in buses table
        await query(`
          UPDATE buses
          SET current_odometer_km = ?
          WHERE id = ?
        `, [end_km, targetBusId]);
      }
    }
  } catch (err) {
    console.error('autoLogTrips error:', err);
  }
}

// GET /api/reports/distance
exports.distance = async (req, res) => {
  const { from, to, inst, busId } = range(req);
  try {
    // Automatically trigger calculation & insertion of any missing assignment trips
    await autoLogTrips();

    const cond = `tl.end_km IS NOT NULL AND tl.start_km IS NOT NULL AND tl.log_date BETWEEN ? AND ? AND (? IS NULL OR r.institution_id = ? OR b.institution_id = ?) AND (? IS NULL OR b.id = ?)`;
    const params = [from, to, inst, inst, inst, busId, busId];

    const days = await query(
      `SELECT tl.log_date AS date, SUM(tl.end_km - tl.start_km) AS km, COUNT(tl.id) AS trips
       FROM trip_logs tl 
       JOIN buses b ON b.id = tl.bus_id 
       LEFT JOIN routes r ON r.id = COALESCE(tl.route_id, (SELECT a2.route_id FROM assignments a2 WHERE a2.bus_id = tl.bus_id AND a2.shift = tl.shift ORDER BY (a2.driver_id IS NOT NULL) DESC, a2.id DESC LIMIT 1))
       WHERE ${cond}
       GROUP BY tl.log_date ORDER BY tl.log_date`, params);
    
    const byBus = await query(
      `SELECT b.id AS bus_id,
              b.registration_number, 
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
              
              -- Morning 3
              SUM(CASE WHEN tl.shift = 'morning3' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS morning3_km,
              MAX(CASE WHEN tl.shift = 'morning3' THEN tl.start_stop END) AS morning3_start,
              MAX(CASE WHEN tl.shift = 'morning3' THEN tl.end_stop END) AS morning3_end,

              -- Morning 4
              SUM(CASE WHEN tl.shift = 'morning4' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS morning4_km,
              MAX(CASE WHEN tl.shift = 'morning4' THEN tl.start_stop END) AS morning4_start,
              MAX(CASE WHEN tl.shift = 'morning4' THEN tl.end_stop END) AS morning4_end,

              -- Evening 1
              SUM(CASE WHEN tl.shift IN ('evening1', 'evening') THEN (tl.end_km - tl.start_km) ELSE 0 END) AS evening1_km,
              MAX(CASE WHEN tl.shift IN ('evening1', 'evening') THEN tl.start_stop END) AS evening1_start,
              MAX(CASE WHEN tl.shift IN ('evening1', 'evening') THEN tl.end_stop END) AS evening1_end,
              
              -- Evening 2
              SUM(CASE WHEN tl.shift = 'evening2' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS evening2_km,
              MAX(CASE WHEN tl.shift = 'evening2' THEN tl.start_stop END) AS evening2_start,
              MAX(CASE WHEN tl.shift = 'evening2' THEN tl.end_stop END) AS evening2_end,

              -- Evening 3
              SUM(CASE WHEN tl.shift = 'evening3' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS evening3_km,
              MAX(CASE WHEN tl.shift = 'evening3' THEN tl.start_stop END) AS evening3_start,
              MAX(CASE WHEN tl.shift = 'evening3' THEN tl.end_stop END) AS evening3_end,

              -- Evening 4
              SUM(CASE WHEN tl.shift = 'evening4' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS evening4_km,
              MAX(CASE WHEN tl.shift = 'evening4' THEN tl.start_stop END) AS evening4_start,
              MAX(CASE WHEN tl.shift = 'evening4' THEN tl.end_stop END) AS evening4_end,

              COUNT(tl.id) AS trips,
              SUM(tl.end_km - tl.start_km) AS km
       FROM trip_logs tl
       JOIN buses b ON b.id = tl.bus_id
       LEFT JOIN routes r ON r.id = COALESCE(tl.route_id, (SELECT a2.route_id FROM assignments a2 WHERE a2.bus_id = tl.bus_id AND a2.shift = tl.shift ORDER BY (a2.driver_id IS NOT NULL) DESC, a2.id DESC LIMIT 1))
       LEFT JOIN institutions i ON i.id = COALESCE(r.institution_id, b.institution_id)
       LEFT JOIN users u ON u.id = tl.driver_id
       LEFT JOIN drivers dr ON dr.id = COALESCE(
         (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.shift = tl.shift AND a3.route_id = tl.route_id AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
         (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.shift = tl.shift AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
         (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
         (SELECT d2.id FROM drivers d2 WHERE d2.route_id = tl.route_id ORDER BY d2.id DESC LIMIT 1)
       )
       WHERE ${cond}
       GROUP BY b.id, b.registration_number, i.id, i.short_name, r.id, r.route_code, r.route_name, dr.name, u.name
       ORDER BY km DESC`, params);

    const byInstitution = await query(
      `SELECT COALESCE(i.short_name,'Unassigned') AS institution, COUNT(tl.id) AS trips, SUM(tl.end_km - tl.start_km) AS km
       FROM trip_logs tl 
       JOIN buses b ON b.id = tl.bus_id 
       LEFT JOIN routes r ON r.id = COALESCE(tl.route_id, (SELECT a2.route_id FROM assignments a2 WHERE a2.bus_id = tl.bus_id AND a2.shift = tl.shift ORDER BY (a2.driver_id IS NOT NULL) DESC, a2.id DESC LIMIT 1))
       LEFT JOIN institutions i ON i.id = COALESCE(r.institution_id, b.institution_id)
       WHERE ${cond}
       GROUP BY i.short_name ORDER BY km DESC`, params);

    // Fetch substitutions for distance report
    const substitutions = await query(`
      SELECT ds.id,
             ds.sub_date,
             ds.original_bus_id,
             b_orig.registration_number AS original_bus_number,
             COALESCE(dr_orig.name, '—') AS original_driver_name,
             ds.substitute_bus_id,
             b_sub.registration_number AS substitute_bus_number,
             COALESCE(dr_sub.name, '—') AS substitute_driver_name,
             ds.route_id,
             COALESCE(r.route_code, '—') AS route_code,
             COALESCE(r.route_name, '—') AS route_name,
             ds.shifts,
             ds.reason,
             ds.status,
             ds.notes
      FROM daily_substitutions ds
      JOIN buses b_orig ON b_orig.id = ds.original_bus_id
      JOIN buses b_sub ON b_sub.id = ds.substitute_bus_id
      LEFT JOIN routes r ON r.id = ds.route_id
      LEFT JOIN drivers dr_orig ON dr_orig.id = ds.original_driver_id
      LEFT JOIN drivers dr_sub ON dr_sub.id = ds.substitute_driver_id
      WHERE (ds.sub_date BETWEEN ? AND ? OR ds.status = 'active')
        AND (? IS NULL OR r.institution_id = ? OR b_orig.institution_id = ? OR b_sub.institution_id = ?)
        AND (? IS NULL OR b_orig.id = ? OR b_sub.id = ?)
      ORDER BY ds.sub_date DESC, ds.id DESC
    `, [from, to, inst, inst, inst, inst, busId, busId, busId]);

    // Attach breakdowns and cover duties to each bus in distance report
    byBus.forEach(b => {
      b.breakdowns = substitutions.filter(s => Number(s.original_bus_id) === Number(b.bus_id));
      b.cover_duties = substitutions.filter(s => Number(s.substitute_bus_id) === Number(b.bus_id));
    });
    
    const num = (a) => a.map((r) => ({ 
      ...r, 
      km: Number(r.km || 0), 
      trips: Number(r.trips || 0),
      morning1_km: Number(r.morning1_km || 0),
      morning2_km: Number(r.morning2_km || 0),
      morning3_km: Number(r.morning3_km || 0),
      morning4_km: Number(r.morning4_km || 0),
      evening1_km: Number(r.evening1_km || 0),
      evening2_km: Number(r.evening2_km || 0),
      evening3_km: Number(r.evening3_km || 0),
      evening4_km: Number(r.evening4_km || 0),
      breakdowns: r.breakdowns || [],
      cover_duties: r.cover_duties || []
    }));
    res.json({ from, to, days: num(days), byBus: num(byBus), byInstitution: num(byInstitution), substitutions });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not build the distance report.' }); }
};

// GET /api/reports/bus-wise
exports.busWise = async (req, res) => {
  const { from, to, inst, busId } = range(req);
  try {
    await autoLogTrips();

    const cond = `tl.end_km IS NOT NULL AND tl.start_km IS NOT NULL 
      AND tl.log_date BETWEEN ? AND ? 
      AND (? IS NULL OR r.institution_id = ? OR b.institution_id = ?)
      AND (? IS NULL OR b.id = ?)`;
    const params = [from, to, inst, inst, inst, busId, busId];

    const buses = await query(`
      SELECT b.id AS bus_id,
             b.registration_number,
             COALESCE(GROUP_CONCAT(DISTINCT i.short_name ORDER BY i.short_name SEPARATOR ', '), '—') AS institution,
             COUNT(tl.id) AS total_trips,
             SUM(tl.end_km - tl.start_km) AS total_km,
             
             -- Morning 1
             SUM(CASE WHEN tl.shift IN ('morning1', 'morning') THEN 1 ELSE 0 END) AS morning1_trips,
             SUM(CASE WHEN tl.shift IN ('morning1', 'morning') THEN (tl.end_km - tl.start_km) ELSE 0 END) AS morning1_km,
             
             -- Morning 2
             SUM(CASE WHEN tl.shift = 'morning2' THEN 1 ELSE 0 END) AS morning2_trips,
             SUM(CASE WHEN tl.shift = 'morning2' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS morning2_km,
             
             -- Morning 3
             SUM(CASE WHEN tl.shift = 'morning3' THEN 1 ELSE 0 END) AS morning3_trips,
             SUM(CASE WHEN tl.shift = 'morning3' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS morning3_km,

             -- Morning 4
             SUM(CASE WHEN tl.shift = 'morning4' THEN 1 ELSE 0 END) AS morning4_trips,
             SUM(CASE WHEN tl.shift = 'morning4' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS morning4_km,

             -- Evening 1
             SUM(CASE WHEN tl.shift IN ('evening1', 'evening') THEN 1 ELSE 0 END) AS evening1_trips,
             SUM(CASE WHEN tl.shift IN ('evening1', 'evening') THEN (tl.end_km - tl.start_km) ELSE 0 END) AS evening1_km,
             
             -- Evening 2
             SUM(CASE WHEN tl.shift = 'evening2' THEN 1 ELSE 0 END) AS evening2_trips,
             SUM(CASE WHEN tl.shift = 'evening2' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS evening2_km,

             -- Evening 3
             SUM(CASE WHEN tl.shift = 'evening3' THEN 1 ELSE 0 END) AS evening3_trips,
             SUM(CASE WHEN tl.shift = 'evening3' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS evening3_km,

             -- Evening 4
             SUM(CASE WHEN tl.shift = 'evening4' THEN 1 ELSE 0 END) AS evening4_trips,
             SUM(CASE WHEN tl.shift = 'evening4' THEN (tl.end_km - tl.start_km) ELSE 0 END) AS evening4_km,
             
             COALESCE(GROUP_CONCAT(DISTINCT r.route_code ORDER BY r.route_code SEPARATOR ', '), '—') AS routes,
             COALESCE(GROUP_CONCAT(DISTINCT COALESCE(dr.name, u.name) ORDER BY COALESCE(dr.name, u.name) SEPARATOR ', '), '—') AS drivers
      FROM trip_logs tl
      JOIN buses b ON b.id = tl.bus_id
      LEFT JOIN routes r ON r.id = COALESCE(tl.route_id, (SELECT a2.route_id FROM assignments a2 WHERE a2.bus_id = tl.bus_id AND a2.shift = tl.shift ORDER BY (a2.driver_id IS NOT NULL) DESC, a2.id DESC LIMIT 1))
      LEFT JOIN institutions i ON i.id = COALESCE(r.institution_id, b.institution_id)
      LEFT JOIN users u ON u.id = tl.driver_id
      LEFT JOIN drivers dr ON dr.id = COALESCE(
        (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.shift = tl.shift AND a3.route_id = tl.route_id AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
        (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.shift = tl.shift AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
        (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
        (SELECT d2.id FROM drivers d2 WHERE d2.route_id = tl.route_id ORDER BY d2.id DESC LIMIT 1)
      )
      WHERE ${cond}
      GROUP BY b.id, b.registration_number
      ORDER BY total_km DESC, total_trips DESC
    `, params);

    const trips = await query(`
      SELECT tl.id,
             tl.bus_id,
             b.registration_number,
             tl.log_date AS date,
             tl.shift,
             tl.start_km,
             tl.end_km,
             (tl.end_km - tl.start_km) AS km,
             tl.start_stop,
             tl.end_stop,
             tl.start_time,
             tl.end_time,
             COALESCE(i.short_name, '—') AS institution,
             COALESCE(r.route_code, '—') AS route_code,
             COALESCE(r.route_name, '—') AS route_name,
             COALESCE(dr.name, u.name, '—') AS driver_name
      FROM trip_logs tl
      JOIN buses b ON b.id = tl.bus_id
      LEFT JOIN routes r ON r.id = COALESCE(tl.route_id, (SELECT a2.route_id FROM assignments a2 WHERE a2.bus_id = tl.bus_id AND a2.shift = tl.shift ORDER BY (a2.driver_id IS NOT NULL) DESC, a2.id DESC LIMIT 1))
      LEFT JOIN institutions i ON i.id = COALESCE(r.institution_id, b.institution_id)
      LEFT JOIN users u ON u.id = tl.driver_id
      LEFT JOIN drivers dr ON dr.id = COALESCE(
        (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.shift = tl.shift AND a3.route_id = tl.route_id AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
        (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.shift = tl.shift AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
        (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
        (SELECT d2.id FROM drivers d2 WHERE d2.route_id = tl.route_id ORDER BY d2.id DESC LIMIT 1)
      )
      WHERE ${cond}
      ORDER BY tl.log_date DESC, tl.id DESC
    `, params);

    // Fetch all substitutions in the date range (or active substitutions)
    const substitutions = await query(`
      SELECT ds.id,
             ds.sub_date,
             ds.original_bus_id,
             b_orig.registration_number AS original_bus_number,
             COALESCE(dr_orig.name, '—') AS original_driver_name,
             ds.substitute_bus_id,
             b_sub.registration_number AS substitute_bus_number,
             COALESCE(dr_sub.name, '—') AS substitute_driver_name,
             ds.route_id,
             COALESCE(r.route_code, '—') AS route_code,
             COALESCE(r.route_name, '—') AS route_name,
             ds.shifts,
             ds.reason,
             ds.status,
             ds.notes,
             ds.created_at,
             ds.updated_at
      FROM daily_substitutions ds
      JOIN buses b_orig ON b_orig.id = ds.original_bus_id
      JOIN buses b_sub ON b_sub.id = ds.substitute_bus_id
      LEFT JOIN routes r ON r.id = ds.route_id
      LEFT JOIN drivers dr_orig ON dr_orig.id = ds.original_driver_id
      LEFT JOIN drivers dr_sub ON dr_sub.id = ds.substitute_driver_id
      WHERE (ds.sub_date BETWEEN ? AND ? OR ds.status = 'active')
        AND (? IS NULL OR r.institution_id = ? OR b_orig.institution_id = ? OR b_sub.institution_id = ?)
        AND (? IS NULL OR b_orig.id = ? OR b_sub.id = ?)
      ORDER BY ds.sub_date DESC, ds.id DESC
    `, [from, to, inst, inst, inst, inst, busId, busId, busId]);

    // Ensure all buses involved in substitutions also exist in the buses list even if they logged 0 trips
    const busMap = new Map();
    buses.forEach(b => busMap.set(Number(b.bus_id), b));

    for (const s of substitutions) {
      if (!busMap.has(Number(s.original_bus_id))) {
        const bInfo = await query(`
          SELECT b.id AS bus_id, b.registration_number, COALESCE(i.short_name, '—') AS institution
          FROM buses b LEFT JOIN institutions i ON i.id = b.institution_id WHERE b.id = ?
        `, [s.original_bus_id]);
        if (bInfo.length > 0) {
          const newB = {
            bus_id: bInfo[0].bus_id,
            registration_number: bInfo[0].registration_number,
            institution: bInfo[0].institution,
            total_trips: 0,
            total_km: 0,
            morning1_trips: 0, morning1_km: 0,
            morning2_trips: 0, morning2_km: 0,
            morning3_trips: 0, morning3_km: 0,
            morning4_trips: 0, morning4_km: 0,
            evening1_trips: 0, evening1_km: 0,
            evening2_trips: 0, evening2_km: 0,
            evening3_trips: 0, evening3_km: 0,
            evening4_trips: 0, evening4_km: 0,
            routes: s.route_code || '—',
            drivers: s.original_driver_name || '—'
          };
          busMap.set(Number(s.original_bus_id), newB);
          buses.push(newB);
        }
      }
      if (!busMap.has(Number(s.substitute_bus_id))) {
        const bInfo = await query(`
          SELECT b.id AS bus_id, b.registration_number, COALESCE(i.short_name, '—') AS institution
          FROM buses b LEFT JOIN institutions i ON i.id = b.institution_id WHERE b.id = ?
        `, [s.substitute_bus_id]);
        if (bInfo.length > 0) {
          const newB = {
            bus_id: bInfo[0].bus_id,
            registration_number: bInfo[0].registration_number,
            institution: bInfo[0].institution,
            total_trips: 0,
            total_km: 0,
            morning1_trips: 0, morning1_km: 0,
            morning2_trips: 0, morning2_km: 0,
            morning3_trips: 0, morning3_km: 0,
            morning4_trips: 0, morning4_km: 0,
            evening1_trips: 0, evening1_km: 0,
            evening2_trips: 0, evening2_km: 0,
            evening3_trips: 0, evening3_km: 0,
            evening4_trips: 0, evening4_km: 0,
            routes: s.route_code || '—',
            drivers: s.substitute_driver_name || '—'
          };
          busMap.set(Number(s.substitute_bus_id), newB);
          buses.push(newB);
        }
      }
    }

    // Attach breakdowns and cover duties to each bus
    buses.forEach(b => {
      b.breakdowns = substitutions.filter(s => Number(s.original_bus_id) === Number(b.bus_id));
      b.cover_duties = substitutions.filter(s => Number(s.substitute_bus_id) === Number(b.bus_id));
    });

    // Tag trips with substitution metadata if applicable
    trips.forEach(t => {
      const match = substitutions.find(s => 
        Number(s.substitute_bus_id) === Number(t.bus_id) &&
        (s.sub_date === t.date || s.status === 'active') &&
        (Number(s.route_id) === Number(t.route_id) || s.route_code === t.route_code)
      );
      if (match) {
        t.is_substitution = true;
        t.original_bus_number = match.original_bus_number;
        t.original_bus_id = match.original_bus_id;
        t.substitution_reason = match.reason;
      }
    });

    res.json({
      from,
      to,
      buses: buses.map(b => ({
        ...b,
        total_trips: Number(b.total_trips || 0),
        total_km: Number(b.total_km || 0),
        morning1_trips: Number(b.morning1_trips || 0),
        morning1_km: Number(b.morning1_km || 0),
        morning2_trips: Number(b.morning2_trips || 0),
        morning2_km: Number(b.morning2_km || 0),
        morning3_trips: Number(b.morning3_trips || 0),
        morning3_km: Number(b.morning3_km || 0),
        morning4_trips: Number(b.morning4_trips || 0),
        morning4_km: Number(b.morning4_km || 0),
        evening1_trips: Number(b.evening1_trips || 0),
        evening1_km: Number(b.evening1_km || 0),
        evening2_trips: Number(b.evening2_trips || 0),
        evening2_km: Number(b.evening2_km || 0),
        evening3_trips: Number(b.evening3_trips || 0),
        evening3_km: Number(b.evening3_km || 0),
        evening4_trips: Number(b.evening4_trips || 0),
        evening4_km: Number(b.evening4_km || 0),
        breakdowns: b.breakdowns || [],
        cover_duties: b.cover_duties || []
      })),
      trips: trips.map(t => ({
        ...t,
        km: Number(t.km || 0),
        start_km: Number(t.start_km || 0),
        end_km: Number(t.end_km || 0)
      })),
      substitutions
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not build the bus-wise report.' });
  }
};

// GET /api/reports/substitutions
exports.substitutions = async (req, res) => {
  const { from, to, inst, busId } = range(req);
  try {
    const substitutions = await query(`
      SELECT ds.id,
             ds.sub_date,
             ds.original_bus_id,
             b_orig.registration_number AS original_bus_number,
             b_orig.bus_model AS original_bus_model,
             COALESCE(dr_orig.name, '—') AS original_driver_name,
             COALESCE(dr_orig.phone, '') AS original_driver_phone,
             ds.substitute_bus_id,
             b_sub.registration_number AS substitute_bus_number,
             b_sub.bus_model AS substitute_bus_model,
             b_sub.capacity AS substitute_capacity,
             COALESCE(dr_sub.name, '—') AS substitute_driver_name,
             COALESCE(dr_sub.phone, '') AS substitute_driver_phone,
             ds.route_id,
             COALESCE(r.route_code, '—') AS route_code,
             COALESCE(r.route_name, '—') AS route_name,
             COALESCE(r.total_distance, 0) AS route_distance,
             COALESCE(i.short_name, i.name, '—') AS institution,
             ds.shifts,
             ds.reason,
             ds.status,
             ds.notes,
             ds.created_at,
             ds.updated_at
      FROM daily_substitutions ds
      JOIN buses b_orig ON b_orig.id = ds.original_bus_id
      JOIN buses b_sub ON b_sub.id = ds.substitute_bus_id
      LEFT JOIN routes r ON r.id = ds.route_id
      LEFT JOIN institutions i ON i.id = COALESCE(r.institution_id, b_orig.institution_id)
      LEFT JOIN drivers dr_orig ON dr_orig.id = ds.original_driver_id
      LEFT JOIN drivers dr_sub ON dr_sub.id = ds.substitute_driver_id
      WHERE (ds.sub_date BETWEEN ? AND ? OR ds.status = 'active')
        AND (? IS NULL OR r.institution_id = ? OR b_orig.institution_id = ? OR b_sub.institution_id = ?)
        AND (? IS NULL OR b_orig.id = ? OR b_sub.id = ?)
      ORDER BY ds.sub_date DESC, ds.id DESC
    `, [from, to, inst, inst, inst, inst, busId, busId, busId]);

    res.json({ from, to, substitutions });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not fetch substitutions report.' });
  }
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
  const { from, to, inst } = range(req);
  try {
    await autoLogTrips();

    const records = await query(
      `SELECT tl.log_date, tl.shift, tl.start_km, tl.end_km, tl.start_stop, tl.end_stop, tl.start_time, tl.end_time,
              COALESCE(dr_direct.name, dr_assign.name, u.name, '—') AS driver_name,
              b.registration_number,
              COALESCE(i.short_name, '—') AS institution,
              COALESCE(r.route_code, '—') AS route_code,
              COALESCE(r.route_name, '—') AS route_name
       FROM trip_logs tl
       JOIN buses b ON b.id = tl.bus_id
       LEFT JOIN routes r ON r.id = COALESCE(tl.route_id, (SELECT a2.route_id FROM assignments a2 WHERE a2.bus_id = tl.bus_id AND a2.shift = tl.shift ORDER BY (a2.driver_id IS NOT NULL) DESC, a2.id DESC LIMIT 1))
       LEFT JOIN institutions i ON i.id = COALESCE(r.institution_id, b.institution_id)
       LEFT JOIN users u ON u.id = tl.driver_id
       LEFT JOIN drivers dr_direct ON dr_direct.id = tl.driver_id
       LEFT JOIN drivers dr_assign ON dr_assign.id = COALESCE(
         (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.shift = tl.shift AND a3.route_id = tl.route_id AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
         (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.shift = tl.shift AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
         (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
         (SELECT d2.id FROM drivers d2 WHERE d2.route_id = tl.route_id ORDER BY d2.id DESC LIMIT 1)
       )
       WHERE tl.log_date BETWEEN ? AND ?
         AND (? IS NULL OR r.institution_id = ? OR b.institution_id = ?)
       ORDER BY tl.log_date DESC, driver_name, tl.shift`, [from, to, inst, inst, inst]);

    const byDriver = await query(
      `SELECT COALESCE(dr_direct.name, dr_assign.name, u.name, 'Unassigned') AS driver_name,
              COUNT(tl.id) AS trips,
              SUM(CASE WHEN tl.end_time IS NOT NULL THEN 1 ELSE 0 END) AS completed,
              SUM(CASE WHEN tl.end_km IS NOT NULL AND tl.start_km IS NOT NULL THEN tl.end_km - tl.start_km ELSE 0 END) AS km,
              COUNT(DISTINCT tl.log_date) AS days
       FROM trip_logs tl
       JOIN buses b ON b.id = tl.bus_id
       LEFT JOIN routes r ON r.id = COALESCE(tl.route_id, (SELECT a2.route_id FROM assignments a2 WHERE a2.bus_id = tl.bus_id AND a2.shift = tl.shift ORDER BY (a2.driver_id IS NOT NULL) DESC, a2.id DESC LIMIT 1))
       LEFT JOIN users u ON u.id = tl.driver_id
       LEFT JOIN drivers dr_direct ON dr_direct.id = tl.driver_id
       LEFT JOIN drivers dr_assign ON dr_assign.id = COALESCE(
         (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.shift = tl.shift AND a3.route_id = tl.route_id AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
         (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.shift = tl.shift AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
         (SELECT a3.driver_id FROM assignments a3 WHERE a3.bus_id = tl.bus_id AND a3.driver_id IS NOT NULL ORDER BY a3.id DESC LIMIT 1),
         (SELECT d2.id FROM drivers d2 WHERE d2.route_id = tl.route_id ORDER BY d2.id DESC LIMIT 1)
       )
       WHERE tl.log_date BETWEEN ? AND ?
         AND (? IS NULL OR r.institution_id = ? OR b.institution_id = ?)
       GROUP BY driver_name
       ORDER BY (driver_name = 'Unassigned') ASC, trips DESC, km DESC`, [from, to, inst, inst, inst]);

    res.json({
      from,
      to,
      records: records.map(r => ({
        ...r,
        km: (r.end_km != null && r.start_km != null) ? (r.end_km - r.start_km) : null
      })),
      byDriver: byDriver.map(d => ({
        ...d,
        trips: Number(d.trips),
        completed: Number(d.completed),
        km: Number(d.km || 0),
        days: Number(d.days)
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not build the driver trips report.' });
  }
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
