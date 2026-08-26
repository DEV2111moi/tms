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
    cols: ['name', 'license_number', 'license_expiry', 'phone', 'route_id', 'user_id', 'status', 'institution_id', 'employee_code', 'father_name', 'date_of_birth', 'gender', 'blood_group', 'alternate_mobile', 'email', 'current_address', 'permanent_address', 'native_place', 'district', 'state', 'pincode', 'aadhaar_no', 'photo', 'joining_date', 'employment_type', 'designation', 'experience_years', 'previous_employer', 'epf_applicable', 'epf_uan_no', 'esi_applicable', 'esi_no', 'license_type', 'license_issue_date', 'badge_no', 'badge_expiry_date', 'emergency_contact_name', 'emergency_contact_relation', 'emergency_contact_no', 'daily_trips'],
    order: 'name',
  },
  students: {
    cols: ['student_id', 'name', 'class_grade', 'rfid_card', 'guardian_phone', 'parent_user_id', 'route_id', 'stop_id', 'institution_id', 'admission_no', 'register_no', 'date_of_birth', 'gender', 'department', 'course', 'year_of_study', 'section', 'student_mobile', 'email', 'parent_name', 'parent_mobile', 'alternate_mobile', 'address', 'photo', 'blood_group', 'status'],
    order: 'name',
  },
  routes: {
    cols: ['route_code', 'route_name', 'origin', 'destination', 'total_distance', 'institution_id', 'shift'],
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

// Turn '' into NULL so optional foreign keys / dates don't break.
const clean = (v) => (v === '' || v === undefined ? null : v);

function pick(table, body) {
  const def = TABLES[table];
  const data = {};
  def.cols.forEach((c) => { if (c in body) data[c] = clean(body[c]); });
  return data;
}

// GET /api/:table  (optionally ?route_id=1&institution_id=1)
exports.list = (table) => async (req, res) => {
  const def = TABLES[table];
  if (!def) return res.status(404).json({ error: 'Unknown record type.' });
  try {
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
