-- Migration: Patient space tables
-- Adds appointments, documents, messages, user_settings, support_requests

ALTER TABLE users
  ADD COLUMN address VARCHAR(255) DEFAULT NULL AFTER phone,
  ADD COLUMN emergency_contact_name VARCHAR(150) DEFAULT NULL AFTER address,
  ADD COLUMN emergency_contact_phone VARCHAR(50) DEFAULT NULL AFTER emergency_contact_name;

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
