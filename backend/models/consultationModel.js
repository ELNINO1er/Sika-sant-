const db = require('../config/db');

async function getConsultationsByPatientUserId(patientUserId, { limit = 20 } = {}) {
  const [rows] = await db.query(
    `SELECT c.id, c.patient_user_id AS patientUserId, c.professional_user_id AS professionalUserId,
            c.title, c.summary, c.created_at,
            u.name AS professionalName
     FROM consultations c
     LEFT JOIN users u ON u.id = c.professional_user_id
     WHERE c.patient_user_id = ?
     ORDER BY c.created_at DESC
     LIMIT ?`,
    [patientUserId, limit]
  );
  return rows;
}

async function getConsultationByIdForPatient(patientUserId, consultationId) {
  const [rows] = await db.query(
    `SELECT c.id, c.patient_user_id AS patientUserId, c.professional_user_id AS professionalUserId,
            c.title, c.summary, c.created_at,
            u.name AS professionalName
     FROM consultations c
     LEFT JOIN users u ON u.id = c.professional_user_id
     WHERE c.patient_user_id = ? AND c.id = ?
     LIMIT 1`,
    [patientUserId, consultationId]
  );
  return rows[0] || null;
}

async function createConsultation({ patientUserId, professionalUserId, title, summary }) {
  const [result] = await db.query(
    `INSERT INTO consultations (patient_user_id, professional_user_id, title, summary)
     VALUES (?, ?, ?, ?)`,
    [patientUserId, professionalUserId, title, summary]
  );
  return {
    id: result.insertId,
    patientUserId,
    professionalUserId,
    title,
    summary
  };
}

module.exports = {
  getConsultationsByPatientUserId,
  getConsultationByIdForPatient,
  createConsultation
};
