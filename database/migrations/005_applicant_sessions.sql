CREATE TABLE applicant_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  applicant_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_applicant_sessions_token_hash (token_hash),

  KEY idx_applicant_sessions_applicant_id (applicant_id),
  KEY idx_applicant_sessions_expires_at (expires_at),
  KEY idx_applicant_sessions_revoked_at (revoked_at),

  CONSTRAINT fk_applicant_sessions_applicant
    FOREIGN KEY (applicant_id)
    REFERENCES applicants(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);