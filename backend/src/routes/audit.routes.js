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

// GET /api/audit-logs - All audit logs (admin only) with user details
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all audit logs' });
    }

    const { action, userId, status, search, limit = 50, offset = 0, startDate, endDate } = req.query;
    let query = db('audit_logs')
      .select(
        'audit_logs.*',
        'users.name as user_name',
        'users.email as user_email',
        'users.role as user_role',
        'users.avatar_color',
        'users.initials'
      )
      .leftJoin('users', 'audit_logs.user_id', 'users.id');

    if (action) query = query.where('audit_logs.action', action);
    if (userId) query = query.where('audit_logs.user_id', userId);
    if (status) query = query.where('audit_logs.status', status);

    if (startDate && endDate) {
      query = query.whereBetween('audit_logs.created_at', [new Date(startDate), new Date(endDate)]);
    }

    if (search) {
      query = query.where(q => 
        q.where('users.name', 'like', `%${search}%`)
          .orWhere('users.email', 'like', `%${search}%`)
          .orWhere('audit_logs.action', 'like', `%${search}%`)
          .orWhere('audit_logs.ip_address', 'like', `%${search}%`)
      );
    }

    const countResult = await query.clone().count('* as count').first();
    const total = countResult.count;

    const logs = await query
      .orderBy('audit_logs.created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({
      data: logs,
      pagination: { total, limit: parseInt(limit), offset: parseInt(offset) },
      summary: {
        total_logs: total,
        total_admins: await db('users').where({ role: 'admin' }).count('* as count').first(),
        total_users: await db('users').count('* as count').first(),
      }
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
