CREATE DATABASE IF NOT EXISTS sika_sante CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sika_sante;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  role ENUM('PATIENT', 'PROFESSIONAL', 'ADMIN', 'INSTITUTION') NOT NULL,
  email VARCHAR(191) UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255),
  address VARCHAR(255) DEFAULT NULL,
  emergency_contact_name VARCHAR(150) DEFAULT NULL,
  emergency_contact_phone VARCHAR(50) DEFAULT NULL,
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
  code_hash VARCHAR(255) NOT NULL,
  purpose ENUM('PATIENT_LOGIN', 'PROFESSIONAL_MFA', 'ADMIN_MFA', 'INSTITUTION_MFA') NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_user_id INT NOT NULL,
  professional_user_id INT NULL,
  title VARCHAR(120) NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (professional_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_user_id INT NOT NULL,
  consultation_id INT NULL,
  professional_user_id INT NULL,
  label VARCHAR(200) NOT NULL,
  dosage VARCHAR(500) DEFAULT NULL,
  duration VARCHAR(100) DEFAULT NULL,
  status ENUM('ACTIF', 'TERMINE', 'ANNULE') DEFAULT 'ACTIF',
  started_at DATE DEFAULT NULL,
  ended_at DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL,
  FOREIGN KEY (professional_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_user_id INT NOT NULL,
  professional_user_id INT NULL,
  title VARCHAR(150) NOT NULL,
  date DATETIME NOT NULL,
  duration_minutes INT DEFAULT 30,
  location VARCHAR(255) DEFAULT 'Centre Sika-Sante, Abidjan',
  status ENUM('PLANIFIE', 'CONFIRME', 'ANNULE', 'REALISE') DEFAULT 'PLANIFIE',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (professional_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_user_id INT NOT NULL,
  consultation_id INT NULL,
  title VARCHAR(200) NOT NULL,
  kind ENUM('ORDONNANCE', 'RESULTAT', 'COMPTE_RENDU', 'IMAGERIE', 'AUTRE') DEFAULT 'AUTRE',
  file_path VARCHAR(500) DEFAULT NULL,
  file_size INT DEFAULT 0,
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  uploaded_by_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_user_id INT NOT NULL,
  recipient_user_id INT NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  attachment_document_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (attachment_document_id) REFERENCES documents(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  notify_appointments TINYINT(1) DEFAULT 1,
  notify_treatments TINYINT(1) DEFAULT 1,
  notify_documents TINYINT(1) DEFAULT 1,
  language VARCHAR(5) DEFAULT 'fr',
  theme VARCHAR(10) DEFAULT 'light',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS support_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('OUVERT', 'EN_COURS', 'FERME') DEFAULT 'OUVERT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vaccinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_user_id INT NOT NULL,
  vaccine_name VARCHAR(200) NOT NULL,
  dose VARCHAR(50) DEFAULT NULL,
  administered_at DATE NOT NULL,
  next_dose_at DATE DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  professional_name VARCHAR(150) DEFAULT NULL,
  lot_number VARCHAR(100) DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_user_id) REFERENCES users(id) ON DELETE CASCADE
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
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_ip VARCHAR(45),
  revoked_ip VARCHAR(45),
  revoked_at DATETIME DEFAULT NULL,
  replaced_by_hash CHAR(64) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed data
INSERT INTO users (name, role, email, phone, password_hash)
VALUES
  ('Jean KOUASSI', 'PATIENT', NULL, '0701234567', '$2b$10$qyoiZTFxk3BWhv14jArlMOOgrkQHIiph0QGlpIvFbc6FF2EePXuE6'),
  ('Dr Jean KOUASSI', 'PROFESSIONAL', 'dr.kouassi@chu-abidjan.ci', '0701234568', '$2b$10$qyoiZTFxk3BWhv14jArlMOOgrkQHIiph0QGlpIvFbc6FF2EePXuE6'),
  ('Sika Admin', 'ADMIN', 'admin@sika-sante.ci', '0701234569', '$2b$10$qyoiZTFxk3BWhv14jArlMOOgrkQHIiph0QGlpIvFbc6FF2EePXuE6'),
  ('CNAM Admin', 'INSTITUTION', 'institution@cnam.ci', '0727000003', '$2b$10$qyoiZTFxk3BWhv14jArlMOOgrkQHIiph0QGlpIvFbc6FF2EePXuE6');

INSERT INTO patients (user_id, cmu_number)
VALUES (1, '1234567890');

INSERT INTO professionals (user_id, specialty, license)
VALUES (2, 'Cardiologie', 'DOC-1001');

INSERT INTO institutions (user_id, institution_id, type)
VALUES (4, 'GOV-CNAM-3001', 'CNAM');

INSERT INTO consultations (patient_user_id, professional_user_id, title, summary)
VALUES
  (1, 2, 'Consultation générale', 'Suivi clinique sans signe de gravité.'),
  (1, 2, 'Contrôle cardiologie', 'Tension stable, traitement maintenu.');

INSERT INTO prescriptions (patient_user_id, consultation_id, professional_user_id, label, dosage, duration, status, started_at)
VALUES
  (1, 1, 2, 'Suivi cardiologique', 'Controle regulier et observance quotidienne', '3 mois', 'ACTIF', CURDATE()),
  (1, 2, 2, 'Traitement antihypertenseur', 'Amlodipine 5mg - 1 comprime par jour', '6 mois', 'ACTIF', CURDATE());
