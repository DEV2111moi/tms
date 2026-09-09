const { query } = require('../db/pool');

// GET /api/trips/today
exports.todayTrip = async (req, res) => {
  try {
    const role = req.user.role;
    const shift = req.query.shift || 'morning';
    let a, myRoutes = [];
    if (role === 'incharge') {
      myRoutes = await query(`SELECT a.route_id AS id, r.route_code, r.route_name FROM assignments a
        JOIN routes r ON r.id=a.route_id WHERE a.incharge_id=? AND a.shift=? ORDER BY r.route_code`, [req.user.id, shift]);
      const rid = req.query.route_id;
      a = (await query('SELECT * FROM assignments WHERE incharge_id=? AND shift=? ' + (rid ? 'AND route_id=? ' : '') + 'LIMIT 1',
        rid ? [req.user.id, shift, rid] : [req.user.id, shift]))[0];
    } else if (role === 'driver') {
      const dr = await query('SELECT id FROM drivers WHERE user_id=? LIMIT 1', [req.user.id]);
      if (dr.length) a = (await query('SELECT * FROM assignments WHERE driver_id=? AND shift=? LIMIT 1', [dr[0].id, shift]))[0];
    } else {
      const rid = req.query.route_id;
      a = rid
        ? (await query('SELECT * FROM assignments WHERE route_id=? AND shift=? LIMIT 1', [rid, shift]))[0]
        : (await query('SELECT * FROM assignments WHERE shift=? ORDER BY route_id LIMIT 1', [shift]))[0];
    }
    if (!a) return res.status(404).json({ error: `No ${shift} route is assigned to you.` });

    let trips = await query('SELECT id FROM trips WHERE route_id=? AND trip_date=CURDATE() AND shift=? LIMIT 1', [a.route_id, shift]);
    let tripId = trips.length ? trips[0].id : (await query(
      'INSERT INTO trips (route_id, bus_id, driver_id, incharge_id, trip_date, shift, status) VALUES (?,?,?,?,CURDATE(),?,"running")',
      [a.route_id, a.bus_id, a.driver_id, a.incharge_id, shift])).insertId;

    const out = await query(`
      SELECT t.id, t.trip_date, t.shift, t.status,
             r.id AS route_id, r.route_code, r.route_name, r.origin, r.destination,
             b.registration_number, d.name AS driver_name
      FROM trips t JOIN routes r ON r.id=t.route_id
      LEFT JOIN buses b ON b.id=t.bus_id
      LEFT JOIN drivers d ON d.id=t.driver_id
      WHERE t.id=?`, [tripId]);
    res.json({ trip: out[0], routes: myRoutes });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Could not load today\'s trip.' }); }
};

// GET /api/trips/:tripId/roster
exports.roster = async (req, res) => {
  const { tripId } = req.params;
  try {
    const trips = await query(
      `SELECT t.route_id, t.shift, r.origin, r.destination
       FROM trips t JOIN routes r ON r.id = t.route_id WHERE t.id = ?`, [tripId]);
    if (!trips.length) return res.status(404).json({ error: 'Trip not found.' });
    const { route_id: routeId, shift, origin, destination } = trips[0];
    const evening = String(shift || '').toLowerCase().startsWith('evening');

    const stops = await query(
      `SELECT id, stop_name, sequence, scheduled_time FROM stops WHERE route_id = ? ORDER BY sequence ${evening ? 'DESC' : 'ASC'}`,
      [routeId]
    );

    const students = await query(
      `SELECT s.id, s.student_id, s.name, s.class_grade, s.stop_id,
              COALESCE(a.status, 'absent') AS status, a.boarding_time
       FROM students s
       LEFT JOIN attendance a ON a.student_id = s.id AND a.trip_id = ?
       WHERE s.route_id = ?
       ORDER BY s.stop_id, s.name`,
      [tripId, routeId]
    );

    const byStop = stops.map((stop) => ({
      ...stop,
      students: students.filter((st) => st.stop_id === stop.id),
    }));

    const present = students.filter((s) => s.status === 'present').length;
    res.json({
      routeId, shift,
      direction: evening ? { from: destination, to: origin } : { from: origin, to: destination },
      stops: byStop,
      summary: { total: students.length, present, absent: students.length - present },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load the student roster.' });
  }
};

// POST /api/attendance/mark  { tripId, studentId, stopId, status }
exports.mark = async (req, res) => {
  const { tripId, studentId, stopId, status } = req.body || {};
  if (!tripId || !studentId || !['present', 'absent'].includes(status)) {
    return res.status(400).json({ error: 'Missing or invalid attendance details.' });
  }
  try {
    const boarding = status === 'present' ? new Date() : null;
    await query(
      `INSERT INTO attendance (trip_id, student_id, stop_id, status, boarding_time, marked_by, attendance_date)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE())
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         stop_id = VALUES(stop_id),
         boarding_time = VALUES(boarding_time),
         marked_by = VALUES(marked_by)`,
      [tripId, studentId, stopId || null, status, boarding, req.user.id]
    );
    res.json({ ok: true, studentId, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save attendance.' });
  }
};

// POST /api/attendance/submit  { tripId }
exports.submit = async (req, res) => {
  const { tripId } = req.body || {};
  try {
    await query('UPDATE trips SET status = "completed" WHERE id = ?', [tripId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not submit the trip.' });
  }
};

// GET /api/reports/attendance?date=YYYY-MM-DD&routeId=1&shift=morning&institutionId=1
exports.report = async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const routeId = req.query.routeId ? Number(req.query.routeId) : null;
  const shift = req.query.shift || null;
  let institutionId = req.query.institutionId ? Number(req.query.institutionId) : null;
  if (req.user && req.user.role === 'institution') {
    institutionId = req.user.institution_id || institutionId;
  }
  try {
    const rows = await query(
      `SELECT s.id AS student_pk, s.student_id, s.name, s.class_grade,
              COALESCE(s.parent_mobile, s.guardian_phone, '—') AS parent_phone,
              r.id AS route_id, r.route_code, r.route_name, st.stop_name, st.sequence,
              COALESCE(i.short_name, 'Campus') AS institution,
              COALESCE(MAX(CASE WHEN (? IS NULL OR t.shift = ?) THEN a.status END), 'not_marked') AS status,
              MAX(CASE WHEN (? IS NULL OR t.shift = ?) THEN a.boarding_time END) AS boarding_time
       FROM students s
       LEFT JOIN routes r  ON r.id = s.route_id
       LEFT JOIN stops st  ON st.id = s.stop_id
       LEFT JOIN institutions i ON i.id = COALESCE(s.institution_id, r.institution_id)
       LEFT JOIN attendance a ON a.student_id = s.id AND a.attendance_date = ?
       LEFT JOIN trips t ON t.id = a.trip_id
       WHERE (? IS NULL OR s.route_id = ?) 
         AND (? IS NULL OR s.institution_id = ? OR r.institution_id = ?)
       GROUP BY s.id, s.student_id, s.name, s.class_grade, s.parent_mobile, s.guardian_phone,
                r.id, r.route_code, r.route_name, st.stop_name, st.sequence, i.short_name
       ORDER BY r.route_code, st.sequence, s.name`,
      [shift, shift, shift, shift, date, routeId, routeId, institutionId, institutionId, institutionId]
    );

    // Route metadata if specific route is requested
    let routeInfo = null;
    if (routeId) {
      const [rRows] = [await query(`
        SELECT r.id, r.route_code, r.route_name, r.origin, r.destination, r.total_distance,
               a.shift, b.registration_number, d.name AS driver_name, d.phone AS driver_phone,
               u.name AS incharge_name, u.phone AS incharge_phone
        FROM routes r
        LEFT JOIN assignments a ON a.route_id = r.id AND (? IS NULL OR a.shift = ?)
        LEFT JOIN buses b ON b.id = a.bus_id
        LEFT JOIN drivers d ON d.id = a.driver_id
        LEFT JOIN users u ON u.id = a.incharge_id
        WHERE r.id = ?
        LIMIT 1
      `, [shift, shift, routeId])];
      routeInfo = rRows[0] || null;

      // Check trip status for this route today
      const [tripRows] = [await query(`
        SELECT id, status, shift FROM trips
        WHERE route_id = ? AND trip_date = ? AND (? IS NULL OR shift = ?)
        LIMIT 1
      `, [routeId, date, shift, shift])];
      if (routeInfo && tripRows[0]) {
        routeInfo.trip_id = tripRows[0].id;
        routeInfo.trip_status = tripRows[0].status;
      }
    }

    const present = rows.filter((r) => r.status === 'present').length;
    const absent = rows.filter((r) => r.status === 'absent').length;
    const notMarked = rows.filter((r) => r.status === 'not_marked').length;
    const total = rows.length;

    res.json({
      date, routeId, shift, institutionId, routeInfo,
      summary: {
        total,
        present,
        absent,
        notMarked,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      },
      rows,
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not build the report.' }); }
};

// GET /api/attendance/daily/:date?routeId=1
exports.daily = async (req, res) => {
  const { date } = req.params;
  const { routeId } = req.query;
  try {
    const params = [date];
    let sql = `
      SELECT a.attendance_date, r.route_code, s.student_id, s.name,
             a.status, a.boarding_time, st.stop_name
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN trips t    ON t.id = a.trip_id
      JOIN routes r   ON r.id = t.route_id
      LEFT JOIN stops st ON st.id = a.stop_id
      WHERE a.attendance_date = ?`;
    if (routeId) { sql += ' AND r.id = ?'; params.push(routeId); }
    sql += ' ORDER BY r.route_code, s.name';
    const rows = await query(sql, params);
    res.json({ date, records: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load the daily report.' });
  }
};
