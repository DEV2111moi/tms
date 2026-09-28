const { query } = require('../db/pool');

// GET /api/substitutions?date=YYYY-MM-DD
exports.list = async (req, res) => {
  try {
    const subDate = req.query.date || new Date().toLocaleDateString('en-CA');
    const status = req.query.status || 'active';

    let sql = `
      SELECT ds.*,
             ob.registration_number AS original_bus_number,
             ob.bus_model AS original_bus_model,
             sb.registration_number AS substitute_bus_number,
             sb.bus_model AS substitute_bus_model,
             sb.capacity AS substitute_capacity,
             r.route_code,
             r.route_name,
             r.total_distance,
             od.name AS original_driver_name,
             sd.name AS substitute_driver_name,
             sd.phone AS substitute_driver_phone,
             COALESCE(i.short_name, i.name, '—') AS institution_name
      FROM daily_substitutions ds
      JOIN buses ob ON ob.id = ds.original_bus_id
      JOIN buses sb ON sb.id = ds.substitute_bus_id
      LEFT JOIN routes r ON r.id = ds.route_id
      LEFT JOIN drivers od ON od.id = ds.original_driver_id
      LEFT JOIN drivers sd ON sd.id = ds.substitute_driver_id
      LEFT JOIN institutions i ON i.id = COALESCE(r.institution_id, ob.institution_id)
      WHERE (ds.status = 'active' OR ds.sub_date = ?)
    `;
    const params = [subDate];

    if (status && status !== 'all') {
      sql += ` AND ds.status = ?`;
      params.push(status);
    }

    // Institution filter for campus incharge
    if (req.user && req.user.role === 'institution' && req.user.institution_id) {
      sql += ` AND (ob.institution_id = ? OR r.institution_id = ?)`;
      params.push(req.user.institution_id, req.user.institution_id);
    }

    sql += ` ORDER BY ds.id DESC`;
    const items = await query(sql, params);
    res.json({ items, date: subDate });
  } catch (err) {
    console.error('Error listing substitutions:', err);
    res.status(500).json({ error: 'Could not fetch substitutions' });
  }
};

// POST /api/substitutions
exports.create = async (req, res) => {
  try {
    const {
      sub_date,
      original_bus_id,
      route_id,
      original_driver_id,
      substitute_bus_id,
      substitute_driver_id,
      shifts,
      reason,
      is_extra_trip,
      notes
    } = req.body;

    if (!original_bus_id || !substitute_bus_id) {
      return res.status(400).json({ error: 'Both breakdown bus and substitute bus are required.' });
    }

    const effectiveDate = sub_date || new Date().toLocaleDateString('en-CA');
    const effectiveReason = reason || 'Breakdown';
    const effectiveExtraTrip = is_extra_trip !== undefined ? (is_extra_trip ? 1 : 0) : 1;
    const effectiveShifts = shifts || 'all';
    const userId = req.user?.id || null;

    // Check if an active substitution already exists for this bus on this date
    const existing = await query(`
      SELECT id FROM daily_substitutions
      WHERE original_bus_id = ? AND sub_date = ? AND status = 'active'
      LIMIT 1
    `, [original_bus_id, effectiveDate]);

    let subId;
    if (existing.length > 0) {
      subId = existing[0].id;
      await query(`
        UPDATE daily_substitutions
        SET route_id = ?,
            original_driver_id = ?,
            substitute_bus_id = ?,
            substitute_driver_id = ?,
            shifts = ?,
            reason = ?,
            is_extra_trip = ?,
            notes = ?,
            status = 'active',
            updated_at = NOW()
        WHERE id = ?
      `, [
        route_id || null,
        original_driver_id || null,
        substitute_bus_id,
        substitute_driver_id || null,
        effectiveShifts,
        effectiveReason,
        effectiveExtraTrip,
        notes || null,
        subId
      ]);
    } else {
      const result = await query(`
        INSERT INTO daily_substitutions
        (sub_date, original_bus_id, route_id, original_driver_id, substitute_bus_id, substitute_driver_id, shifts, reason, is_extra_trip, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        effectiveDate,
        original_bus_id,
        route_id || null,
        original_driver_id || null,
        substitute_bus_id,
        substitute_driver_id || null,
        effectiveShifts,
        effectiveReason,
        effectiveExtraTrip,
        notes || null,
        userId
      ]);
      subId = result.insertId;
    }

    // Sync trip logs: if trips were already generated for original_bus_id on effectiveDate,
    // reassign them to substitute_bus_id & substitute_driver_id with cover duty remarks
    try {
      const origBus = (await query('SELECT registration_number FROM buses WHERE id = ?', [original_bus_id]))[0];
      const origReg = origBus ? origBus.registration_number : '';

      // Check if driver has a linked user id in users table
      let subUserId = substitute_driver_id;
      if (substitute_driver_id) {
        const u = await query('SELECT id FROM users WHERE driver_id = ? LIMIT 1', [substitute_driver_id]);
        if (u.length > 0) subUserId = u[0].id;
      }

      await query(`
        UPDATE trip_logs
        SET bus_id = ?,
            driver_id = COALESCE(?, driver_id)
        WHERE bus_id = ? AND log_date = ?
      `, [substitute_bus_id, subUserId, original_bus_id, effectiveDate]);
    } catch (e) {
      console.warn('Trip logs sync note:', e.message);
    }

    // Fetch the complete created substitution with details
    const created = (await query(`
      SELECT ds.*,
             ob.registration_number AS original_bus_number,
             sb.registration_number AS substitute_bus_number,
             r.route_code,
             r.route_name,
             od.name AS original_driver_name,
             sd.name AS substitute_driver_name
      FROM daily_substitutions ds
      JOIN buses ob ON ob.id = ds.original_bus_id
      JOIN buses sb ON sb.id = ds.substitute_bus_id
      LEFT JOIN routes r ON r.id = ds.route_id
      LEFT JOIN drivers od ON od.id = ds.original_driver_id
      LEFT JOIN drivers sd ON sd.id = ds.substitute_driver_id
      WHERE ds.id = ?
    `, [subId]))[0];

    res.json({
      success: true,
      message: `Bus ${created.original_bus_number} marked as breakdown. Substituted by ${created.substitute_bus_number}.`,
      item: created
    });
  } catch (err) {
    console.error('Error creating substitution:', err);
    res.status(500).json({ error: err.message || 'Could not create substitution' });
  }
};

// PUT /api/substitutions/:id/resolve
exports.resolve = async (req, res) => {
  try {
    const { id } = req.params;
    await query(`
      UPDATE daily_substitutions
      SET status = 'resolved', updated_at = NOW()
      WHERE id = ?
    `, [id]);

    res.json({ success: true, message: 'Substitution marked as resolved. Original bus restored.' });
  } catch (err) {
    console.error('Error resolving substitution:', err);
    res.status(500).json({ error: 'Could not resolve substitution' });
  }
};

// DELETE /api/substitutions/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM daily_substitutions WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Substitution removed.' });
  } catch (err) {
    console.error('Error deleting substitution:', err);
    res.status(500).json({ error: 'Could not remove substitution' });
  }
};
