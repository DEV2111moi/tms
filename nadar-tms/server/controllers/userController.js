const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');

// GET /api/users?role=driver
exports.list = async (req, res) => {
  try {
    const params = []; const where = [];
    let sql = 'SELECT id, name, email, phone, role, institution_id FROM users';
    if (req.user.role === 'institution') {
      const me = (await query('SELECT institution_id FROM users WHERE id=?', [req.user.id]))[0] || {};
      where.push('role = ?'); params.push('incharge');
      where.push('institution_id = ?'); params.push(me.institution_id || 0);
    } else if (req.query.role) { where.push('role = ?'); params.push(req.query.role); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY role, name';
    res.json({ items: await query(sql, params) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load user accounts.' }); }
};

// POST /api/users
exports.create = async (req, res) => {
  const { name, email, password, phone, institution_id } = req.body || {};
  let role = (req.body || {}).role;
  let instId = institution_id || null;
  if (req.user.role === 'institution') {
    role = 'incharge';
    const me = (await query('SELECT institution_id FROM users WHERE id=?', [req.user.id]))[0] || {};
    instId = me.institution_id || null;
  } else if (role === 'incharge') {
    return res.status(403).json({ error: 'Bus incharge logins are created by the institution incharge, not admin.' });
  }
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'Name, email, password and role are required.' });
  if (!['admin', 'executive', 'institution', 'incharge', 'driver', 'parent'].includes(role))
    return res.status(400).json({ error: 'Invalid role.' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const r = await query('INSERT INTO users (name, email, phone, password, role, institution_id) VALUES (?,?,?,?,?,?)',
      [name, email, phone || null, hash, role, instId]);
    res.status(201).json({ id: r.insertId, name, email, role });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That email is already used by another login.' });
    console.error(e); res.status(500).json({ error: 'Could not create the login.' });
  }
};

// PUT /api/users/:id
exports.update = async (req, res) => {
  const { name, email, role, phone, password, institution_id } = req.body || {};
  try {
    if (req.user.role === 'institution') {
      const me = (await query('SELECT institution_id FROM users WHERE id=?', [req.user.id]))[0] || {};
      const target = (await query('SELECT role, institution_id FROM users WHERE id=?', [req.params.id]))[0];
      if (!target || target.role !== 'incharge' || String(target.institution_id) !== String(me.institution_id))
        return res.status(403).json({ error: 'You can edit only bus-incharge logins of your institution.' });
    }
    const sets = [], vals = [];
    if (name)  { sets.push('name=?');  vals.push(name); }
    if (email) { sets.push('email=?'); vals.push(email); }
    if (role)  { sets.push('role=?');  vals.push(role); }
    if (phone !== undefined) { sets.push('phone=?'); vals.push(phone || null); }
    if (institution_id !== undefined) { sets.push('institution_id=?'); vals.push(institution_id || null); }
    if (password) { sets.push('password=?'); vals.push(bcrypt.hashSync(password, 10)); }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update.' });
    vals.push(req.params.id);
    await query(`UPDATE users SET ${sets.join(', ')} WHERE id=?`, vals);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That email is already in use.' });
    console.error(e); res.status(500).json({ error: 'Could not update the login.' });
  }
};

// DELETE /api/users/:id
exports.remove = async (req, res) => {
  try {
    if (req.user.role === 'institution') {
      const me = (await query('SELECT institution_id FROM users WHERE id=?', [req.user.id]))[0] || {};
      const target = (await query('SELECT role, institution_id FROM users WHERE id=?', [req.params.id]))[0];
      if (!target || target.role !== 'incharge' || String(target.institution_id) !== String(me.institution_id))
        return res.status(403).json({ error: 'You can delete only bus-incharge logins of your institution.' });
    }
    await query('DELETE FROM users WHERE id=?', [req.params.id]); res.json({ ok: true });
  }
  catch (e) { console.error(e); res.status(500).json({ error: 'Could not delete the login.' }); }
};
