// ─────────────────────────────────────────────
//  Auth Middleware — JWT verification
// ─────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../utils/logger');

// Track last activity update per user to avoid excessive DB writes
// Only update once per minute per user
const lastActivityUpdate = new Map();
const ACTIVITY_UPDATE_INTERVAL = 60 * 1000; // 1 minute

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add timeout to database query (5 seconds for auth check)
    const userPromise = db('users').where({ id: decoded.id, is_active: true }).first();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), 5000)
    );

    const user = await Promise.race([userPromise, timeoutPromise]);
    if (!user) return res.status(401).json({ error: 'User not found or inactive' });
    req.user = user;

    // Update last_login as activity indicator (throttled to once per minute)
    const now = Date.now();
    const lastUpdate = lastActivityUpdate.get(user.id);
    if (!lastUpdate || now - lastUpdate > ACTIVITY_UPDATE_INTERVAL) {
      lastActivityUpdate.set(user.id, now);
      // Fire-and-forget — don't block the request
      db('users')
        .where({ id: user.id })
        .update({ last_login: new Date() })
        .catch(err => logger.error('Activity update error:', err.message));
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    if (err.message === 'Database query timeout')
      return res.status(503).json({ error: 'Service temporarily unavailable' });

    logger.error('Auth middleware error:', err.message);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const userRole = req.user.role?.toLowerCase();
    if (!roles.map(r => r.toLowerCase()).includes(userRole))
      return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };

module.exports = { authenticate, requireRole };
