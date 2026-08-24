const { query } = require('../db/pool');

// GET /api/notifications — role-scoped
exports.list = async (req, res) => {
  try {
    const role = req.user.role;
    let rows = [];
    if (role === 'admin' || role === 'executive') {
      rows = await query('SELECT * FROM notifications ORDER BY id DESC LIMIT 20');
    } else if (role === 'institution') {
      const me = (await query('SELECT institution_id FROM users WHERE id=?', [req.user.id]))[0] || {};
      rows = await query('SELECT * FROM notifications WHERE institution_id=? OR institution_id IS NULL ORDER BY id DESC LIMIT 20', [me.institution_id || 0]);
    } else if (role === 'incharge') {
      rows = await query('SELECT * FROM notifications WHERE incharge_id=? ORDER BY id DESC LIMIT 20', [req.user.id]);
    } else if (role === 'parent') {
      rows = await query(`SELECT n.* FROM notifications n
        WHERE n.route_id IN (SELECT route_id FROM students WHERE parent_user_id=?) ORDER BY n.id DESC LIMIT 20`, [req.user.id]);
    }
    res.json({ items: rows });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not load notifications.' }); }
};
