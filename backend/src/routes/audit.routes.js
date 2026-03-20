// ─────────────────────────────────────────────
//  Audit Logs Routes — /api/audit-logs
// ─────────────────────────────────────────────
const router = require('express').Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// GET /api/audit-logs/my-activity - User's own activity
router.get('/my-activity', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const logs = await db('audit_logs')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const total = await db('audit_logs')
      .where({ user_id: req.user.id })
      .count('* as count')
      .first();

    res.json({
      data: logs,
      pagination: { total: total.count, limit: parseInt(limit), offset: parseInt(offset) },
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/audit-logs - All audit logs (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all audit logs' });
    }

    const { action, userId, limit = 50, offset = 0 } = req.query;
    let query = db('audit_logs');

    if (action) query = query.where({ action });
    if (userId) query = query.where({ user_id: userId });

    const logs = await query
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const total = await db('audit_logs').count('* as count').first();

    res.json({
      data: logs,
      pagination: { total: total.count, limit: parseInt(limit), offset: parseInt(offset) },
    });
  } catch (error) {
    logger.error('Error fetching all audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/audit-logs/failed-logins - Failed login attempts
router.get('/failed-logins', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view failed logins' });
    }

    const { limit = 50, offset = 0 } = req.query;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const logs = await db('failed_login_attempts')
      .where('attempted_at', '>=', oneDayAgo)
      .orderBy('attempted_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const total = await db('failed_login_attempts')
      .where('attempted_at', '>=', oneDayAgo)
      .count('* as count')
      .first();

    res.json({
      data: logs,
      pagination: { total: total.count, limit: parseInt(limit), offset: parseInt(offset) },
    });
  } catch (error) {
    logger.error('Error fetching failed logins:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
