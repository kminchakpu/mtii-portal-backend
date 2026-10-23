CREATE TABLE staff_login_rate_limits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rate_limit_key CHAR(64) NOT NULL,
  failed_attempts INT UNSIGNED NOT NULL DEFAULT 1,
  window_started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  blocked_until DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_login_rate_limits_key (rate_limit_key),
  KEY idx_staff_login_rate_limits_blocked_until (blocked_until),
  KEY idx_staff_login_rate_limits_updated_at (updated_at)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;