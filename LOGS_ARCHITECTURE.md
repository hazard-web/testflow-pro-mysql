# Logs Dashboard Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TESTFLOW PRO - LOGGING SYSTEM                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React/Vite)                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐         │
│  │              LogsDashboard Component (Logs.jsx)                 │         │
│  │                                                                 │         │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │         │
│  │  │  Filter Section  │  │ Summary Cards    │  │  Logs Table │  │         │
│  │  ├──────────────────┤  ├──────────────────┤  ├─────────────┤  │         │
│  │  │• Search Box      │  │• Total Logs      │  │ Timestamp   │  │         │
│  │  │• Action Select   │  │• Total Users     │  │ User Info   │  │         │
│  │  │• Status Filter   │  │• Total Admins    │  │ Email       │  │         │
│  │  │• Date Range      │  │• Statistics      │  │ Role Badge  │  │         │
│  │  │• Apply/Clear Btn │  │                  │  │ Action Type │  │         │
│  │  └──────────────────┘  └──────────────────┘  │ IP Address  │  │         │
│  │                                              │ Status      │  │         │
│  │  ┌───────────────────────────────────────────┤ Details Btn │  │         │
│  │  │         Pagination Controls               └─────────────┘  │         │
│  │  │  [← Previous]  Page X of Y  [Next →]                       │         │
│  │  └───────────────────────────────────────────────────────────┘  │         │
│  │                                                                 │         │
│  └─────────────────────────────────────────────────────────────────┘         │
│                                 ▲                                            │
│                                 │ HTTP/REST                                  │
│                                 │                                            │
│                    api.js (interceptor + refresh)                            │
│                                 │                                            │
│                                 ▼                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js/Express)                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────┐          │
│  │                    API Routes Layer                            │          │
│  │                                                                │          │
│  │  /api/audit-logs              (GET - Admin only)              │          │
│  │    ├─ Accepts: limit, offset, action, status, search, dates   │          │
│  │    ├─ Returns: logs[], pagination, summary stats              │          │
│  │    └─ Uses: User joins, advanced filtering, pagination        │          │
│  │                                                                │          │
│  └─────────────────────────────────────────────────────────────────┘         │
│                                 ▲                                            │
│                                 │                                            │
│  ┌────────────────────────────────────────────────────────────────┐          │
│  │              Middleware Layer (Auto-logging)                  │          │
│  │                                                                │          │
│  │  logActivity() Middleware                                      │          │
│  │    ├─ Intercepts all /api/* requests                          │          │
│  │    ├─ Extracts: method, path, user, IP, user-agent           │          │
│  │    ├─ Determines: action type, entity type, status            │          │
│  │    └─ Inserts to audit_logs table automatically              │          │
│  │                                                                │          │
│  │  Actions logged:                                               │          │
│  │    • login, logout, password_reset                            │          │
│  │    • two_fa_enabled, two_fa_disabled                          │          │
│  │    • created_resource, updated_resource, deleted_resource     │          │
│  │    • accessed_* (test_cases, bugs, testers, etc.)             │          │
│  │                                                                │          │
│  └────────────────────────────────────────────────────────────────┘         │
│                                 ▲                                            │
│                                 │                                            │
│  ┌────────────────────────────────────────────────────────────────┐          │
│  │            Database Layer (Knex.js)                           │          │
│  │                                                                │          │
│  │  Queries with:                                                │          │
│  │    ├─ LEFT JOIN users table for user details                 │          │
│  │    ├─ WHERE filters (action, status, date range, search)      │          │
│  │    ├─ LIKE search in names, emails, IPs                       │          │
│  │    └─ ORDER BY created_at DESC (paginated)                    │          │
│  │                                                                │          │
│  └────────────────────────────────────────────────────────────────┘         │
│                                 ▲                                            │
│                                 │ SQL Queries                                │
│                                 │                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL 8.0)                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────┐       ┌──────────────────────────┐             │
│  │     audit_logs Table     │       │     users Table          │             │
│  ├──────────────────────────┤       ├──────────────────────────┤             │
│  │ id (PK)                  │       │ id (PK)                  │             │
│  │ user_id (FK) ────────────┼───────┤ name                     │             │
│  │ action (INDEX)           │       │ email                    │             │
│  │ entity_type              │       │ role                     │             │
│  │ entity_id                │       │ avatar_color             │             │
│  │ changes (JSON)           │       │ initials                 │             │
│  │ ip_address               │       │ is_active                │             │
│  │ user_agent               │       │ created_at               │             │
│  │ status (success/failure)  │       │ updated_at               │             │
│  │ created_at (INDEX)       │       └──────────────────────────┘             │
│  │                          │                                                │
│  │ Indexes:                 │       Total Records: ~2-5K per month           │
│  │ • PRIMARY (id)           │       Storage: ~50-100 MB (1 year)             │
│  │ • user_id (JOIN speed)   │       Performance: <100ms queries              │
│  │ • action (filtering)     │                                                │
│  │ • created_at (sorting)   │                                                │
│  │                          │                                                │
│  │ Total Records: Millions  │                                                │
│  │ (grows continuously)     │                                                │
│  │                          │                                                │
│  └──────────────────────────┘                                                │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│   User       │ (Admin only)
│   Action     │
└──────┬───────┘
       │ (Browser request)
       ▼
┌──────────────────────────┐
│  Frontend                │
│  - LogsDashboard.jsx     │
│  - Filter values         │
│  - Build query params    │
└──────┬───────────────────┘
       │ GET /api/audit-logs?action=login&status=success&search=john
       ▼
┌──────────────────────────────────────────────────────────┐
│  Backend API Route                                       │
│  /audit-logs (GET)                                       │
│  - Verify admin role                                    │
│  - Extract query parameters                            │
│  - Build Knex query with filters                       │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Database Query                                          │
│  SELECT audit_logs.*, users.name, users.email, ...      │
│  FROM audit_logs                                         │
│  LEFT JOIN users ON audit_logs.user_id = users.id       │
│  WHERE action = 'login' AND status = 'success' AND ...   │
│  ORDER BY created_at DESC                               │
│  LIMIT 50 OFFSET 0                                       │
└──────┬──────────────────────────────────────────────────┘
       │ 50 log records + pagination info + summary
       ▼
┌──────────────────────────────────────────────────────────┐
│  Backend Response                                        │
│  {                                                       │
│    data: [                                               │
│      {                                                   │
│        id, user_id, user_name, user_email, user_role,   │
│        avatar_color, initials, action, ip_address,      │
│        user_agent, status, created_at, ...              │
│      },                                                  │
│      ...                                                 │
│    ],                                                    │
│    pagination: { total: 5234, limit: 50, offset: 0 },   │
│    summary: { total_logs, total_users, total_admins }    │
│  }                                                       │
└──────┬──────────────────────────────────────────────────┘
       │ HTTP 200 + JSON response
       ▼
┌──────────────────────────────────────────────────────────┐
│  Frontend Component                                      │
│  - Parse response data                                   │
│  - Update logs state                                     │
│  - Update pagination info                               │
│  - Render table with data                               │
│  - Display summary cards                                │
└──────┬──────────────────────────────────────────────────┘
       │ React re-render
       ▼
┌──────────────────────────────────────────────────────────┐
│  User sees                                               │
│  - Table of activity logs                               │
│  - Summary statistics                                   │
│  - Active filters displayed                             │
│  - Pagination controls                                  │
└──────────────────────────────────────────────────────────┘
```

## Activity Auto-Logging Flow

```
┌──────────────────────┐
│ User Action          │
│ (API Request)        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ Express Middleware Stack                     │
│                                              │
│ 1. body-parser                              │
│ 2. helmet, cors, compression                │
│ 3. morgan (HTTP logging)                    │
│ 4. [logActivity middleware] ◄─ WE ADDED    │
│ 5. Routes                                   │
└──────┬───────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ logActivity() Middleware                     │
│                                              │
│ ✓ Check if user authenticated               │
│ ✓ Extract: method, path, user, IP           │
│ ✓ Determine action type from path           │
│ ✓ Override res.send() to capture response   │
│ ✓ After response sent:                      │
│   - Extract status/error from response      │
│   - Insert audit_logs record               │
│   - Include: user_id, action, IP, status    │
└──────┬───────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ Database INSERT                              │
│                                              │
│ INSERT INTO audit_logs                       │
│ (id, user_id, action, ip_address,           │
│  user_agent, status, created_at)            │
│ VALUES (uuid, userId, actionType,           │
│         '192.168.1.1', userAgent,           │
│         'success'/'failure', NOW())          │
└──────┬───────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ ✓ Log stored in audit_logs table            │
│ ✓ Visible in LogsDashboard                  │
│ ✓ Queryable by filters                      │
│ ✓ Permanent audit trail created             │
└──────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.jsx
├─ Routes
│  └─ /logs
│     └─ PrivateRoute (redirects to /login if not authenticated)
│        └─ LogsDashboard (Logs.jsx)
│           ├─ Header Section
│           │  ├─ Title & Description
│           │  └─ Summary Cards (3 cards)
│           │     ├─ Total Logs
│           │     ├─ Total Users
│           │     └─ Total Admins
│           │
│           ├─ Filter Section
│           │  ├─ Filter Row 1
│           │  │  ├─ Search Input
│           │  │  ├─ Action Dropdown
│           │  │  └─ Status Dropdown
│           │  │
│           │  ├─ Filter Row 2
│           │  │  ├─ Start Date Input
│           │  │  ├─ End Date Input
│           │  │  ├─ Apply Filters Button
│           │  │  └─ Clear Filters Button
│           │  │
│           │  └─ Error Message (if any)
│           │
│           └─ Logs Table Section
│              ├─ Loading State (spinner)
│              │  OR
│              ├─ Logs Table
│              │  ├─ Table Header (8 columns)
│              │  └─ Table Body (50 rows per page)
│              │
│              └─ Pagination Controls
│                 ├─ Previous Button
│                 ├─ Page Info
│                 └─ Next Button
│
└─ Layout
   ├─ Sidebar
   │  └─ Nav Links
   │     └─ Admin Section (shows only for admins)
   │        └─ Access Logs (links to /logs)
   │
   └─ Main Content Area
      └─ Outlet (renders LogsDashboard)
```

## State Management

```
LogsDashboard Component State:

┌─────────────────────────────────────────┐
│ logs: []                                 │
│ (Array of log records with user data)   │
└─────────────────────────────────────────┘
         ▲
         │ Updated from API response
         │

┌─────────────────────────────────────────┐
│ filters: {                               │
│   action: '',                           │
│   status: '',                           │
│   search: '',                           │
│   startDate: '',                        │
│   endDate: ''                           │
│ }                                       │
│ (User filter selections)                 │
└─────────────────────────────────────────┘
         ▲
         │ Updated on input change
         │

┌─────────────────────────────────────────┐
│ pagination: {                            │
│   limit: 50,                            │
│   offset: 0,                            │
│   total: 0,                             │
│   currentPage: 1                        │
│ }                                       │
│ (Pagination info from API)              │
└─────────────────────────────────────────┘
         ▲
         │ Updated on page change
         │

┌─────────────────────────────────────────┐
│ summary: {}                              │
│ (Stats: total_logs, total_users, etc)   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ loading: boolean                        │
│ (Shows spinner during fetch)            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ error: string                           │
│ (Error message if fetch fails)          │
└─────────────────────────────────────────┘
```

## Security Model

```
┌──────────────────────────────────────────────┐
│ Request Flow with Authentication             │
└──────────────────────────────────────────────┘

1. USER REQUEST
   ├─ Has JWT token in Authorization header
   ├─ Token generated from login
   └─ Token expires in 15 minutes (refreshable)

2. MIDDLEWARE AUTHENTICATION
   ├─ Extract token from "Bearer <token>"
   ├─ Verify signature with JWT_SECRET
   ├─ Check token not expired
   ├─ Load user from database
   ├─ Verify user is active
   └─ Attach user object to request

3. ROUTE AUTHENTICATION
   ├─ Check if user exists (from middleware)
   ├─ For /api/audit-logs (Admin endpoint):
   │  ├─ Verify req.user.role === 'admin'
   │  └─ Return 403 if not admin
   └─ For /api/audit-logs/my-activity:
      └─ Filter logs to user's own logs only

4. DATABASE QUERIES
   ├─ No sensitive data in logs
   ├─ Passwords never logged
   ├─ 2FA secrets never logged
   ├─ Tokens never logged
   └─ Only user ID and action logged

5. RESPONSE
   ├─ User data joined from users table
   ├─ No passwords or secrets included
   ├─ IP and user agent for fraud detection
   └─ Status shows success/failure only

┌──────────────────────────────────────────────┐
│ Role-Based Access Control (RBAC)             │
└──────────────────────────────────────────────┘

ADMIN Role:
✓ Can view all audit logs
✓ Can use all filters
✓ Can access LogsDashboard at /logs
✓ Sees all users' activities

QA Engineer:
✗ Cannot view LogsDashboard
✓ Can view own activity via /api/audit-logs/my-activity
✓ Can see own access history only

Tester / Developer / Other:
✗ Cannot view LogsDashboard
✓ Can view own activity only
✓ Can see own access history only

┌──────────────────────────────────────────────┐
│ Data Protection                              │
└──────────────────────────────────────────────┘

PROTECTED:
- Passwords (bcrypt hashed, never in logs)
- 2FA secrets (speakeasy, never in logs)
- Refresh tokens (hashed, never in logs)
- JWT access tokens (signed, never in full logs)

LOGGED:
- User ID (for audit trail)
- Action type (for activity tracking)
- IP address (for security/fraud detection)
- User agent (for device tracking)
- Timestamp (for correlation)
- Status (success/failure)

ENCRYPTED IN TRANSIT:
- HTTPS/TLS required in production
- All API requests encrypted
- Headers include security headers (Helmet)

IMMUTABLE:
- Audit logs cannot be edited after creation
- No update or delete operations on old logs
- Permanent record of all activities
```
