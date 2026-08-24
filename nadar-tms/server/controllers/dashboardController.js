const { query } = require('../db/pool');

// GET /api/dashboard  (admin / executive)
exports.summary = async (req, res) => {
  try {
    const [[buses]] = [await query("SELECT COUNT(*) AS n FROM buses WHERE status='active'")];
    const [[students]] = [await query('SELECT COUNT(*) AS n FROM students')];
    const [[routes]] = [await query('SELECT COUNT(*) AS n FROM routes')];
    const [[presentToday]] = [await query(
      "SELECT COUNT(*) AS n FROM attendance WHERE attendance_date = CURDATE() AND status='present'"
    )];
    const trips = await query(
      `SELECT t.id, t.shift, r.route_code, r.route_name, b.registration_number,
              d.name AS driver_name, u.name AS incharge_name, t.status
       FROM trips t
       JOIN routes r ON r.id = t.route_id
       LEFT JOIN buses b ON b.id = t.bus_id
       LEFT JOIN drivers d ON d.id = t.driver_id
       LEFT JOIN users u ON u.id = t.incharge_id
       WHERE t.trip_date = CURDATE()
       ORDER BY t.id`
    );
    res.json({
      stats: {
        activeBuses: buses.n,
        students: students.n,
        routes: routes.n,
        presentToday: presentToday.n,
      },
      trips,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load the dashboard.' });
  }
};
