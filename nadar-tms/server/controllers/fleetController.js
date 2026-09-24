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
  const { route_id, bus_id, driver_id, incharge_id, shifts: customShifts } = req.body || {};
  const shift = req.body && req.body.shift;
  if (!route_id) return res.status(400).json({ error: 'Choose a route.' });

  let shifts = [];
  if (Array.isArray(customShifts) && customShifts.length > 0) {
    shifts = customShifts;
  } else if (Array.isArray(req.body.shifts) && req.body.shifts.length > 0) {
    shifts = req.body.shifts;
  } else if (shift === 'both' || shift === 'm1_e1') {
    shifts = ['morning1', 'evening1'];
  } else if (shift === 'm1_e2') {
    shifts = ['morning1', 'evening2'];
  } else if (shift === 'm2_e1') {
    shifts = ['morning2', 'evening1'];
  } else if (shift === 'm2_e2') {
    shifts = ['morning2', 'evening2'];
  } else if (shift === 'all') {
    shifts = ['morning1', 'morning2', 'evening1', 'evening2'];
  } else if (shift) {
    shifts = [shift];
  } else {
    shifts = ['morning1', 'evening1'];
  }

  const inchargeOnly = req.user.role === 'institution';
  try {
    if (inchargeOnly) {
      for (const sh of shifts) {
        await query(
          `INSERT INTO assignments (route_id, shift, incharge_id) VALUES (?,?,?)
           ON DUPLICATE KEY UPDATE incharge_id=VALUES(incharge_id)`,
          [route_id, sh, incharge_id || null]);
        try {
          await query(
            `UPDATE trips SET incharge_id = ? WHERE route_id = ? AND shift = ? AND trip_date = CURDATE()`,
            [incharge_id || null, route_id, sh]
          );
        } catch (tErr) {}
      }
    } else {
      // 1. If multiple shifts are being assigned together, synchronize those assignment shifts on this route
      if (shifts.length > 1) {
        await query(
          `UPDATE assignments SET bus_id = ?, driver_id = ?, incharge_id = COALESCE(?, incharge_id) WHERE route_id = ? AND shift IN (?)`,
          [bus_id || null, driver_id || null, incharge_id || null, route_id, shifts]
        );
      }

      for (const sh of shifts) {
        await query(
          `INSERT INTO assignments (route_id, shift, bus_id, driver_id, incharge_id) VALUES (?,?,?,?,?)
           ON DUPLICATE KEY UPDATE bus_id=VALUES(bus_id), driver_id=VALUES(driver_id), incharge_id=COALESCE(VALUES(incharge_id), incharge_id)`,
          [route_id, sh, bus_id || null, driver_id || null, incharge_id || null]);

        try {
          await query(
            `UPDATE trips SET bus_id = ?, driver_id = ?, incharge_id = ? WHERE route_id = ? AND shift = ? AND trip_date = CURDATE()`,
            [bus_id || null, driver_id || null, incharge_id || null, route_id, sh]
          );
        } catch (tErr) {}
      }

      // 2. CRITICAL: When driver is changed for a bus, update all assignments for that bus
      // so the bus stores ONLY the new driver (replaces old driver cleanly)
      if (bus_id && driver_id) {
        await query(
          `UPDATE assignments SET driver_id = ? WHERE bus_id = ?`,
          [driver_id, bus_id]
        );
        try {
          await query(
            `UPDATE trips SET driver_id = ? WHERE bus_id = ? AND trip_date = CURDATE()`,
            [driver_id, bus_id]
          );
        } catch (tErr) {}
      }

      // 3. Link driver's primary route in drivers table
      if (driver_id && route_id) {
        await query(
          `UPDATE drivers SET route_id = ? WHERE id = ?`,
          [route_id, driver_id]
        );
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
             r.route_code, r.route_name, r.total_distance, r.institution_id, b.registration_number,
             r.initial_point, r.initial_time, r.origin, r.destination,
             COALESCE(
               (SELECT scheduled_time FROM stops WHERE route_id = r.id AND LOWER(TRIM(stop_name)) = LOWER(TRIM(r.origin)) LIMIT 1),
               (SELECT scheduled_time FROM stops WHERE route_id = r.id AND sequence = 1 LIMIT 1),
               (SELECT scheduled_time FROM stops WHERE route_id = r.id ORDER BY sequence ASC LIMIT 1)
             ) AS boarding_time,
             COALESCE(
               (SELECT scheduled_time FROM stops WHERE route_id = r.id AND LOWER(TRIM(stop_name)) = LOWER(TRIM(r.destination)) LIMIT 1),
               (SELECT scheduled_time FROM stops WHERE route_id = r.id AND (LOWER(stop_name) LIKE '%clg%' OR LOWER(stop_name) LIKE '%school%' OR LOWER(stop_name) LIKE '%college%' OR LOWER(stop_name) LIKE '%campus%') ORDER BY sequence DESC LIMIT 1),
               (SELECT scheduled_time FROM stops WHERE route_id = r.id ORDER BY sequence DESC LIMIT 1)
             ) AS end_time,
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
      query(`
        SELECT r.id, r.route_code, r.route_name, r.origin, r.destination, r.total_distance, r.shift, r.institution_id,
               r.initial_point, r.initial_time,
               COALESCE(
                 (SELECT scheduled_time FROM stops WHERE route_id = r.id AND LOWER(TRIM(stop_name)) = LOWER(TRIM(r.origin)) LIMIT 1),
                 (SELECT scheduled_time FROM stops WHERE route_id = r.id AND sequence = 1 LIMIT 1),
                 (SELECT scheduled_time FROM stops WHERE route_id = r.id ORDER BY sequence ASC LIMIT 1)
               ) AS boarding_time,
               COALESCE(
                 (SELECT scheduled_time FROM stops WHERE route_id = r.id AND LOWER(TRIM(stop_name)) = LOWER(TRIM(r.destination)) LIMIT 1),
                 (SELECT scheduled_time FROM stops WHERE route_id = r.id AND (LOWER(stop_name) LIKE '%clg%' OR LOWER(stop_name) LIKE '%school%' OR LOWER(stop_name) LIKE '%college%' OR LOWER(stop_name) LIKE '%campus%') ORDER BY sequence DESC LIMIT 1),
                 (SELECT scheduled_time FROM stops WHERE route_id = r.id ORDER BY sequence DESC LIMIT 1)
               ) AS end_time,
               COALESCE(i.short_name, i.name, '—') AS institution_name
        FROM routes r
        LEFT JOIN institutions i ON i.id = r.institution_id
        ORDER BY r.route_code
      `),
      query(`
        SELECT b.id, b.registration_number, b.institution_id,
               COALESCE(
                 (SELECT d.name FROM assignments a JOIN drivers d ON d.id = a.driver_id WHERE a.bus_id = b.id ORDER BY a.id DESC LIMIT 1),
                 (SELECT td.name FROM trips t JOIN drivers td ON td.id = t.driver_id WHERE t.bus_id = b.id AND t.trip_date = CURDATE() ORDER BY t.id DESC LIMIT 1)
               ) AS driver_name,
               COALESCE(
                 (SELECT a.driver_id FROM assignments a WHERE a.bus_id = b.id AND a.driver_id IS NOT NULL ORDER BY a.id DESC LIMIT 1),
                 (SELECT t.driver_id FROM trips t WHERE t.bus_id = b.id AND t.trip_date = CURDATE() AND t.driver_id IS NOT NULL ORDER BY t.id DESC LIMIT 1)
               ) AS driver_id
        FROM buses b
        ORDER BY b.registration_number
      `),
      query('SELECT id, name FROM drivers ORDER BY name'),
      query("SELECT id, name, institution_id FROM users WHERE role='incharge' ORDER BY name"),
      query('SELECT id, code, name, short_name FROM institutions ORDER BY name'),
    ]);
    res.json({ routes, buses, drivers, incharges, institutions });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load reference data.' }); }
};

// DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = (await query(`
      SELECT a.*, r.route_code, r.institution_id 
      FROM assignments a 
      JOIN routes r ON r.id = a.route_id 
      WHERE a.id = ?
    `, [id]))[0];

    if (!existing) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Role check: if institution user, ensure they can only delete their institution's assignments
    if (req.user.role === 'institution' && req.user.institution_id && existing.institution_id !== req.user.institution_id) {
      return res.status(403).json({ error: 'You do not have permission to delete assignments for this institution.' });
    }

    await query('DELETE FROM assignments WHERE id = ?', [id]);

    // Synchronize trips for today if scheduled and not started
    try {
      await query(
        `UPDATE trips SET bus_id = NULL, driver_id = NULL, incharge_id = NULL 
         WHERE route_id = ? AND shift = ? AND trip_date = CURDATE() AND status = 'scheduled'`,
        [existing.route_id, existing.shift]
      );
    } catch (tErr) {
      console.error('Trip assignment cleanup error:', tErr);
    }

    // Log notification
    try {
      const msg = `Assignment for Route ${existing.route_code} (${existing.shift}) was deleted.`;
      await query('INSERT INTO notifications (message, route_id, institution_id) VALUES (?,?,?)',
        [msg.slice(0, 255), existing.route_id, existing.institution_id || null]);
    } catch (e) {
      console.error('Notification log error:', e);
    }

    res.json({ ok: true, message: `Assignment for Route ${existing.route_code} (${existing.shift}) deleted.` });
  } catch (e) {
    console.error('deleteAssignment error:', e);
    res.status(500).json({ error: 'Could not delete the assignment.' });
  }
};

// PUT /api/drivers/:id/master-edit
exports.driverMasterEdit = async (req, res) => {
  const driverId = Number(req.params.id);
  const { name, institution_id, route_id, bus_id, bus_ids, shift, phone, status } = req.body || {};

  if (!driverId) return res.status(400).json({ error: 'Driver ID is required.' });

  try {
    const [driver] = await query('SELECT * FROM drivers WHERE id = ?', [driverId]);
    if (!driver) return res.status(404).json({ error: 'Driver not found.' });

    const newName = name ? String(name).trim() : driver.name;
    const cleanInst = institution_id && institution_id !== 'all' ? Number(institution_id) : null;
    const cleanRoute = route_id ? Number(route_id) : null;
    const cleanBus = bus_id ? Number(bus_id) : null;
    const cleanPhone = phone !== undefined ? (phone ? String(phone).trim() : null) : driver.phone;
    const cleanStatus = status || driver.status || 'active';

    // 1. Update drivers table
    await query(
      `UPDATE drivers SET name = ?, institution_id = ?, route_id = ?, phone = ?, status = ? WHERE id = ?`,
      [newName, cleanInst, cleanRoute, cleanPhone, cleanStatus, driverId]
    );

    // If trips array is provided from the multi-tab popup modal
    if (Array.isArray(req.body.trips) && req.body.trips.length > 0) {
      const tripsList = req.body.trips;
      const primaryRouteId = tripsList[0]?.route_id ? Number(tripsList[0].route_id) : cleanRoute;
      if (primaryRouteId) {
        await query(`UPDATE drivers SET route_id = ? WHERE id = ?`, [primaryRouteId, driverId]);
      }

      // Collect all bus IDs from trips
      const validBusIds = tripsList.map(t => Number(t.bus_id)).filter(Boolean);

      // Unassign driver from assignments not belonging to these buses/routes
      if (validBusIds.length > 0) {
        await query(
          `UPDATE assignments SET driver_id = NULL WHERE driver_id = ? AND bus_id NOT IN (?)`,
          [driverId, validBusIds]
        );
      } else {
        await query(`UPDATE assignments SET driver_id = NULL WHERE driver_id = ?`, [driverId]);
      }

      // Process each trip tab
      for (const t of tripsList) {
        const rId = t.route_id ? Number(t.route_id) : null;
        const bId = t.bus_id ? Number(t.bus_id) : null;
        const sh = t.shift || 'morning1';

        if (rId) {
          // Normalize points & times
          const initialPoint = t.initial_point !== undefined ? (t.initial_point ? String(t.initial_point).trim() : null) : null;
          let initialTime = t.initial_time !== undefined ? (t.initial_time ? String(t.initial_time).trim() : null) : null;
          if (initialTime && initialTime.length === 5) initialTime = `${initialTime}:00`;

          const orgName = t.origin !== undefined ? (t.origin ? String(t.origin).trim() : null) : null;
          const destName = t.destination !== undefined ? (t.destination ? String(t.destination).trim() : null) : null;

          // Always update route record
          await query(
            `UPDATE routes SET 
               initial_point = ?, 
               initial_time = ?,
               origin = COALESCE(?, origin),
               destination = COALESCE(?, destination)
             WHERE id = ?`,
            [initialPoint, initialTime, orgName, destName, rId]
          );

          // Update boarding stop in stops table
          let boardingTime = t.boarding_time !== undefined ? (t.boarding_time ? String(t.boarding_time).trim() : null) : null;
          if (boardingTime && boardingTime.length === 5) boardingTime = `${boardingTime}:00`;

          const firstStops = await query(
            `SELECT id, sequence FROM stops WHERE route_id = ? ORDER BY sequence ASC LIMIT 1`,
            [rId]
          );

          if (firstStops && firstStops.length > 0) {
            const firstStopId = firstStops[0].id;
            if (boardingTime) {
              await query(`UPDATE stops SET scheduled_time = ? WHERE id = ?`, [boardingTime, firstStopId]);
            }
            if (orgName) {
              await query(`UPDATE stops SET stop_name = ? WHERE id = ?`, [orgName, firstStopId]);
            }
          } else if (orgName) {
            await query(
              `INSERT INTO stops (route_id, stop_name, sequence, scheduled_time) VALUES (?, ?, 1, ?)`,
              [rId, orgName, boardingTime || '08:00:00']
            );
          }

          // Update end stop in stops table
          let endTime = t.end_time !== undefined ? (t.end_time ? String(t.end_time).trim() : null) : null;
          if (endTime && endTime.length === 5) endTime = `${endTime}:00`;

          let endStopId = null;
          if (destName) {
            const matching = await query(
              `SELECT id FROM stops WHERE route_id = ? AND LOWER(TRIM(stop_name)) = LOWER(?) LIMIT 1`,
              [rId, destName]
            );
            if (matching && matching.length > 0) {
              endStopId = matching[0].id;
            }
          }

          if (!endStopId) {
            const lastStops = await query(
              `SELECT id FROM stops WHERE route_id = ? ORDER BY sequence DESC LIMIT 1`,
              [rId]
            );
            if (lastStops && lastStops.length > 0) {
              if (firstStops && firstStops.length > 0 && lastStops[0].id === firstStops[0].id) {
                endStopId = null; // Do not overwrite origin as end stop if only 1 stop exists
              } else {
                endStopId = lastStops[0].id;
              }
            }
          }

          if (endStopId) {
            if (endTime) {
              await query(`UPDATE stops SET scheduled_time = ? WHERE id = ?`, [endTime, endStopId]);
            }
            if (destName) {
              await query(`UPDATE stops SET stop_name = ? WHERE id = ?`, [destName, endStopId]);
            }
          } else if (destName) {
            const maxSeqRes = await query(`SELECT MAX(sequence) AS max_seq FROM stops WHERE route_id = ?`, [rId]);
            const nextSeq = ((maxSeqRes && maxSeqRes[0]?.max_seq) || 1) + 1;
            await query(
              `INSERT INTO stops (route_id, stop_name, sequence, scheduled_time) VALUES (?, ?, ?, ?)`,
              [rId, destName, nextSeq, endTime || '08:20:00']
            );
          }

          // Insert or update assignments table for all selected shifts of this trip
          if (bId) {
            const shiftsToAssign = Array.isArray(t.shifts) && t.shifts.length > 0 
              ? t.shifts 
              : [t.shift || sh];

            for (const s of shiftsToAssign) {
              await query(
                `INSERT INTO assignments (route_id, shift, bus_id, driver_id)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE bus_id = VALUES(bus_id), driver_id = VALUES(driver_id)`,
                [rId, s, bId, driverId]
              );
            }
          }
        }
      }

      // Sync trips for today
      if (validBusIds.length > 0) {
        try {
          await query(
            `UPDATE trips SET driver_id = ? WHERE bus_id IN (?) AND trip_date = CURDATE()`,
            [driverId, validBusIds]
          );
        } catch (tErr) {
          console.error('Trip sync error in driverMasterEdit:', tErr);
        }
      }

      return res.json({ ok: true, message: 'Driver and multi-tab trips updated successfully.' });
    }

    // 2. Synchronize assignments table for multiple buses (Legacy / direct row edit)
    const shiftsToApply = (!shift || shift === 'both') ? ['morning1', 'evening1'] : [shift];
    
    // Normalize selectedBusIds: array of Numbers
    let selectedBusIds = [];
    if (Array.isArray(bus_ids)) {
      selectedBusIds = bus_ids.map(Number).filter(Boolean);
    } else if (bus_id) {
      selectedBusIds = [Number(bus_id)];
    }

    if (selectedBusIds.length > 0) {
      // Remove driver from assignments of buses that are NOT in selectedBusIds
      await query(
        `UPDATE assignments SET driver_id = NULL WHERE driver_id = ? AND bus_id NOT IN (?)`,
        [driverId, selectedBusIds]
      );

      if (cleanRoute) {
        // If driver has a primary route
        if (selectedBusIds.length === 1) {
          // Single bus assigned to specified shifts
          for (const sh of shiftsToApply) {
            await query(
              `INSERT INTO assignments (route_id, shift, bus_id, driver_id)
               VALUES (?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE bus_id = VALUES(bus_id), driver_id = VALUES(driver_id)`,
              [cleanRoute, sh, selectedBusIds[0], driverId]
            );
          }
        } else {
          // Multiple buses: distribute across shifts or assign each
          // e.g. first bus to morning1, second bus to evening1
          if (shiftsToApply.includes('morning1') && selectedBusIds[0]) {
            await query(
              `INSERT INTO assignments (route_id, shift, bus_id, driver_id)
               VALUES (?, 'morning1', ?, ?)
               ON DUPLICATE KEY UPDATE bus_id = VALUES(bus_id), driver_id = VALUES(driver_id)`,
              [cleanRoute, selectedBusIds[0], driverId]
            );
          }
          if (shiftsToApply.includes('evening1') && selectedBusIds[1]) {
            await query(
              `INSERT INTO assignments (route_id, shift, bus_id, driver_id)
               VALUES (?, 'evening1', ?, ?)
               ON DUPLICATE KEY UPDATE bus_id = VALUES(bus_id), driver_id = VALUES(driver_id)`,
              [cleanRoute, selectedBusIds[1], driverId]
            );
          }
          // For any additional buses, link to their existing route assignments
          for (const bId of selectedBusIds) {
            const [existingBusAssign] = await query(
              `SELECT id, route_id, shift FROM assignments WHERE bus_id = ? LIMIT 1`,
              [bId]
            );
            if (existingBusAssign) {
              await query(`UPDATE assignments SET driver_id = ? WHERE id = ?`, [driverId, existingBusAssign.id]);
            } else {
              await query(
                `INSERT INTO assignments (route_id, shift, bus_id, driver_id) VALUES (?, 'morning1', ?, ?)
                 ON DUPLICATE KEY UPDATE driver_id = VALUES(driver_id)`,
                [cleanRoute, bId, driverId]
              );
            }
          }
        }
      } else {
        // No specific route passed: link driver to all selected buses
        for (const bId of selectedBusIds) {
          const [existingBusAssign] = await query(
            `SELECT id FROM assignments WHERE bus_id = ? LIMIT 1`,
            [bId]
          );
          if (existingBusAssign) {
            await query(`UPDATE assignments SET driver_id = ? WHERE id = ?`, [driverId, existingBusAssign.id]);
          } else {
            // Find bus's route if any
            const [bRow] = await query('SELECT route_id FROM buses WHERE id = ?', [bId]);
            const rId = bRow?.route_id || 1;
            await query(
              `INSERT INTO assignments (route_id, shift, bus_id, driver_id) VALUES (?, 'morning1', ?, ?)
               ON DUPLICATE KEY UPDATE driver_id = VALUES(driver_id)`,
              [rId, bId, driverId]
            );
          }
        }
      }

      // Sync today's trips for all assigned buses
      try {
        await query(
          `UPDATE trips SET driver_id = ? WHERE bus_id IN (?) AND trip_date = CURDATE()`,
          [driverId, selectedBusIds]
        );
      } catch (tErr) {
        console.error('Trip sync error in driverMasterEdit:', tErr);
      }
    } else if (cleanRoute && selectedBusIds.length === 0) {
      // Route assigned without any bus
      await query(
        `UPDATE assignments SET driver_id = NULL WHERE driver_id = ? AND route_id != ?`,
        [driverId, cleanRoute]
      );
      for (const sh of shiftsToApply) {
        await query(
          `INSERT INTO assignments (route_id, shift, driver_id, bus_id)
           VALUES (?, ?, ?, NULL)
           ON DUPLICATE KEY UPDATE driver_id = VALUES(driver_id), bus_id = NULL`,
          [cleanRoute, sh, driverId]
        );
      }
    } else {
      // Both route and bus unassigned: clear driver assignments
      await query(
        `UPDATE assignments SET driver_id = NULL WHERE driver_id = ?`,
        [driverId]
      );
    }

    // Auto calculate and insert trips if missing
    try {
      const { autoLogTrips } = require('./reportController');
      if (typeof autoLogTrips === 'function') autoLogTrips().catch(() => {});
    } catch {}

    res.json({
      ok: true,
      driver_id: driverId,
      name: newName,
      institution_id: cleanInst,
      route_id: cleanRoute,
      bus_id: cleanBus
    });
  } catch (err) {
    console.error('driverMasterEdit error:', err);
    res.status(500).json({ error: err.message || 'Could not save driver master details.' });
  }
};

// POST /api/drivers/master-add
// Creates a new driver asking only for: Driver Name, Assigned Bus No (Multiple), Assigned Route, Campus/Institution
// Balance fields (Licence, Mobile, Expiry, Status) stay empty / default
exports.driverMasterAdd = async (req, res) => {
  const { name, institution_id, route_id, bus_id, bus_ids, shift, phone, status, license_number, license_expiry } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Driver name is required.' });
  }

  try {
    const cleanName = String(name).trim();
    const cleanInst = institution_id && institution_id !== 'all' ? Number(institution_id) : null;
    const cleanRoute = route_id ? Number(route_id) : null;
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanLicense = license_number ? String(license_number).trim() : null;
    let cleanExpiry = null;
    if (license_expiry) {
      const expStr = String(license_expiry).trim();
      const m = expStr.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) cleanExpiry = m[1];
      else if (expStr && expStr !== 'null' && expStr !== 'undefined') cleanExpiry = expStr.slice(0, 10);
    }
    const cleanStatus = status || 'active';

    // 1. Insert into drivers table
    const result = await query(
      `INSERT INTO drivers (name, institution_id, route_id, phone, license_number, license_expiry, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cleanName, cleanInst, cleanRoute, cleanPhone, cleanLicense, cleanExpiry, cleanStatus]
    );
    const driverId = result.insertId;

    // 2. Synchronize assignments table for multiple buses
    const shiftsToApply = (!shift || shift === 'both') ? ['morning1', 'evening1'] : [shift];
    let selectedBusIds = [];
    if (Array.isArray(bus_ids)) {
      selectedBusIds = bus_ids.map(Number).filter(Boolean);
    } else if (bus_id) {
      selectedBusIds = [Number(bus_id)];
    }

    if (selectedBusIds.length > 0) {
      if (cleanRoute) {
        if (selectedBusIds.length === 1) {
          for (const sh of shiftsToApply) {
            await query(
              `INSERT INTO assignments (route_id, shift, bus_id, driver_id)
               VALUES (?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE bus_id = VALUES(bus_id), driver_id = VALUES(driver_id)`,
              [cleanRoute, sh, selectedBusIds[0], driverId]
            );
          }
        } else {
          if (shiftsToApply.includes('morning1') && selectedBusIds[0]) {
            await query(
              `INSERT INTO assignments (route_id, shift, bus_id, driver_id)
               VALUES (?, 'morning1', ?, ?)
               ON DUPLICATE KEY UPDATE bus_id = VALUES(bus_id), driver_id = VALUES(driver_id)`,
              [cleanRoute, selectedBusIds[0], driverId]
            );
          }
          if (shiftsToApply.includes('evening1') && selectedBusIds[1]) {
            await query(
              `INSERT INTO assignments (route_id, shift, bus_id, driver_id)
               VALUES (?, 'evening1', ?, ?)
               ON DUPLICATE KEY UPDATE bus_id = VALUES(bus_id), driver_id = VALUES(driver_id)`,
              [cleanRoute, selectedBusIds[1], driverId]
            );
          }
          for (const bId of selectedBusIds) {
            const [existingBusAssign] = await query(
              `SELECT id, route_id, shift FROM assignments WHERE bus_id = ? LIMIT 1`,
              [bId]
            );
            if (existingBusAssign) {
              await query(`UPDATE assignments SET driver_id = ? WHERE id = ?`, [driverId, existingBusAssign.id]);
            } else {
              await query(
                `INSERT INTO assignments (route_id, shift, bus_id, driver_id) VALUES (?, 'morning1', ?, ?)
                 ON DUPLICATE KEY UPDATE driver_id = VALUES(driver_id)`,
                [cleanRoute, bId, driverId]
              );
            }
          }
        }
      } else {
        for (const bId of selectedBusIds) {
          const [existingBusAssign] = await query(
            `SELECT id FROM assignments WHERE bus_id = ? LIMIT 1`,
            [bId]
          );
          if (existingBusAssign) {
            await query(`UPDATE assignments SET driver_id = ? WHERE id = ?`, [driverId, existingBusAssign.id]);
          } else {
            const [bRow] = await query('SELECT route_id FROM buses WHERE id = ?', [bId]);
            const rId = bRow?.route_id || 1;
            await query(
              `INSERT INTO assignments (route_id, shift, bus_id, driver_id) VALUES (?, 'morning1', ?, ?)
               ON DUPLICATE KEY UPDATE driver_id = VALUES(driver_id)`,
              [rId, bId, driverId]
            );
          }
        }
      }

      try {
        await query(
          `UPDATE trips SET driver_id = ? WHERE bus_id IN (?) AND trip_date = CURDATE()`,
          [driverId, selectedBusIds]
        );
      } catch (tErr) {
        console.error('Trip sync error in driverMasterAdd:', tErr);
      }
    } else if (cleanRoute && selectedBusIds.length === 0) {
      for (const sh of shiftsToApply) {
        await query(
          `INSERT INTO assignments (route_id, shift, driver_id, bus_id)
           VALUES (?, ?, ?, NULL)
           ON DUPLICATE KEY UPDATE driver_id = VALUES(driver_id), bus_id = NULL`,
          [cleanRoute, sh, driverId]
        );
      }
    }

    try {
      const { autoLogTrips } = require('./reportController');
      if (typeof autoLogTrips === 'function') autoLogTrips().catch(() => {});
    } catch {}

    res.status(201).json({
      ok: true,
      id: driverId,
      driver_id: driverId,
      name: cleanName,
      institution_id: cleanInst,
      route_id: cleanRoute,
      bus_ids: selectedBusIds,
      status: cleanStatus
    });
  } catch (err) {
    console.error('driverMasterAdd error:', err);
    res.status(500).json({ error: err.message || 'Could not add new driver.' });
  }
};

