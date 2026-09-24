const { query } = require('../db/pool');

// GET /api/dashboard  (admin / executive / institution)
exports.summary = async (req, res) => {
  try {
    const isInstitution = req.user && req.user.role === 'institution';

    // =========================================================================
    // INSTITUTION CAMPUS DASHBOARD
    // =========================================================================
    if (isInstitution) {
      const targetDate = req.query.date || new Date().toISOString().slice(0, 10);
      let instId = req.user && req.user.institution_id;
      if (!instId) {
        const userRow = (await query('SELECT institution_id FROM users WHERE id = ?', [req.user.id]))[0];
        instId = userRow ? userRow.institution_id : null;
      }

      // If still no instId, fallback to first institution
      if (!instId) {
        const firstInst = (await query('SELECT id FROM institutions ORDER BY id LIMIT 1'))[0];
        instId = firstInst ? firstInst.id : 1;
      }

      // 1. Institution details
      const [instRows] = [await query('SELECT id, name, short_name, code FROM institutions WHERE id = ?', [instId])];
      const institution = instRows[0] || { id: instId, name: 'Campus', short_name: 'Campus', code: 'CAMPUS' };

      // 2. Routes belonging to this institution
      const routes = await query(`
        SELECT r.id, r.route_code, r.route_name, COALESCE(r.total_distance, 0) AS total_distance,
               r.origin, r.destination
        FROM routes r
        WHERE r.institution_id = ?
        ORDER BY r.route_code
      `, [instId]);
      const routeIds = routes.map(r => r.id);

      // 3. Assignments for these routes
      let assignments = [];
      if (routeIds.length > 0) {
        assignments = await query(`
          SELECT a.id, a.route_id, a.shift, a.bus_id, a.driver_id, a.incharge_id,
                 b.registration_number, b.capacity AS bus_capacity,
                 d.name AS driver_name, d.phone AS driver_phone,
                 u.name AS incharge_name, u.phone AS incharge_phone,
                 r.route_code, r.route_name, COALESCE(r.total_distance, 0) AS total_distance
          FROM assignments a
          JOIN routes r ON r.id = a.route_id
          LEFT JOIN buses b ON b.id = a.bus_id
          LEFT JOIN drivers d ON d.id = a.driver_id
          LEFT JOIN users u ON u.id = a.incharge_id
          WHERE r.institution_id = ?
          ORDER BY r.route_code, a.shift
        `, [instId]);
      }

      // 4. Enrolled students for this institution (either student's institution or route's institution)
      let students = [];
      try {
        students = await query(`
          SELECT s.id, s.student_id, s.name, s.class_grade, s.route_id, s.stop_id,
                 COALESCE(s.parent_mobile, s.guardian_phone, '—') AS parent_phone,
                 COALESCE(st.stop_name, '—') AS stop_name
          FROM students s
          LEFT JOIN stops st ON st.id = s.stop_id
          LEFT JOIN routes r ON r.id = s.route_id
          WHERE (s.institution_id = ? OR r.institution_id = ?)
        `, [instId, instId]);
      } catch (err) {
        console.error('Error querying students for institution:', err);
      }

      const studentsByRoute = {};
      students.forEach(s => {
        if (s.route_id) {
          studentsByRoute[s.route_id] = (studentsByRoute[s.route_id] || 0) + 1;
        }
      });

      // 5. Attendance for this institution's students on selected date
      let attendanceToday = [];
      try {
        attendanceToday = await query(`
          SELECT a.id, a.trip_id, a.student_id, a.stop_id, a.status, a.boarding_time,
                 s.name AS student_name, s.class_grade,
                 COALESCE(s.parent_mobile, s.guardian_phone, '—') AS parent_phone,
                 r.route_code, r.route_name, COALESCE(st.stop_name, '—') AS stop_name
          FROM attendance a
          JOIN students s ON s.id = a.student_id
          JOIN trips t ON t.id = a.trip_id
          JOIN routes r ON r.id = t.route_id
          LEFT JOIN stops st ON st.id = a.stop_id
          WHERE (s.institution_id = ? OR r.institution_id = ?) AND a.attendance_date = ?
        `, [instId, instId, targetDate]);
      } catch (err) {
        console.error('Error querying attendance for institution:', err);
      }

      const boardedToday = attendanceToday.filter(a => a.status === 'present').length;
      const absentToday = attendanceToday.filter(a => a.status === 'absent').length;
      const totalMarked = boardedToday + absentToday;
      const attendanceRate = totalMarked > 0 ? Math.round((boardedToday / totalMarked) * 100) : 0;

      // Absent students list for quick follow-up
      const absentStudentsList = attendanceToday
        .filter(a => a.status === 'absent')
        .map(a => ({
          studentId: a.student_id,
          name: a.student_name,
          classGrade: a.class_grade || '—',
          routeCode: a.route_code,
          stopName: a.stop_name,
          parentPhone: a.parent_phone || '—',
        }));

      // 6. Distinct active buses operating for this campus
      const campusBusesSet = new Set();
      const campusDriversSet = new Set();
      assignments.forEach(a => {
        if (a.bus_id) campusBusesSet.add(a.bus_id);
        if (a.driver_id) campusDriversSet.add(a.driver_id);
      });

      // 7. Campus Incharges count
      const [inchargeRows] = [await query(`
        SELECT COUNT(*) AS total FROM users WHERE institution_id = ? AND role = 'incharge'
      `, [instId])];
      const inchargesCount = inchargeRows[0] ? inchargeRows[0].total : 0;

      // 8. Shift breakdown for this campus
      const SHIFT_KEYS = ['morning1', 'morning2', 'morning3', 'morning4', 'evening1', 'evening2', 'evening3', 'evening4'];
      const SHIFT_LABELS = {
        morning1: 'Morning 1 (Trip 1)',
        morning2: 'Morning 2 (Trip 2)',
        morning3: 'Morning 3 (Trip 3)',
        morning4: 'Morning 4 (Trip 4)',
        evening1: 'Evening 1 (Trip 5)',
        evening2: 'Evening 2 (Trip 6)',
        evening3: 'Evening 3 (Trip 7)',
        evening4: 'Evening 4 (Trip 8)',
      };

      const shiftDataMap = {
        morning1: { key: 'morning1', label: SHIFT_LABELS.morning1, shiftGroup: 'Morning', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
        morning2: { key: 'morning2', label: SHIFT_LABELS.morning2, shiftGroup: 'Morning', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
        morning3: { key: 'morning3', label: SHIFT_LABELS.morning3, shiftGroup: 'Morning', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
        morning4: { key: 'morning4', label: SHIFT_LABELS.morning4, shiftGroup: 'Morning', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
        evening1: { key: 'evening1', label: SHIFT_LABELS.evening1, shiftGroup: 'Evening', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
        evening2: { key: 'evening2', label: SHIFT_LABELS.evening2, shiftGroup: 'Evening', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
        evening3: { key: 'evening3', label: SHIFT_LABELS.evening3, shiftGroup: 'Evening', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
        evening4: { key: 'evening4', label: SHIFT_LABELS.evening4, shiftGroup: 'Evening', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
      };

      assignments.forEach(a => {
        let sh = a.shift;
        if (sh === 'morning') sh = 'morning1';
        if (sh === 'evening') sh = 'evening1';

        if (shiftDataMap[sh]) {
          shiftDataMap[sh].routes += 1;
          if (a.bus_id) shiftDataMap[sh].buses.add(a.bus_id);
          if (a.driver_id) shiftDataMap[sh].drivers.add(a.driver_id);
          shiftDataMap[sh].totalKm += Number(a.total_distance || 0);
        }
      });

      const shiftOverview = SHIFT_KEYS.map(k => ({
        key: k,
        label: shiftDataMap[k].label,
        shiftGroup: shiftDataMap[k].shiftGroup,
        routesCount: shiftDataMap[k].routes,
        busesCount: shiftDataMap[k].buses.size,
        driversCount: shiftDataMap[k].drivers.size,
        totalKm: Math.round(shiftDataMap[k].totalKm * 10) / 10,
      }));

      // 9. Live trips for this institution's routes on selected date
      let todayTrips = [];
      if (routeIds.length > 0) {
        try {
          todayTrips = await query(`
            SELECT t.id AS trip_id, t.route_id, t.shift, t.status,
                   b.registration_number, d.name AS driver_name, u.name AS incharge_name
            FROM trips t
            JOIN routes r ON r.id = t.route_id
            LEFT JOIN buses b ON b.id = t.bus_id
            LEFT JOIN drivers d ON d.id = t.driver_id
            LEFT JOIN users u ON u.id = t.incharge_id
            WHERE r.institution_id = ? AND t.trip_date = ?
          `, [instId, targetDate]);
        } catch (err) {
          console.error('Error querying trips for institution:', err);
        }
      }

      const tripByRouteShift = {};
      todayTrips.forEach(t => {
        tripByRouteShift[`${t.route_id}_${t.shift}`] = t;
      });

      // Attendance counted per trip
      const attendanceByTrip = {};
      attendanceToday.forEach(a => {
        if (!attendanceByTrip[a.trip_id]) {
          attendanceByTrip[a.trip_id] = { present: 0, absent: 0 };
        }
        if (a.status === 'present') attendanceByTrip[a.trip_id].present += 1;
        if (a.status === 'absent') attendanceByTrip[a.trip_id].absent += 1;
      });

      // 10. Route Roster for this campus with precise attendance & submission tracking
      const campusRoster = assignments.map(a => {
        const tripKey = `${a.route_id}_${a.shift}`;
        const trip = tripByRouteShift[tripKey];
        const tripAtt = trip ? (attendanceByTrip[trip.trip_id] || { present: 0, absent: 0 }) : null;
        const enrolled = studentsByRoute[a.route_id] || 0;
        const boarded = tripAtt ? tripAtt.present : 0;
        const absent = tripAtt ? tripAtt.absent : 0;
        const attRate = enrolled > 0 ? Math.round((boarded / enrolled) * 100) : 0;

        let submissionStatus = 'no_incharge';
        let statusLabel = 'No Incharge';
        if (trip && trip.status === 'completed') {
          submissionStatus = 'submitted';
          statusLabel = 'Submitted';
        } else if (trip && trip.status === 'running') {
          submissionStatus = 'in_transit';
          statusLabel = 'In Transit';
        } else if (a.incharge_id) {
          submissionStatus = 'pending';
          statusLabel = 'Pending Submission';
        } else {
          submissionStatus = 'no_incharge';
          statusLabel = 'No Incharge';
        }

        return {
          id: a.id,
          route_id: a.route_id,
          route_code: a.route_code,
          route_name: a.route_name,
          shift: a.shift,
          bus_id: a.bus_id,
          registration_number: a.registration_number || '—',
          driver_id: a.driver_id,
          driver_name: a.driver_name || '—',
          driver_phone: a.driver_phone || '—',
          incharge_id: a.incharge_id,
          incharge_name: a.incharge_name || '—',
          incharge_phone: a.incharge_phone || '—',
          total_distance: a.total_distance,
          enrolledStudents: enrolled,
          boardedCount: boarded,
          absentCount: absent,
          attendanceRate: attRate,
          attendanceStatus: statusLabel,
          submissionStatus,
          hasIncharge: !!a.incharge_id,
          trip_id: trip ? trip.trip_id : null,
          trip_status: trip ? trip.status : 'scheduled',
        };
      });

      // Incharge submission metrics
      const pendingSubmissionCount = campusRoster.filter(r => r.submissionStatus === 'pending').length;
      const submittedCount = campusRoster.filter(r => r.submissionStatus === 'submitted').length;
      const inTransitCount = campusRoster.filter(r => r.submissionStatus === 'in_transit').length;
      const noInchargeCount = campusRoster.filter(r => r.submissionStatus === 'no_incharge').length;

      // Available Campus Incharges (for assignment modal)
      const inchargesList = await query(`
        SELECT id, name, phone, email FROM users
        WHERE (institution_id = ? OR institution_id IS NULL) AND role = 'incharge'
        ORDER BY name
      `, [instId]);

      // Unassigned routes in this campus
      const assignedRouteIds = new Set(assignments.map(a => a.route_id));
      const unassignedRoutes = routes.filter(r => !assignedRouteIds.has(r.id)).map(r => ({
        id: r.id,
        route_code: r.route_code,
        route_name: r.route_name,
        total_distance: r.total_distance,
        status: 'Unassigned',
      }));

      // Return institution-tailored payload
      return res.json({
        isInstitution: true,
        selectedDate: targetDate,
        institution,
        kpis: {
          busesRunning: campusBusesSet.size,
          routesCount: routes.length,
          assignedRoutesCount: assignedRouteIds.size,
          unassignedRoutesCount: unassignedRoutes.length,
          totalStudents: students.length,
          boardedToday,
          absentToday,
          attendanceRate,
          inchargesCount,
          pendingSubmissionCount,
          submittedCount,
          inTransitCount,
          noInchargeCount,
          totalDailyKm: Math.round(assignments.reduce((acc, a) => acc + Number(a.total_distance || 0), 0) * 10) / 10,
        },
        inchargesList,
        shiftOverview,
        campusRoster,
        unassignedRoutes,
        absentStudentsList,
      });
    }

    // =========================================================================
    // ADMIN / EXECUTIVE CENTRAL CONTROL ROOM DASHBOARD
    // =========================================================================
    // 1. Bus stats
    const [busRows] = [await query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN COALESCE(status, 'active') = 'active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN COALESCE(status, 'active') != 'active' THEN 1 ELSE 0 END) AS inactive
      FROM buses
    `)];
    const busStats = busRows[0] || { total: 0, active: 0, inactive: 0 };

    // 2. Driver stats
    const [driverRows] = [await query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN COALESCE(status, 'active') = 'active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN COALESCE(status, 'active') != 'active' THEN 1 ELSE 0 END) AS inactive
      FROM drivers
    `)];
    const driverStats = driverRows[0] || { total: 0, active: 0, inactive: 0 };

    // 3. Institutions
    const institutions = await query(`
      SELECT id, name, short_name, code FROM institutions ORDER BY id
    `);

    // 4. Routes
    const routes = await query(`
      SELECT r.id, r.route_code, r.route_name, COALESCE(r.total_distance, 0) AS total_distance,
             r.institution_id, COALESCE(i.short_name, i.name, 'Central') AS institution_name
      FROM routes r
      LEFT JOIN institutions i ON i.id = r.institution_id
      ORDER BY r.route_code
    `);

    // 5. Assignments
    const assignments = await query(`
      SELECT a.id, a.route_id, a.shift, a.bus_id, a.driver_id, a.incharge_id,
             b.registration_number, d.name AS driver_name,
             r.route_code, r.route_name, COALESCE(r.total_distance, 0) AS total_distance,
             r.institution_id, COALESCE(i.short_name, i.name, 'Central') AS institution_name
      FROM assignments a
      JOIN routes r ON r.id = a.route_id
      LEFT JOIN institutions i ON i.id = r.institution_id
      LEFT JOIN buses b ON b.id = a.bus_id
      LEFT JOIN drivers d ON d.id = a.driver_id
    `);

    // 6. Calculate Shift Stats (morning 1..4, evening 1..4)
    const SHIFT_KEYS = ['morning1', 'morning2', 'morning3', 'morning4', 'evening1', 'evening2', 'evening3', 'evening4'];
    const SHIFT_LABELS = {
      morning1: 'Morning 1 (Trip 1)',
      morning2: 'Morning 2 (Trip 2)',
      morning3: 'Morning 3 (Trip 3)',
      morning4: 'Morning 4 (Trip 4)',
      evening1: 'Evening 1 (Trip 5)',
      evening2: 'Evening 2 (Trip 6)',
      evening3: 'Evening 3 (Trip 7)',
      evening4: 'Evening 4 (Trip 8)',
    };

    const shiftDataMap = {
      morning1: { key: 'morning1', label: SHIFT_LABELS.morning1, shiftGroup: 'Morning', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
      morning2: { key: 'morning2', label: SHIFT_LABELS.morning2, shiftGroup: 'Morning', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
      morning3: { key: 'morning3', label: SHIFT_LABELS.morning3, shiftGroup: 'Morning', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
      morning4: { key: 'morning4', label: SHIFT_LABELS.morning4, shiftGroup: 'Morning', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
      evening1: { key: 'evening1', label: SHIFT_LABELS.evening1, shiftGroup: 'Evening', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
      evening2: { key: 'evening2', label: SHIFT_LABELS.evening2, shiftGroup: 'Evening', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
      evening3: { key: 'evening3', label: SHIFT_LABELS.evening3, shiftGroup: 'Evening', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
      evening4: { key: 'evening4', label: SHIFT_LABELS.evening4, shiftGroup: 'Evening', routes: 0, buses: new Set(), drivers: new Set(), totalKm: 0 },
    };

    assignments.forEach(a => {
      let sh = a.shift;
      if (sh === 'morning') sh = 'morning1';
      if (sh === 'evening') sh = 'evening1';

      if (shiftDataMap[sh]) {
        shiftDataMap[sh].routes += 1;
        if (a.bus_id) shiftDataMap[sh].buses.add(a.bus_id);
        if (a.driver_id) shiftDataMap[sh].drivers.add(a.driver_id);
        shiftDataMap[sh].totalKm += Number(a.total_distance || 0);
      }
    });

    const shiftOverview = SHIFT_KEYS.map(k => ({
      key: k,
      label: shiftDataMap[k].label,
      shiftGroup: shiftDataMap[k].shiftGroup,
      routesCount: shiftDataMap[k].routes,
      busesCount: shiftDataMap[k].buses.size,
      driversCount: shiftDataMap[k].drivers.size,
      totalKm: Math.round(shiftDataMap[k].totalKm * 10) / 10,
    }));

    // 7. Track Unassigned Routes
    const routeAssignMap = {};
    assignments.forEach(a => {
      if (!routeAssignMap[a.route_id]) routeAssignMap[a.route_id] = [];
      routeAssignMap[a.route_id].push(a);
    });

    const unassignedList = [];
    let assignedRoutesSet = new Set();

    routes.forEach(r => {
      const assigns = routeAssignMap[r.id] || [];
      if (assigns.length === 0) {
        unassignedList.push({
          id: r.id,
          route_code: r.route_code,
          route_name: r.route_name,
          institution_id: r.institution_id,
          institution_name: r.institution_name,
          total_distance: Number(r.total_distance || 0),
          status: 'Not Assigned',
          reason: 'No bus or driver assigned to any shift',
          assignedShifts: [],
          missingShifts: ['morning1', 'evening1'],
        });
      } else {
        assignedRoutesSet.add(r.id);
        const missingBusOrDriver = assigns.filter(a => !a.bus_id || !a.driver_id);
        const assignedShiftNames = assigns.map(a => a.shift);
        if (missingBusOrDriver.length > 0) {
          unassignedList.push({
            id: r.id,
            route_code: r.route_code,
            route_name: r.route_name,
            institution_id: r.institution_id,
            institution_name: r.institution_name,
            total_distance: Number(r.total_distance || 0),
            status: 'Incomplete Assignment',
            reason: missingBusOrDriver.map(a => `${a.shift}: ${!a.bus_id ? 'No Bus' : ''} ${!a.driver_id ? 'No Driver' : ''}`.trim()).join(', '),
            assignedShifts: assignedShiftNames,
            missingShifts: [],
          });
        }
      }
    });

    // 8. Institution breakdown
    const instSummary = institutions.map(inst => {
      const instRoutes = routes.filter(r => r.institution_id === inst.id);
      const instRouteIds = new Set(instRoutes.map(r => r.id));
      const instAssignments = assignments.filter(a => instRouteIds.has(a.route_id));
      const instBuses = new Set(instAssignments.filter(a => a.bus_id).map(a => a.bus_id));
      const instDrivers = new Set(instAssignments.filter(a => a.driver_id).map(a => a.driver_id));
      const instUnassigned = unassignedList.filter(u => u.institution_id === inst.id);
      const totalKm = instAssignments.reduce((acc, a) => acc + Number(a.total_distance || 0), 0);

      return {
        id: inst.id,
        name: inst.name,
        short_name: inst.short_name || inst.name,
        code: inst.code,
        totalRoutes: instRoutes.length,
        assignedRoutes: instRoutes.length - instUnassigned.length,
        unassignedRoutes: instUnassigned.length,
        busesCount: instBuses.size,
        driversCount: instDrivers.size,
        totalKm: Math.round(totalKm * 10) / 10,
      };
    });

    // 9. Compliance & FC Alerts
    const allBuses = await query('SELECT id, registration_number, fc_expiry, insurance_expiry, permit_expiry, puc_expiry FROM buses');
    const allDrivers = await query('SELECT id, name, license_expiry FROM drivers');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = (d) => (d ? Math.ceil((new Date(d) - today) / 86400000) : null);

    const complianceAlerts = [];
    const checkDoc = (subject, type, date) => {
      const left = daysLeft(date);
      if (left === null) return;
      if (left <= 30) {
        complianceAlerts.push({
          subject,
          type,
          date: new Date(date).toISOString().slice(0, 10),
          daysLeft: left,
          expired: left < 0,
        });
      }
    };

    allBuses.forEach(b => {
      checkDoc(b.registration_number, 'Fitness Certificate (FC)', b.fc_expiry);
      checkDoc(b.registration_number, 'Insurance', b.insurance_expiry);
      checkDoc(b.registration_number, 'Permit', b.permit_expiry);
      checkDoc(b.registration_number, 'Pollution (PUC)', b.puc_expiry);
    });

    allDrivers.forEach(d => {
      checkDoc(d.name, 'Driving Licence', d.license_expiry);
    });

    complianceAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

    const expiredCount = complianceAlerts.filter(a => a.expired).length;
    const expiringSoonCount = complianceAlerts.filter(a => !a.expired && a.daysLeft <= 30).length;

    // 10. Today's live trips
    const trips = await query(`
      SELECT t.id, t.shift, r.route_code, r.route_name, b.registration_number,
             d.name AS driver_name, u.name AS incharge_name, t.status
      FROM trips t
      JOIN routes r ON r.id = t.route_id
      LEFT JOIN buses b ON b.id = t.bus_id
      LEFT JOIN drivers d ON d.id = t.driver_id
      LEFT JOIN users u ON u.id = t.incharge_id
      WHERE t.trip_date = CURDATE()
      ORDER BY t.id DESC
      LIMIT 20
    `);

    // Total planned fleet distance across all shifts
    const totalDailyDistance = Math.round(
      assignments.reduce((sum, a) => sum + Number(a.total_distance || 0), 0) * 10
    ) / 10;

    res.json({
      isInstitution: false,
      kpis: {
        totalBuses: Number(busStats.total || 0),
        activeBuses: Number(busStats.active || 0),
        inactiveBuses: Number(busStats.inactive || 0),
        totalDrivers: Number(driverStats.total || 0),
        activeDrivers: Number(driverStats.active || 0),
        inactiveDrivers: Number(driverStats.inactive || 0),
        totalRoutes: routes.length,
        assignedRoutesCount: assignedRoutesSet.size,
        unassignedRoutesCount: unassignedList.length,
        totalDailyKm: totalDailyDistance,
        fcAlertsTotal: complianceAlerts.length,
        fcExpiredCount: expiredCount,
        fcExpiringSoonCount: expiringSoonCount,
      },
      shiftOverview,
      unassignedRoutes: unassignedList,
      institutionSummary: instSummary,
      complianceSummary: {
        totalAlerts: complianceAlerts.length,
        expiredCount,
        expiringSoonCount,
        urgentList: complianceAlerts.slice(0, 6),
      },
      trips,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Could not load dashboard data.' });
  }
};
