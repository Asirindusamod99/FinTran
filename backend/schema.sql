-- ════════════════════════════════════════════════════════════════
-- FinTran - AWS RDS MySQL Schema (Fixed)
-- ════════════════════════════════════════════════════════════════

USE fintran;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ─── USERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         VARCHAR(50)   NOT NULL                    COLLATE utf8mb4_general_ci,
  name       VARCHAR(100)  NOT NULL                    COLLATE utf8mb4_general_ci,
  email      VARCHAR(150)  NOT NULL UNIQUE             COLLATE utf8mb4_general_ci,
  password   VARCHAR(255)  NOT NULL                    COLLATE utf8mb4_general_ci,
  avatar     VARCHAR(10)   DEFAULT ''                  COLLATE utf8mb4_general_ci,
  currency   VARCHAR(10)   DEFAULT 'LKR'               COLLATE utf8mb4_general_ci,
  createdAt  VARCHAR(50)   NOT NULL                    COLLATE utf8mb4_general_ci,
  blocked    TINYINT(1)    DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── PASSWORD RESETS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  email      VARCHAR(150)  NOT NULL                    COLLATE utf8mb4_general_ci,
  otp        VARCHAR(10)   NOT NULL                    COLLATE utf8mb4_general_ci,
  expiresAt  BIGINT        NOT NULL,
  PRIMARY KEY (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── TRANSACTIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id           VARCHAR(50)    NOT NULL  COLLATE utf8mb4_general_ci,
  userId       VARCHAR(50)    NOT NULL  COLLATE utf8mb4_general_ci,
  type         VARCHAR(20)    NOT NULL  COLLATE utf8mb4_general_ci,
  amount       DECIMAL(15,2)  NOT NULL,
  categoryId   VARCHAR(50)    DEFAULT '' COLLATE utf8mb4_general_ci,
  description  VARCHAR(255)   DEFAULT '' COLLATE utf8mb4_general_ci,
  date         VARCHAR(30)    NOT NULL  COLLATE utf8mb4_general_ci,
  createdAt    VARCHAR(50)    NOT NULL  COLLATE utf8mb4_general_ci,
  PRIMARY KEY (id),
  KEY idx_userId (userId),
  CONSTRAINT fk_txn_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── BUDGETS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id          INT            NOT NULL AUTO_INCREMENT,
  userId      VARCHAR(50)    NOT NULL  COLLATE utf8mb4_general_ci,
  categoryId  VARCHAR(50)    NOT NULL  COLLATE utf8mb4_general_ci,
  `limit`     DECIMAL(15,2)  NOT NULL,
  period      VARCHAR(20)    DEFAULT 'monthly' COLLATE utf8mb4_general_ci,
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_category (userId, categoryId),
  CONSTRAINT fk_budget_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── SAVINGS GOALS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_goals (
  id         VARCHAR(50)    NOT NULL  COLLATE utf8mb4_general_ci,
  userId     VARCHAR(50)    NOT NULL  COLLATE utf8mb4_general_ci,
  name       VARCHAR(150)   NOT NULL  COLLATE utf8mb4_general_ci,
  target     DECIMAL(15,2)  NOT NULL,
  current    DECIMAL(15,2)  DEFAULT 0,
  deadline   VARCHAR(30)    DEFAULT NULL COLLATE utf8mb4_general_ci,
  icon       VARCHAR(50)    DEFAULT 'fa-piggy-bank' COLLATE utf8mb4_general_ci,
  color      VARCHAR(20)    DEFAULT '#6366f1' COLLATE utf8mb4_general_ci,
  createdAt  VARCHAR(50)    NOT NULL  COLLATE utf8mb4_general_ci,
  PRIMARY KEY (id),
  KEY idx_sg_userId (userId),
  CONSTRAINT fk_sg_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── SAVINGS DEPOSITS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_deposits (
  id      VARCHAR(50)    NOT NULL  COLLATE utf8mb4_general_ci,
  goalId  VARCHAR(50)    NOT NULL  COLLATE utf8mb4_general_ci,
  userId  VARCHAR(50)    NOT NULL  COLLATE utf8mb4_general_ci,
  amount  DECIMAL(15,2)  NOT NULL,
  note    VARCHAR(255)   DEFAULT '' COLLATE utf8mb4_general_ci,
  date    VARCHAR(50)    NOT NULL   COLLATE utf8mb4_general_ci,
  PRIMARY KEY (id),
  CONSTRAINT fk_dep_goal FOREIGN KEY (goalId) REFERENCES savings_goals(id) ON DELETE CASCADE,
  CONSTRAINT fk_dep_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ════════════════════════════════════════════════════════════════
-- All tables created! ✅
-- ════════════════════════════════════════════════════════════════
