# TestFlow Pro - Access Logs Dashboard Guide

## Overview

The Access Logs Dashboard provides comprehensive monitoring of all user activities and security events in your TestFlow Pro instance. Track user logins/logouts, API access attempts, and resource modifications with detailed information including timestamps, IP addresses, and user agent details.

## Features

### 1. **Complete Activity Logging**

- ✅ User login/logout events with real IP addresses
- ✅ All API endpoint accesses
- ✅ Resource creation, modification, deletion
- ✅ Failed login attempts with account lockout tracking
- ✅ 2FA (Two-Factor Authentication) events
- ✅ User management events

### 2. **Dashboard Views**

#### Summary Cards

Display at-a-glance statistics:

- **Total Logs**: Count of all recorded events
- **Total Users**: Number of active users
- **Admins**: Count of admin-level accounts

#### Logs Table

Detailed table showing:
| Column | Details |
|--------|---------|
| **Timestamp** | Date and time of event (local timezone) |
| **User** | User name with avatar color |
| **Email** | User email address |
| **Role** | User role (admin, developer, tester, qa_engineer) |
| **Action** | Event type (user_logged_in, user_logged_out, created_resource, etc.) |
| **IP Address** | Source IP address (localhost shows as ::1) |
| **Status** | Success ✓ or Failure ✗ |
| **Details** | Click to view full log details |

### 3. **Filtering & Search**

#### Quick Filters

- 🔑 **Logins Button**: Instantly filter to show only user login events
- 🚪 **Logouts Button**: Instantly filter to show only user logout events
- **Clear**: Reset all filters and show all logs

#### Advanced Filters

- **Action Filter**: Select from dropdown of all event types:
  - user_logged_in
  - user_logged_out
  - user_registered
  - created_resource
  - updated_resource
  - deleted_resource
  - accessed_resource
  - and more...

- **Status Filter**: Show only successful or failed events
- **Search**: Full-text search across user names, emails, actions, and IP addresses
- **Date Range**: Filter by start and end dates

### 4. **Detailed Log Modal**

Click any "View" button to open a comprehensive log details modal:

```
📋 LOG DETAILS
─────────────────────────────────
Timestamp:    2024-01-15 10:30:45 AM
User:         Admin User (admin@testflow.dev)
Role:         admin
Action:       user_logged_in
Entity Type:  user
Entity ID:    439e0ad4-9c52-4d2b-917e-1a75ddc6ac58
IP Address:   192.168.1.100
User Agent:   Mozilla/5.0 (Macintosh; Intel Mac OS X...)
Status:       ✓ Success
Log ID:       550e8400-e29b-41d4-a716-446655440000
─────────────────────────────────
```

## Technical Details

### IP Address Tracking

**How it works:**

1. When a user makes any request, the Express server captures their IP address via `req.ip`
2. IP is stored in the `audit_logs` table
3. Server is configured with `trust proxy` for correct IP extraction when behind reverse proxies

**IP Sources (in order of priority):**

1. X-Forwarded-For header (when behind proxy)
2. X-Real-IP header (alternative proxy header)
3. Connection socket address (direct connection)

**Examples:**

- Local development: `::1` (IPv6 localhost)
- Local development: `127.0.0.1` (IPv4 localhost)
- Production: Real client IP address

### User Agent Tracking

Captures browser and client information:

- Browser type and version
- Operating system
- Device type

Example:

```
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36
```

### Login/Logout Events

#### Login Event (`user_logged_in`)

```javascript
// Recorded at: backend/src/routes/auth.routes.js (line ~248)
await createAuditLog(db, {
  userId: user.id,
  action: 'user_logged_in',
  entityType: 'user',
  entityId: user.id,
  ipAddress: req.ip, // Real IP captured
  userAgent: req.get('user-agent'),
});
```

**When triggered:**

- User successfully authenticates with email/password
- 2FA verification completed (if enabled)
- Refresh token issued and stored

#### Logout Event (`user_logged_out`)

```javascript
// Recorded at: backend/src/routes/auth.routes.js (line ~364)
await createAuditLog(db, {
  userId: req.user.id,
  action: 'user_logged_out',
  entityType: 'user',
  entityId: req.user.id,
  ipAddress: req.ip, // Real IP captured
  userAgent: req.get('user-agent'),
});
```

**When triggered:**

- User clicks logout button
- Refresh token revoked
- Session data cleared

## Database Schema

### audit_logs Table

```sql
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(50),           -- e.g., 'user_logged_in'
  entity_type VARCHAR(50),      -- e.g., 'user', 'bug', 'testcase'
  entity_id VARCHAR(36),        -- ID of affected resource
  ip_address VARCHAR(45),       -- IPv4 or IPv6 address
  user_agent TEXT,             -- Browser/client info
  status VARCHAR(20),          -- 'success' or 'failure'
  created_at TIMESTAMP,        -- UTC timestamp
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Query Examples

```sql
-- Get all login events for a user
SELECT * FROM audit_logs
WHERE action = 'user_logged_in'
AND user_id = 'user-uuid'
ORDER BY created_at DESC;

-- Get all events from a specific IP
SELECT user_id, action, created_at
FROM audit_logs
WHERE ip_address = '192.168.1.100'
ORDER BY created_at DESC;

-- Get failed login attempts
SELECT user_id, ip_address, created_at
FROM audit_logs
WHERE action = 'user_logged_in'
AND status = 'failure'
ORDER BY created_at DESC;

-- Get login/logout pairs for audit trail
SELECT action, created_at, user_id, ip_address
FROM audit_logs
WHERE action IN ('user_logged_in', 'user_logged_out')
ORDER BY user_id, created_at DESC;
```

## API Endpoints

### GET /api/audit-logs (Admin Only)

Fetch audit logs with filtering and pagination.

**Parameters:**

- `limit` (default: 50) - Results per page
- `offset` (default: 0) - Starting position
- `action` - Filter by event type
- `userId` - Filter by user
- `status` - Filter by success/failure
- `search` - Search by name, email, action, or IP
- `startDate` - Start of date range
- `endDate` - End of date range

**Example Request:**

```bash
GET /api/audit-logs?action=user_logged_in&limit=100&offset=0
Authorization: Bearer <access_token>
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "439e0ad4-9c52-4d2b-917e-1a75ddc6ac58",
      "user_name": "Admin User",
      "user_email": "admin@testflow.dev",
      "user_role": "admin",
      "initials": "AU",
      "avatar_color": "blue",
      "action": "user_logged_in",
      "entity_type": "user",
      "entity_id": "439e0ad4-9c52-4d2b-917e-1a75ddc6ac58",
      "ip_address": "::1",
      "user_agent": "Mozilla/5.0...",
      "status": "success",
      "created_at": "2024-01-15T10:30:45.000Z"
    }
  ],
  "pagination": {
    "total": 1243,
    "limit": 50,
    "offset": 0
  },
  "summary": {
    "total_admins": { "count": 1 },
    "total_users": { "count": 5 }
  }
}
```

## Security Considerations

### Access Control

- ✅ Only **admin** users can view the logs dashboard
- ✅ Regular users can view their own activity via `/api/audit-logs/my-activity`
- ✅ All audit log endpoints require authentication

### Data Sensitivity

- ⚠️ IP addresses reveal user location information
- ⚠️ User agents can identify devices and browsers
- ⚠️ Login/logout patterns reveal user behavior

**Recommendations:**

- Limit access to logs dashboard to authorized admins only
- Regularly review logs for suspicious patterns
- Monitor failed login attempts (potential brute force attacks)
- Check for unusual IP addresses or user agents
- Implement log retention policies (e.g., delete logs older than 90 days)

## Deployment Notes

### Production IP Address Handling

The server is configured to work behind proxies:

```javascript
// In server.js
app.set('trust proxy', process.env.TRUST_PROXY || 1);
```

**Trust Proxy Values:**

- `1` (default): Trust only 1 proxy (most common)
- `true`: Trust all proxies
- IP address: Trust specific IP only
- Array: Trust specific IPs

**Environment Variable:**

```bash
# In .env
TRUST_PROXY=1
```

### Nginx Reverse Proxy Example

```nginx
server {
    listen 80;
    server_name api.testflow.dev;

    location / {
        proxy_pass http://backend:5000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Issue: All IPs showing as `::1` or `127.0.0.1`

**Cause:** Running in development or server not configured correctly for production.

**Solution:**

1. Check if running behind proxy
2. Verify `trust proxy` setting in server.js
3. Check proxy headers (X-Forwarded-For, X-Real-IP)

### Issue: No login/logout events showing

**Cause:** Events may be filtered out by action filter.

**Solution:**

1. Click "Clear" to remove all filters
2. Use "🔑 Logins" quick filter button
3. Check if user actually logged in/out
4. Verify user is admin (only admins can see all logs)

### Issue: Dashboard shows "No Logs Found"

**Possible Causes:**

- No logs have been recorded yet (first load)
- Filters are too restrictive
- User account is not admin

**Solution:**

1. Perform a login/logout to generate events
2. Click "Clear" button to reset filters
3. Verify user role is "admin"
4. Check database: `SELECT COUNT(*) FROM audit_logs;`

## Performance Tips

### For Large Log Volumes

1. **Pagination**: Default 50 logs per page
2. **Date Filtering**: Filter by date range to reduce results
3. **Search**: Use specific keywords rather than broad searches
4. **Index Database**: Ensure database has indexes on:
   - `action`
   - `user_id`
   - `ip_address`
   - `created_at`

```sql
CREATE INDEX idx_action ON audit_logs(action);
CREATE INDEX idx_user ON audit_logs(user_id);
CREATE INDEX idx_ip ON audit_logs(ip_address);
CREATE INDEX idx_created ON audit_logs(created_at);
```

5. **Archive Old Logs**: Consider moving logs older than X days to archive table

```sql
-- Archive logs older than 90 days
INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

DELETE FROM audit_logs
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

## API Activity Logging

All API requests are automatically logged via the `logActivity` middleware:

```javascript
// middleware/logger.js
app.use('/api/', logActivity);
```

**Logged Information:**

- HTTP method
- Endpoint path
- Response status
- Response time
- User ID (if authenticated)
- IP address
- User agent

This provides a complete audit trail of all API usage.

## Future Enhancements

Potential improvements to consider:

1. **Export Functionality**
   - CSV export of logs
   - PDF reports
   - JSON download

2. **Advanced Filtering**
   - Time range selection (last 24 hours, week, month)
   - Multiple action selection
   - IP range filtering

3. **Analytics**
   - Login trends chart
   - Failed login attempts chart
   - Most active users
   - IP address statistics

4. **Alerts**
   - Alert on suspicious activities
   - Multiple failed logins from same IP
   - Unusual access patterns

5. **Integration**
   - Slack notifications
   - Email reports
   - Webhook integrations

## Support & Documentation

For more information:

- API Documentation: See API endpoints section above
- Database Schema: Check `database/init.sql`
- Backend Routes: `backend/src/routes/audit.routes.js`
- Frontend Component: `frontend/src/pages/Logs.jsx`
- Styles: `frontend/src/styles/logs.css`

---

**Last Updated:** January 2024
**Version:** 1.0
