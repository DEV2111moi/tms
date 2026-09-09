const express = require('express');
const router = express.Router();

const { authenticate, requireRole } = require('../middleware/auth');
const auth = require('../controllers/authController');
const crud = require('../controllers/crudController');
const dash = require('../controllers/dashboardController');
const att = require('../controllers/attendanceController');
const fleet = require('../controllers/fleetController');
const driver = require('../controllers/driverController');
const users = require('../controllers/userController');
const rep = require('../controllers/reportController');
const notifs = require('../controllers/notificationController');
const upload = require('../controllers/uploadController');

// ---- Auth (public) ----
router.post('/auth/login', auth.login);
router.get('/auth/me', authenticate, auth.me);

// ---- Dashboard ----
router.get('/dashboard', authenticate, requireRole('admin', 'executive', 'institution'), dash.summary);

// ---- Trips & attendance (bus incharge + admin) ----
router.get('/trips/today', authenticate, requireRole('incharge', 'admin'), att.todayTrip);
router.get('/trips/:tripId/roster', authenticate, requireRole('incharge', 'admin'), att.roster);
router.post('/attendance/mark', authenticate, requireRole('incharge', 'admin'), att.mark);
router.post('/attendance/submit', authenticate, requireRole('incharge', 'admin'), att.submit);
router.post('/trips/:tripId/location', authenticate, requireRole('incharge', 'driver', 'admin'), fleet.pushLocation);

// ---- Entry modules (admin only): buses, drivers, students, routes, stops, etc. ----
['institutions', 'buses', 'drivers', 'students', 'routes', 'stops', 'maintenance_logs', 'tyres'].forEach((t) => {
  const writers = t === 'students' ? ['admin', 'institution'] : ['admin'];
  router.get(`/${t}`, authenticate, crud.list(t));
  router.post(`/${t}`, authenticate, requireRole(...writers), crud.create(t));
  router.put(`/${t}/:id`, authenticate, requireRole(...writers), crud.update(t));
  router.delete(`/${t}/:id`, authenticate, requireRole(...writers), crud.remove(t));
});

// Driver Master Edit & Add (Driver Name, Bus No, Route, Institution)
router.put('/drivers/:id/master-edit', authenticate, requireRole('admin'), fleet.driverMasterEdit);
router.post('/drivers/master-add', authenticate, requireRole('admin'), fleet.driverMasterAdd);

// ---- Fleet: FC alerts, assignments, reference lists ----
router.get('/fleet/alerts', authenticate, requireRole('admin', 'executive', 'institution'), fleet.alerts);
router.get('/fleet/refs', authenticate, requireRole('admin', 'executive', 'institution'), fleet.refs);
router.get('/assignments', authenticate, requireRole('admin', 'executive', 'institution'), fleet.assignments);
router.post('/assignments', authenticate, requireRole('admin', 'institution'), fleet.assign);
router.delete('/assignments/:id', authenticate, requireRole('admin', 'institution'), fleet.deleteAssignment);

// ---- Parent ----
router.get('/parent/me', authenticate, requireRole('parent', 'admin'), fleet.parentView);

// ---- Driver module ----
router.get('/driver/buses', authenticate, requireRole('driver', 'admin'), driver.buses);
router.get('/driver/me', authenticate, requireRole('driver', 'admin'), driver.me);
router.get('/driver/open', authenticate, requireRole('driver', 'admin'), driver.open);
router.post('/driver/trip/start', authenticate, requireRole('driver', 'admin'), driver.startTrip);
router.post('/driver/trip/end', authenticate, requireRole('driver', 'admin'), driver.endTrip);
router.post('/driver/fuel', authenticate, requireRole('driver', 'admin'), driver.addFuel);
router.get('/driver/logs', authenticate, requireRole('driver', 'admin'), driver.logs);

// ---- User accounts / logins ----
router.get('/users', authenticate, requireRole('admin', 'institution'), users.list);
router.post('/users', authenticate, requireRole('admin', 'institution'), users.create);
router.put('/users/:id', authenticate, requireRole('admin', 'institution'), users.update);
router.delete('/users/:id', authenticate, requireRole('admin', 'institution'), users.remove);

// ---- Admin reporting ----
router.get('/reports/attendance', authenticate, requireRole('admin', 'executive', 'institution'), att.report);
router.get('/reports/fuel', authenticate, requireRole('admin', 'executive'), driver.fuelReport);
router.get('/reports/absentees', authenticate, requireRole('admin', 'executive'), rep.absentees);
router.get('/reports/fuel-usage', authenticate, requireRole('admin', 'executive'), rep.fuel);
router.get('/reports/distance', authenticate, requireRole('admin', 'executive'), rep.distance);
router.get('/reports/bus-wise', authenticate, requireRole('admin', 'executive'), rep.busWise);
router.get('/reports/maintenance', authenticate, requireRole('admin', 'executive'), rep.maintenance);
router.get('/reports/driver-trips', authenticate, requireRole('admin', 'executive'), rep.driverTrips);
router.get('/reports/routes-stops', authenticate, requireRole('admin', 'executive'), rep.routesStops);
router.post('/fuel', authenticate, requireRole('admin'), driver.addFuel);
router.post('/upload', authenticate, requireRole('admin', 'institution'), upload.upload);
router.get('/notifications', authenticate, notifs.list);
router.get('/fuel/bus/:busId', authenticate, requireRole('admin', 'executive'), driver.busFuel);
router.get('/attendance/daily/:date', authenticate, requireRole('admin', 'institution'), att.daily);

module.exports = router;
