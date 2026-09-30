const { query } = require('../db/pool');

// Whitelist of writable columns per table — prevents arbitrary column writes.
const TABLES = {
  institutions: {
    cols: ['code', 'name', 'short_name'],
    order: 'name',
  },
  buses: {
    cols: ['registration_number', 'bus_model', 'capacity', 'status', 'route_id', 'fc_number', 'fc_expiry', 'insurance_expiry', 'permit_expiry', 'puc_expiry', 'institution_id', 'bus_code', 'bus_name', 'vehicle_type', 'manufacturer', 'manufacturing_year', 'purchase_date', 'fuel_type', 'chassis_no', 'engine_no', 'bus_photo', 'rc_book_file', 'insurance_no', 'insurance_company', 'permit_no', 'permit_type', 'pollution_certificate_no', 'gps_device_id', 'gps_enabled', 'current_odometer_km', 'ownership_type'],
    order: 'registration_number',
  },
  drivers: {
    cols: ['name', 'license_number', 'license_expiry', 'phone', 'route_id', 'user_id', 'status', 'institution_id', 'employee_code', 'father_name', 'date_of_birth', 'gender', 'blood_group', 'alternate_mobile', 'email', 'current_address', 'permanent_address', 'native_place', 'district', 'state', 'pincode', 'aadhaar_no', 'photo', 'joining_date', 'employment_type', 'designation', 'experience_years', 'previous_employer', 'epf_applicable', 'epf_uan_no', 'esi_applicable', 'esi_no', 'license_type', 'license_issue_date', 'badge_no', 'badge_expiry_date', 'emergency_contact_name', 'emergency_contact_relation', 'emergency_contact_no', 'emergency_contact_phone', 'daily_trips', 'driver_type'],
    order: 'name',
  },
  students: {
    cols: ['student_id', 'name', 'class_grade', 'rfid_card', 'guardian_phone', 'parent_user_id', 'route_id', 'stop_id', 'institution_id', 'admission_no', 'register_no', 'date_of_birth', 'gender', 'department', 'course', 'year_of_study', 'section', 'student_mobile', 'email', 'parent_name', 'parent_mobile', 'alternate_mobile', 'address', 'photo', 'blood_group', 'status'],
    order: 'name',
  },
  routes: {
    cols: ['route_code', 'route_name', 'origin', 'destination', 'initial_point', 'initial_time', 'total_distance', 'institution_id', 'shift'],
    order: 'route_code',
  },
  stops: {
    cols: ['route_id', 'stop_name', 'sequence', 'scheduled_time', 'latitude', 'longitude'],
    order: 'route_id, sequence',
  },
  maintenance_logs: {
    cols: ['bus_id', 'service_date', 'service_type', 'cost', 'odometer', 'next_due_date', 'notes'],
    order: 'service_date DESC',
  },
  tyres: {
    cols: ['bus_id', 'tyre_position', 'tyre_brand', 'tyre_size', 'year_of_make', 'tyre_quality', 'serial_no', 'purchase_date', 'purchase_price', 'fitted_date', 'fitted_odometer_km', 'current_km_run', 'expected_life_km', 'condition_status', 'tyre_status', 'remarks'],
    order: 'bus_id',
  },
};

// Whitelist of date column names that must be formatted as YYYY-MM-DD (or NULL) for MySQL DATE columns
const DATE_COLS = new Set([
  'license_expiry',
  'date_of_birth',
  'joining_date',
  'license_issue_date',
  'badge_expiry_date',
  'fc_expiry',
  'insurance_expiry',
  'permit_expiry',
  'puc_expiry',
  'purchase_date',
  'service_date',
  'next_due_date',
  'fitted_date',
  'attendance_date',
]);

const isDateCol = (col) => {
  if (!col) return false;
  return DATE_COLS.has(col) || col.endsWith('_expiry') || col.endsWith('_date') || col === 'date_of_birth';
};

// Turn '' into NULL so optional foreign keys / dates don't break.
// Also sanitize any date columns into YYYY-MM-DD or NULL to prevent MySQL ER_TRUNCATED_WRONG_VALUE (1292).
const clean = (v, col) => {
  if (v === '' || v === undefined || v === null || v === 'null' || v === 'undefined') return null;

  if (isDateCol(col)) {
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
      // Match YYYY-MM-DD from ISO strings like '2029-09-23T18:30:00.000Z' or '2029-09-23 00:00:00'
      const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
      if (isoMatch) return isoMatch[1];
      // Match DD-MM-YYYY or DD/MM/YYYY
      const ddmmyyyy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (ddmmyyyy) {
        return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      return null;
    }
    if (v instanceof Date && !isNaN(v.getTime())) {
      return v.toISOString().slice(0, 10);
    }
  }

  return v;
};

function pick(table, body) {
  const def = TABLES[table];
  const data = {};
  def.cols.forEach((c) => { if (c in body) data[c] = clean(body[c], c); });
  return data;
}

// GET /api/:table  (optionally ?route_id=1&institution_id=1)
exports.list = (table) => async (req, res) => {
  const def = TABLES[table];
  if (!def) return res.status(404).json({ error: 'Unknown record type.' });
  try {
    const qInst = req.query.institution_id;
    let targetInst = null;
    if (qInst !== undefined) {
      if (qInst && qInst !== 'all' && qInst !== 'ALL') {
        targetInst = qInst;
      }
    } else if (req.user && req.user.role === 'institution' && req.user.institution_id) {
      targetInst = req.user.institution_id;
    }

    // ---- Enhanced Buses view with assignments & route linking (Grouped & Deduplicated) ----
    if (table === 'buses') {
      const targetDate = req.query.date || new Date().toLocaleDateString('en-CA');
      let sql = `
        SELECT b.*,
               GROUP_CONCAT(DISTINCT r.id ORDER BY r.route_code SEPARATOR ',') AS assigned_route_ids,
               GROUP_CONCAT(DISTINCT r.route_code ORDER BY r.route_code SEPARATOR ', ') AS assigned_route_code,
               GROUP_CONCAT(DISTINCT r.route_name ORDER BY r.route_code SEPARATOR ', ') AS assigned_route_name,
               COALESCE(
                 NULLIF(GROUP_CONCAT(DISTINCT d.name ORDER BY d.name SEPARATOR ', '), ''),
                 (SELECT td.name FROM trips t JOIN drivers td ON td.id = t.driver_id WHERE t.bus_id = b.id ORDER BY t.id DESC LIMIT 1),
                 '—'
               ) AS driver_name,
               COALESCE(MAX(a.driver_id), (SELECT td.id FROM trips t JOIN drivers td ON td.id = t.driver_id WHERE t.bus_id = b.id ORDER BY t.id DESC LIMIT 1)) AS current_driver_id,
               COALESCE(MAX(i.short_name), MAX(i.name), '—') AS institution_name,

               -- Daily Breakdown / Substitution info for requested date
               MAX(ds.id) AS substitution_id,
               MAX(ds.sub_date) AS substitution_date,
               MAX(ds.reason) AS breakdown_reason,
               MAX(ds.is_extra_trip) AS is_extra_trip,
               MAX(ds.shifts) AS breakdown_shifts,
               MAX(ds.notes) AS breakdown_notes,
               MAX(ds.status) AS substitution_status,
               MAX(sb.id) AS substitute_bus_id,
               MAX(sb.registration_number) AS substitute_bus_number,
               MAX(sb.bus_model) AS substitute_bus_model,
               MAX(sb.capacity) AS substitute_capacity,
               MAX(sd.id) AS substitute_driver_id,
               MAX(sd.name) AS substitute_driver_name,
               (CASE WHEN MAX(ds.id) IS NOT NULL AND MAX(ds.status) = 'active' THEN 1 ELSE 0 END) AS is_breakdown
        FROM buses b
        LEFT JOIN assignments a ON a.bus_id = b.id
        LEFT JOIN routes r ON r.id = a.route_id
        LEFT JOIN drivers d ON d.id = a.driver_id
        LEFT JOIN institutions i ON i.id = COALESCE(b.institution_id, r.institution_id)
        LEFT JOIN daily_substitutions ds ON ds.id = COALESCE(
          (SELECT ds2.id FROM daily_substitutions ds2 WHERE ds2.original_bus_id = b.id AND ds2.status = 'active' ORDER BY ds2.id DESC LIMIT 1),
          (SELECT ds3.id FROM daily_substitutions ds3 WHERE ds3.original_bus_id = b.id AND ds3.sub_date = ? ORDER BY ds3.id DESC LIMIT 1)
        )
        LEFT JOIN buses sb ON sb.id = ds.substitute_bus_id
        LEFT JOIN drivers sd ON sd.id = ds.substitute_driver_id
      `;
      const params = [targetDate];
      const whereConditions = [];

      if (req.query.route_id) {
        whereConditions.push('(b.route_id = ? OR a.route_id = ?)');
        params.push(req.query.route_id, req.query.route_id);
      }
      if (targetInst) {
        whereConditions.push('(b.institution_id = ? OR r.institution_id = ?)');
        params.push(targetInst, targetInst);
      }

      if (whereConditions.length > 0) {
        sql += ` WHERE ` + whereConditions.join(' AND ');
      }

      sql += ` GROUP BY b.id ORDER BY b.registration_number`;
      const items = await query(sql, params);
      return res.json({ items, date: targetDate });
    }

    // ---- Enhanced Drivers view with assignments & route linking (Grouped & Deduplicated) ----
    if (table === 'drivers') {
      let sql = `
        SELECT d.*,
               MAX(a.bus_id) AS current_bus_id,
               GROUP_CONCAT(DISTINCT a.bus_id ORDER BY a.bus_id SEPARATOR ',') AS current_bus_ids,
               COALESCE(MAX(a.route_id), d.route_id) AS current_route_id,
               GROUP_CONCAT(DISTINCT a.route_id ORDER BY a.route_id SEPARATOR ',') AS current_route_ids,
               COALESCE(d.institution_id, MAX(r.institution_id), MAX(b.institution_id)) AS current_institution_id,
               GROUP_CONCAT(DISTINCT b.registration_number ORDER BY b.registration_number SEPARATOR ', ') AS assigned_bus_numbers,
               GROUP_CONCAT(DISTINCT r.route_code ORDER BY r.route_code SEPARATOR ', ') AS assigned_route_code,
               GROUP_CONCAT(DISTINCT r.route_name ORDER BY r.route_code SEPARATOR ', ') AS assigned_route_name,
               COALESCE(MAX(i.short_name), MAX(i.name), '—') AS institution_name
        FROM drivers d
        LEFT JOIN assignments a ON a.driver_id = d.id
        LEFT JOIN routes r ON r.id = a.route_id
        LEFT JOIN buses b ON b.id = a.bus_id
        LEFT JOIN institutions i ON i.id = COALESCE(d.institution_id, r.institution_id, b.institution_id)
      `;
      const params = [];
      const whereConditions = [];

      if (req.query.route_id) {
        whereConditions.push('(d.route_id = ? OR a.route_id = ?)');
        params.push(req.query.route_id, req.query.route_id);
      }
      if (targetInst) {
        whereConditions.push('(d.institution_id = ? OR r.institution_id = ? OR b.institution_id = ?)');
        params.push(targetInst, targetInst, targetInst);
      }

      if (whereConditions.length > 0) {
        sql += ` WHERE ` + whereConditions.join(' AND ');
      }

      sql += ` GROUP BY d.id ORDER BY d.name`;
      const items = await query(sql, params);
      return res.json({ items });
    }

    // ---- Enhanced Routes view with institution info ----
    if (table === 'routes') {
      let sql = `
        SELECT r.*,
               COALESCE(i.short_name, i.name, '—') AS institution_name,
               (
                 SELECT GROUP_CONCAT(s.stop_name ORDER BY s.sequence ASC SEPARATOR ', ')
                 FROM stops s
                 WHERE s.route_id = r.id
               ) AS stops_list,
               (
                 SELECT COUNT(*)
                 FROM stops s
                 WHERE s.route_id = r.id
               ) AS total_stops
        FROM routes r
        LEFT JOIN institutions i ON i.id = r.institution_id
      `;
      const params = [];
      if (targetInst) {
        sql += ` WHERE r.institution_id = ?`;
        params.push(targetInst);
      }
      sql += ` ORDER BY r.route_code`;
      const items = await query(sql, params);
      return res.json({ items });
    }

    const params = []; const where = [];
    let sql = `SELECT * FROM \`${table}\``;
    if (req.query.route_id && def.cols.includes('route_id')) { where.push('route_id = ?'); params.push(req.query.route_id); }
    if (req.query.institution_id && def.cols.includes('institution_id')) { where.push('institution_id = ?'); params.push(req.query.institution_id); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ` ORDER BY ${def.order}`;
    res.json({ items: await query(sql, params) });
  } catch (e) { console.error(e); res.status(500).json({ error: `Could not load ${table}.` }); }
};

// POST /api/:table
exports.create = (table) => async (req, res) => {
  const def = TABLES[table];
  if (!def) return res.status(404).json({ error: 'Unknown record type.' });
  const data = pick(table, req.body || {});
  const keys = Object.keys(data);
  if (!keys.length) return res.status(400).json({ error: 'Nothing to save.' });
  try {
    const sql = `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(',')})
                 VALUES (${keys.map(() => '?').join(',')})`;
    const r = await query(sql, keys.map((k) => data[k]));
    res.status(201).json({ id: r.insertId, ...data });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That record already exists.' });
    res.status(500).json({ error: `Could not save the ${table.slice(0, -1)}.` });
  }
};

// PUT /api/:table/:id
exports.update = (table) => async (req, res) => {
  const def = TABLES[table];
  if (!def) return res.status(404).json({ error: 'Unknown record type.' });
  const data = pick(table, req.body || {});
  const keys = Object.keys(data);
  if (!keys.length) return res.status(400).json({ error: 'Nothing to update.' });
  try {
    if (table === 'drivers') {
      if (data.status === 'inactive') {
        if (data.route_id) {
          return res.status(400).json({ error: 'Cannot assign route to an inactive driver. Please activate status first.' });
        }
        data.route_id = null;
        try {
          await query('UPDATE assignments SET driver_id = NULL WHERE driver_id = ?', [req.params.id]);
        } catch {}
      } else if (data.route_id) {
        const [drv] = await query('SELECT status FROM drivers WHERE id = ?', [req.params.id]);
        if (drv && String(drv.status).toLowerCase() === 'inactive' && data.status !== 'active') {
          return res.status(400).json({ error: 'Cannot assign route to an inactive driver. Please activate status first.' });
        }
      }
    }

    const sql = `UPDATE \`${table}\` SET ${keys.map((k) => `\`${k}\`=?`).join(',')} WHERE id=?`;
    await query(sql, [...keys.map((k) => data[k]), req.params.id]);
    res.json({ id: Number(req.params.id), ...data });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That value is already in use.' });
    res.status(500).json({ error: `Could not update the ${table.slice(0, -1)}.` });
  }
};

// DELETE /api/:table/:id
exports.remove = (table) => async (req, res) => {
  if (!TABLES[table]) return res.status(404).json({ error: 'Unknown record type.' });
  try {
    await query(`DELETE FROM \`${table}\` WHERE id=?`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: `Could not delete the ${table.slice(0, -1)}.` }); }
};
