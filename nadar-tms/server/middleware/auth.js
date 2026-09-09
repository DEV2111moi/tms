const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

/**
 * Verifies the Bearer token and attaches { id, name, role } to req.user
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Sign in to continue.' });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Your session expired. Sign in again.' });
  }
}

/**
 * Restricts a route to one or more roles.
 * Usage: requireRole('admin', 'incharge')
 */
function requireRole(...roles) {
  const allowed = roles.map((r) => String(r).toLowerCase().trim());
  return (req, res, next) => {
    const userRole = (req.user?.role || '').toLowerCase().trim();
    if (!req.user || !allowed.includes(userRole)) {
      console.warn(
        `[AUTH 403] Denied ${req.method} ${req.originalUrl} for user '${req.user?.name}' (role: '${req.user?.role}'). Allowed roles:`,
        allowed
      );
      return res.status(403).json({ error: 'You do not have access to this action.' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole, SECRET };
