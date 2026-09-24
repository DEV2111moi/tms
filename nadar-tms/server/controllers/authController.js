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
    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email.trim()]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const normalizedRole = (user.role || '').toLowerCase().trim();
    const payload = { id: user.id, name: user.name, role: normalizedRole, institution_id: user.institution_id };
    const token = jwt.sign(payload, SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });
    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
};

// GET /api/auth/me
exports.me = (req, res) => res.json({ user: req.user });
