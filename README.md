# TestFlow Pro 🚀 — MySQL Edition
> Production-grade QA Test Management Platform

---

## Tech Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Frontend  | React 18, Vite, React Query, React Router           |
| Backend   | Node.js, Express 4, Knex (query builder)            |
| Database  | **MySQL 8.0**                                       |
| Cache     | Redis 7                                             |
| Auth      | JWT (access + refresh tokens), bcryptjs             |
| Testing   | Jest + Supertest                                    |
| Container | Docker + Docker Compose                             |

---

## Project Structure

```
testflow-pro/
├── .env.development          ← Dev  — MySQL localhost
├── .env.staging              ← Staging — MySQL RDS / PlanetScale
├── .env.production           ← Prod  — MySQL RDS / PlanetScale
├── docker-compose.yml        ← MySQL 8 + Redis + API + Frontend
├── database/
│   └── init.sql              ← MySQL init (creates staging/test DBs)
├── testflow.code-workspace   ← Open in VS Code
├── backend/
│   └── src/
│       ├── server.js
│       ├── config/
│       │   ├── database.js   ← Knex + mysql2 client
│       │   ├── migrate.js    ← MySQL-compatible migrations
│       │   └── seed.js       ← Seeds with app-level UUIDs
│       ├── middleware/
│       ├── routes/
│       └── utils/
└── frontend/
    └── src/  (React app — identical to PostgreSQL version)
```

---

## Quick Start — Local (No Docker)

### Prerequisites
- Node.js 18+
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
