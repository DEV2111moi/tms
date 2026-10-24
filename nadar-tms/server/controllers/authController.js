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

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters.' });
  }
  try {
    const rows = await query('SELECT password FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });

    if (currentPassword && !bcrypt.compareSync(currentPassword, rows[0].password)) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update password.' });
  }
};

