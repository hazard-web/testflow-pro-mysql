-- ────────────────────────────────────────────
-- Security Features - Database Migrations
-- ────────────────────────────────────────────

-- 1. Refresh Tokens Table (Token Rotation)
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL UNIQUE,
  `is_revoked` BOOLEAN DEFAULT FALSE,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_user_id (`user_id`),
  INDEX idx_expires_at (`expires_at`)
);

-- 2. Failed Login Attempts (Account Lockout)
CREATE TABLE IF NOT EXISTS `failed_login_attempts` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36),
  `email` VARCHAR(255) NOT NULL,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `attempted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX idx_email (`email`),
  INDEX idx_attempted_at (`attempted_at`)
);

-- 3. Account Lockout Status
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_locked` BOOLEAN DEFAULT FALSE;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `locked_until` DATETIME;

-- 4. Audit Logs (All Actions)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36),
  `action` VARCHAR(255) NOT NULL,
  `entity_type` VARCHAR(100),
  `entity_id` CHAR(36),
  `changes` JSON,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `status` ENUM('success', 'failure') DEFAULT 'success',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX idx_user_id (`user_id`),
  INDEX idx_action (`action`),
  INDEX idx_created_at (`created_at`)
);

-- 5. Password Reset Tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_user_id (`user_id`),
  INDEX idx_expires_at (`expires_at`)
);

-- 6. 2FA Settings
CREATE TABLE IF NOT EXISTS `two_fa_settings` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL UNIQUE,
  `is_enabled` BOOLEAN DEFAULT FALSE,
  `secret_key` VARCHAR(255),
  `backup_codes` JSON,
  `verified_at` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_user_id (`user_id`)
);

-- 7. 2FA Verification History
CREATE TABLE IF NOT EXISTS `two_fa_attempts` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `code_type` ENUM('totp', 'backup_code') DEFAULT 'totp',
  `is_verified` BOOLEAN DEFAULT FALSE,
  `ip_address` VARCHAR(45),
  `attempted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_user_id (`user_id`),
  INDEX idx_attempted_at (`attempted_at`)
);
