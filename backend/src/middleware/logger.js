// ─────────────────────────────────────────────
//  Access Logger Middleware
//  Logs all user activities to audit_logs
// ─────────────────────────────────────────────
const db = require('../config/database');
const { v4: uuid } = require('uuid');

const logActivity = async (req, res, next) => {
  // Capture original res.send
  const originalSend = res.send;

  res.send = function (data) {
    // Log after response is processed
    setImmediate(async () => {
      try {
        if (req.user && req.user.id) {
          // Determine action from route
          const method = req.method;
          const path = req.path;
          let action = 'unknown_action';
          let entityType = null;
          const entityId = null;

          // Extract action and entity info
          if (path.includes('/login')) action = 'login';
          else if (path.includes('/logout')) action = 'logout';
          else if (path.includes('/password-reset')) action = 'password_reset';
          else if (path.includes('/two-fa'))
            action = path.includes('enable') ? 'two_fa_enabled' : 'two_fa_disabled';
          else if (path.includes('/test-cases')) {
            entityType = 'test_case';
            if (method === 'POST') action = 'created_resource';
            else if (method === 'PUT') action = 'updated_resource';
            else if (method === 'DELETE') action = 'deleted_resource';
            else action = 'accessed_test_cases';
          } else if (path.includes('/bugs')) {
            entityType = 'bug';
            if (method === 'POST') action = 'created_resource';
            else if (method === 'PUT') action = 'updated_resource';
            else if (method === 'DELETE') action = 'deleted_resource';
            else action = 'accessed_bugs';
          } else if (path.includes('/runs')) {
            entityType = 'test_run';
            if (method === 'POST') action = 'created_resource';
            else if (method === 'DELETE') action = 'deleted_resource';
            else action = 'accessed_runs';
          } else if (path.includes('/testers')) {
            entityType = 'tester';
            if (method === 'POST') action = 'created_resource';
            else if (method === 'PUT') action = 'updated_resource';
            else if (method === 'DELETE') action = 'deleted_resource';
            else action = 'accessed_testers';
          } else if (path.includes('/settings')) action = 'accessed_settings';
          else if (path.includes('/auth/me')) action = 'accessed_profile';
          else if (method === 'GET') action = 'accessed_resource';
          else action = `${method.toLowerCase()}_request`;

          // Determine status
          let status = 'success';
          try {
            const responseData = JSON.parse(data);
            if (responseData.error) status = 'failure';
          } catch {
            if (res.statusCode >= 400) status = 'failure';
          }

          // Get IP address
          const ipAddress =
            req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || 'unknown';

          // Log to database
          await db('audit_logs').insert({
            id: uuid(),
            user_id: req.user.id,
            action,
            entity_type: entityType,
            entity_id: entityId,
            ip_address: ipAddress,
            user_agent: req.headers['user-agent'],
            status,
            created_at: new Date(),
          });
        }
      } catch (err) {
        console.error('Error logging activity:', err);
      }
    });

    originalSend.call(this, data);
  };

  next();
};

module.exports = { logActivity };
