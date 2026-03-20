-- ════════════════════════════════════════════════════════════════
-- FinTran - AWS RDS MySQL Schema
-- Database: fintran
-- Run this script once to initialize all tables
-- ════════════════════════════════════════════════════════════════

USE fintran;

-- ─── USERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         VARCHAR(50)  NOT NULL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  avatar     VARCHAR(10)  DEFAULT '',
  currency   VARCHAR(10)  DEFAULT 'LKR',
  createdAt  VARCHAR(50)  NOT NULL,
  blocked    TINYINT(1)   DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PASSWORD RESETS (OTP) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  email     VARCHAR(150) NOT NULL PRIMARY KEY,
  otp       VARCHAR(10)  NOT NULL,
  expiresAt BIGINT       NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── TRANSACTIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id          VARCHAR(50)    NOT NULL PRIMARY KEY,
  userId      VARCHAR(50)    NOT NULL,
  type        VARCHAR(20)    NOT NULL COMMENT 'income or expense',
  amount      DECIMAL(15,2)  NOT NULL,
  categoryId  VARCHAR(50)    DEFAULT '',
  description VARCHAR(255)   DEFAULT '',
  date        VARCHAR(30)    NOT NULL,
  createdAt   VARCHAR(50)    NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── BUDGETS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id         INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId     VARCHAR(50)   NOT NULL,
  categoryId VARCHAR(50)   NOT NULL,
  `limit`    DECIMAL(15,2) NOT NULL,
  period     VARCHAR(20)   DEFAULT 'monthly',
  UNIQUE KEY unique_user_category (userId, categoryId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── SAVINGS GOALS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_goals (
  id        VARCHAR(50)    NOT NULL PRIMARY KEY,
  userId    VARCHAR(50)    NOT NULL,
  name      VARCHAR(150)   NOT NULL,
  target    DECIMAL(15,2)  NOT NULL,
  current   DECIMAL(15,2)  DEFAULT 0,
  deadline  VARCHAR(30)    DEFAULT NULL,
  icon      VARCHAR(50)    DEFAULT 'fa-piggy-bank',
  color     VARCHAR(20)    DEFAULT '#6366f1',
  createdAt VARCHAR(50)    NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── SAVINGS DEPOSITS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_deposits (
  id      VARCHAR(50)    NOT NULL PRIMARY KEY,
  goalId  VARCHAR(50)    NOT NULL,
  userId  VARCHAR(50)    NOT NULL,
  amount  DECIMAL(15,2)  NOT NULL,
  note    VARCHAR(255)   DEFAULT '',
  date    VARCHAR(50)    NOT NULL,
  FOREIGN KEY (goalId) REFERENCES savings_goals(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id)          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ════════════════════════════════════════════════════════════════
-- Tables created successfully! ✅
-- ════════════════════════════════════════════════════════════════
