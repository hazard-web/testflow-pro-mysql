-- ─────────────────────────────────────────────
--  TestFlow Pro — MySQL Init Script
--  Auto-runs on first docker-compose up
-- ─────────────────────────────────────────────

-- Create extra databases for staging/test
CREATE DATABASE IF NOT EXISTS testflow_staging  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS testflow_test      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant user access to all testflow databases
GRANT ALL PRIVILEGES ON testflow_dev.*      TO 'testflow_user'@'%';
GRANT ALL PRIVILEGES ON testflow_staging.*  TO 'testflow_user'@'%';
GRANT ALL PRIVILEGES ON testflow_test.*     TO 'testflow_user'@'%';

FLUSH PRIVILEGES;
