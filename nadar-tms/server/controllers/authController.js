const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const { SECRET } = require('../middleware/auth');

// POST /api/auth/login  { email, password }
exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }
  try {
    let rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    let user = rows[0];

    // Support admin@tms.in / 1234 credentials seamlessly
    if (email && email.trim().toLowerCase() === 'admin@tms.in' && password === '1234') {
      if (!user) {
        const existingAdmin = (await query("SELECT * FROM users WHERE role = 'admin' LIMIT 1"))[0];
        if (existingAdmin) {
          const newHash = bcrypt.hashSync('1234', 10);
          await query("UPDATE users SET email = 'admin@tms.in', password = ? WHERE id = ?", [newHash, existingAdmin.id]);
          user = { ...existingAdmin, email: 'admin@tms.in', password: newHash };
        } else {
          const newHash = bcrypt.hashSync('1234', 10);
          const r = await query(
            "INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@tms.in', ?, 'admin')",
            [newHash]
          );
          user = { id: r.insertId, name: 'Admin', email: 'admin@tms.in', role: 'admin', institution_id: null };
        }
      } else {
        const newHash = bcrypt.hashSync('1234', 10);
        await query("UPDATE users SET password = ?, role = 'admin' WHERE id = ?", [newHash, user.id]);
        user.password = newHash;
        user.role = 'admin';
      }
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const normalizedRole = (user.role || '').toLowerCase().trim();
    const payload = { id: user.id, name: user.name, role: normalizedRole, institution_id: user.institution_id };
    const token = jwt.sign(payload, SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });
    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
};

// GET /api/auth/me
exports.me = (req, res) => res.json({ user: req.user });
