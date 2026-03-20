# TestFlow Pro 🚀 — Professional QA Testing Platform

> **Enterprise-grade QA Test Management & Bug Tracking Platform with Advanced Security Features**

A comprehensive, production-ready test automation and QA management system built with modern web technologies. Features professional dashboard, bug tracking, test case management, developer team coordination, and AI-powered test generation.

---

## ✨ Key Features

### 🎯 Core Testing Features
- **Bug Tracking**: Create, assign, track bugs with severity levels and status management
- **Test Cases**: Organize and manage test cases with detailed descriptions and attachments
- **Test Runs**: Execute test cases and track results with real-time updates
- **Testers Management**: Manage QA team members and track their performance metrics
- **Reports**: Generate comprehensive testing reports and analytics
- **Developer Integration**: Seamless developer-QA communication via team thread

### 🔒 Security Features
- **Two-Factor Authentication (2FA)**: TOTP-based 2FA with QR code setup
- **Account Lockout**: Automatic account lockout after 5 failed login attempts (15 min)
- **Password Reset**: Secure email-based password reset with 30-min expiration
- **Audit Logging**: Complete audit trail of all user actions
- **JWT Authentication**: 15-minute access tokens + 30-day refresh tokens
- **Session Persistence**: Auto-token refresh across page reloads

### 🎨 UI/UX Features
- **Professional Dark Theme**: Navy blue (#0a0e27) with cyan accents (#0ea5e9)
- **Responsive Design**: Mobile-optimized for tablets and phones
- **Form Caching**: Auto-fill login/signup fields from cached non-sensitive data
- **Real-time Updates**: Live comment system with @ mentions
- **Interactive Dashboard**: Metrics, graphs, and status widgets

### 🤖 AI Integration
- **AI Test Case Generator**: Powered by Ollama for automatic test case generation
- **Smart Suggestions**: Get test ideas and edge cases from AI

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18 + Vite + React Router v7 |
| **Backend** | Node.js + Express 4 |
| **Database** | MySQL 8.0 + Knex.js |
| **Authentication** | JWT + bcryptjs + speakeasy (2FA) |
| **Styling** | CSS3 with CSS Variables |
| **Fonts** | Inter (display) + Fira Code (monospace) |
| **Testing** | Jest + Supertest |
| **Container** | Docker + Docker Compose |
| **AI** | Ollama |

---

## 📊 Project Structure

```
testflow-pro-mysql/
├── 📁 backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── server.js             # Express app entry
│   │   ├── config/
│   │   │   ├── database.js       # MySQL connection + Knex setup
│   │   │   ├── migrate.js        # Database migrations
│   │   │   └── seed.js           # Sample data seeding
│   │   ├── routes/               # API endpoints
│   │   │   ├── auth.routes.js    # Login, signup, 2FA, password reset
│   │   │   ├── bug.routes.js     # Bug CRUD operations
│   │   │   ├── testcase.routes.js # Test case management
│   │   │   ├── comment.routes.js # Commenting system
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT validation
│   │   │   └── errorHandler.js   # Global error handling
│   │   └── utils/
│   │       ├── security.js       # 2FA, password hashing, audit logs
│   │       ├── logger.js         # Request logging
│   │       └── ollama.js         # AI integration
│   ├── tests/
│   │   └── api.test.js          # API endpoint tests
│   └── package.json
│
├── 📁 frontend/                   # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx     # Login with auto-fill
│   │   │   ├── SignupPage.jsx    # Signup with form caching
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── Bugs.jsx          # Bug tracker
│   │   │   ├── TestCases.jsx     # Test case management
│   │   │   ├── Testers.jsx       # QA team management
│   │   │   ├── TestRuns.jsx      # Test execution tracking
│   │   │   ├── DevConnect.jsx    # Developer team thread
│   │   │   ├── Reports.jsx       # Analytics & reports
│   │   │   └── SecuritySettingsPage.jsx # 2FA, password reset
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Main layout wrapper
│   │   │   └── shared.jsx        # Reusable components (CommentThread, etc)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Auth state + auto-refresh
│   │   │   └── ThemeContext.jsx  # Dark/light theme
│   │   ├── hooks/
│   │   │   ├── useData.js        # React Query data fetching
│   │   │   └── useFormCache.js   # Form state persistence
│   │   ├── utils/
│   │   │   └── api.js            # Axios client + interceptors
│   │   └── styles/
│   │       └── globals.css       # Theme variables + responsive styles
│   └── package.json
│
├── 📁 database/                   # Database setup
│   └── init.sql                  # MySQL schema + initial data
│
├── docker-compose.yml            # MySQL + Redis + Backend + Frontend
├── package.json                  # Root dependencies
└── README.md                      # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (16+ minimum)
- **MySQL** 8.0+ OR Docker
- **npm** or **yarn**
- Optional: **Ollama** for AI features

### Setup (Local Development)

**1. Clone Repository**
```bash
git clone https://github.com/yourusername/testflow-pro-mysql.git
cd testflow-pro-mysql
```

**2. Install Dependencies**
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

**3. Setup Environment**
```bash
# Copy environment templates
cp .env.development .env

# Edit .env with your MySQL credentials
nano .env
```

**4. Setup Database**
```bash
cd backend
npm run db:migrate    # Run migrations
npm run db:seed       # Seed sample data
cd ..
```

**5. Start Development Servers**
```bash
# Terminal 1: Backend API
cd backend && npm run dev    # Runs on http://localhost:5000

# Terminal 2: Frontend App
cd frontend && npm run dev   # Runs on http://localhost:3000

# Terminal 3 (Optional): Ollama AI
ollama serve              # For AI test generation
```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/me` - Get current user (requires token)
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/2fa/setup` - Initialize 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA code
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm new password

### Bug Management
- `GET /api/bugs` - List bugs (with filters)
- `POST /api/bugs` - Create bug
- `PATCH /api/bugs/:id` - Update bug
- `DELETE /api/bugs/:id` - Delete bug

### Test Cases
- `GET /api/test-cases` - List test cases
- `POST /api/test-cases` - Create test case
- `GET /api/test-cases/:id` - Get test case details
- `PATCH /api/test-cases/:id` - Update test case

### Comments & Team Thread
- `GET /api/comments` - List comments
- `POST /api/comments` - Post comment with @ mentions
- `DELETE /api/comments/:id` - Delete comment

[See full API docs in `/api.http`]

---

## 🔐 Security Highlights

### Authentication
- JWT tokens with 15-minute expiry
- Refresh tokens valid for 30 days
- Automatic token refresh on page reload
- No session expiration without logout

### Password Security
- Minimum 8 characters, 1 uppercase, 1 number
- bcryptjs hashing (salt rounds: 12)
- Secure password reset via email tokens

### Account Protection
- Account lockout after 5 failed login attempts
- 15-minute lockout period
- Failed login tracking and email notifications

### Two-Factor Authentication
- TOTP (Time-based One-Time Password)
- QR code setup with authenticator apps
- Backup codes for account recovery

### Audit Trail
- Complete logging of all user actions
- IP address and user agent tracking
- Searchable audit logs

---

## 📱 Responsive Design

- **Desktop** (1024px+): Full layout with sidebar
- **Tablet** (900px-1023px): Optimized grid layouts
- **Mobile** (680px-899px): Stack layouts, compact buttons
- **Small Mobile** (<680px): Minimal sidebar, touch-optimized

---

## 🎨 Theming

The app uses CSS variables for easy customization:

```css
/* Dark Theme (Default) */
--bg: #0a0e27           /* Navy background */
--accent: #0ea5e9       /* Cyan accent */
--text: #f5f5f5         /* Light text */
--border: #1e293b       /* Subtle borders */

/* Fonts */
--font-display: "Inter"      /* Headers */
--font-body: "Inter"         /* Body text */
--font-mono: "Fira Code"     /* Code/monospace */
```

---

## 📊 Database Schema

### Core Tables
- `users` - User accounts and profiles
- `bugs` - Bug reports with assignments
- `test_cases` - Test case definitions
- `test_runs` - Execution results
- `comments` - Team discussions
- `testers` - QA team members
- `audit_logs` - Security audit trail

### Security Tables
- `two_fa_settings` - 2FA configurations
- `refresh_tokens` - Active refresh tokens
- `password_reset_tokens` - Password reset links
- `failed_login_attempts` - Login failure tracking

---

## 🧪 Testing

```bash
# Run backend tests
cd backend && npm run test

# Run with coverage
npm run test:coverage

# Run frontend tests
cd frontend && npm run test
```

---

## 📝 Environment Variables

See `.env.development` for example configuration:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=testflow_dev
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your-secret-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000

OLLAMA_API_URL=http://localhost:11434
```

---

## 🚢 Deployment

### Backend Deployment
```bash
# Build
npm run build

# Start production
NODE_ENV=production npm start
```

### Frontend Deployment
```bash
# Build static files
npm run build

# Output in `dist/` ready for hosting
```

### Docker Deployment
```bash
# Build images
docker-compose build

# Deploy
docker-compose up -d
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👨‍💻 Author

**Shivam Bhardwaj**
- GitHub: [@shivambhardwaj](https://github.com/shivambhardwaj)
- Email: shivam@testflow.dev

---

## 🙌 Acknowledgments

- React, Node.js, and Express communities
- MySQL, Knex.js, JWT authentication
- Ollama for AI integration
- All contributors and testers

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API endpoints in `/api.http`

---

**Built with ❤️ for QA Teams Worldwide** 🚀
- MySQL 8.0 running locally
- Redis (optional)

### 1. Create MySQL database
```sql
-- In MySQL Workbench, DBeaver, or mysql CLI:
CREATE DATABASE testflow_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.development .env
# Edit .env — set DB_PASSWORD to your MySQL root/user password
```

### 4. Run migrations + seed
```bash
npm run db:migrate    # creates all 9 tables
npm run db:seed       # inserts sample data
```

### 5. Start dev servers
```bash
npm run dev           # backend :5000 + frontend :3000
```

Open **http://localhost:3000**
- Email: `admin@testflow.dev`
- Password: `Password@123`

---

## Quick Start — Docker (Recommended)

```bash
# Start MySQL 8 + Redis + API + Frontend
docker-compose up -d

# Wait ~15s for MySQL to initialise, then:
docker exec testflow_api npm run db:migrate
docker exec testflow_api npm run db:seed

# Tail logs
docker-compose logs -f backend

# Stop everything
docker-compose down

# Full reset (wipes MySQL data volume)
docker-compose down -v
docker-compose up -d
```

---

## Connecting with MySQL Workbench / DBeaver

| Field    | Value (Docker)   | Value (Local)       |
|----------|------------------|---------------------|
| Host     | 127.0.0.1        | 127.0.0.1           |
| Port     | 3306             | 3306                |
| Database | testflow_dev     | testflow_dev        |
| User     | testflow_user    | root                |
| Password | testflow_pass    | your_root_password  |

---

## Database Schema (MySQL)

```sql
users            — VARCHAR(36) UUID PK, auth table
testers          — QA team members
developers       — Dev team members  
test_cases       — Steps stored as JSON column
bugs             — Linked to test_cases + developers via FK
test_runs        — Sprint test run records
run_test_cases   — Many-to-many junction table
comments         — Threaded, linked to TC/bug/dev thread
notifications    — In-app notification feed
```

**Key MySQL-specific choices:**
- UUIDs generated at application layer (`uuid` npm package) — no `gen_random_uuid()`
- `JSON` column type for `steps` (not `jsonb`) — parsed server-side before returning
- `TINYINT(1)` for booleans — `is_active`, `is_read`, `is_dev_thread`
- `utf8mb4` charset throughout for full Unicode support
- `VARCHAR(36)` primary keys (UUID strings)
- `SET FOREIGN_KEY_CHECKS = 0` used in seed for clean wipes

---

## MySQL Cloud Hosting Options

| Provider        | Free Tier | Notes                              |
|-----------------|-----------|------------------------------------|
| PlanetScale     | ✅ 5GB    | Serverless MySQL, branching        |
| Railway         | ✅ 1GB    | Easy Docker-like deploys           |
| AWS RDS MySQL   | ❌        | Most production-ready              |
| Aiven           | ✅ limited| Managed MySQL                      |
| TiDB Cloud      | ✅ 5GB    | MySQL-compatible distributed DB    |

---

## Environments

| File                | DB Name             | Notes                    |
|---------------------|---------------------|--------------------------|
| `.env.development`  | `testflow_dev`      | Local MySQL, debug logs  |
| `.env.staging`      | `testflow_staging`  | SSL, SendGrid, 24h JWT   |
| `.env.production`   | `testflow_production`| SSL, strict, 8h JWT     |

Switch environment:
```bash
NODE_ENV=staging npm run start
NODE_ENV=production npm run start
```

---

## Running Tests

```bash
npm run test                          # all tests
npm run test:coverage --workspace=backend
```

---

## Build for Production

```bash
npm run build                # builds frontend to frontend/dist/
NODE_ENV=production npm start
```

---

## Default Login Credentials

| Email                  | Password      | Role     |
|------------------------|---------------|----------|
| admin@testflow.dev     | Password@123  | Admin    |
| anil@testflow.dev      | Password@123  | Lead QA  |
| priya@testflow.dev     | Password@123  | QA Eng   |
