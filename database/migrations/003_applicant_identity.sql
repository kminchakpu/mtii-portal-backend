CREATE TABLE applicants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_applicants_public_id (public_id),
  UNIQUE KEY uq_applicants_email (email),
  KEY idx_applicants_active (is_active),
  KEY idx_applicants_email_verified_at (email_verified_at)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE TABLE applicant_email_verifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  applicant_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_applicant_email_verifications_token_hash (token_hash),
  KEY idx_applicant_email_verifications_applicant_id (applicant_id),
  KEY idx_applicant_email_verifications_expires_at (expires_at),
  KEY idx_applicant_email_verifications_consumed_at (consumed_at),
  CONSTRAINT fk_applicant_email_verifications_applicant
    FOREIGN KEY (applicant_id)
    REFERENCES applicants(id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;