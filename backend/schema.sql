-- Schema for Sika-Santé backend MySQL database
CREATE DATABASE IF NOT EXISTS sika_sante CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sika_sante;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  role ENUM('PATIENT','PROFESSIONAL','INSTITUTION') NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255),
  refresh_token_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cmu_number VARCHAR(20) NOT NULL UNIQUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS professionals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  specialty VARCHAR(100),
  license VARCHAR(100) UNIQUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS institutions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  institution_id VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code VARCHAR(10) NOT NULL,
  purpose ENUM('PATIENT_LOGIN','PROFESSIONAL_MFA','INSTITUTION_MFA') NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(120) NOT NULL,
  ip VARCHAR(45),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample seed data for development and testing
INSERT INTO users (name, role, email, phone, password_hash)
VALUES
  ('Jean KOUASSI', 'PATIENT', NULL, '0701234567', NULL),
  ('Dr Jean KOUASSI', 'PROFESSIONAL', 'dr.kouassi@chu-abidjan.ci', '0701234567', '$2b$10$hDBPcByca.jbBMyoYdefs.aRIV8Cc1a8YLtt8hLk/uM8/LjRHa2LG'),
  ('CNAM Admin', 'INSTITUTION', 'admin@cnam.ci', '0727000003', '$2b$10$XJdl8JBsKFmDmAiMuRFKQe7EGhLnxDXOP6tLsJDA/CIrMkP1fPzRO');

INSERT INTO patients (user_id, cmu_number)
VALUES (1, '1234567890');

INSERT INTO professionals (user_id, specialty, license)
VALUES (2, 'Cardiologie', 'DOC-1001');

INSERT INTO institutions (user_id, institution_id, type)
VALUES (3, 'GOV-CNAM-3001', 'CNAM');
