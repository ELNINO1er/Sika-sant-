const db = require('../config/db');

async function getByPatientUserId(patientUserId) {
  const [rows] = await db.query(
    `SELECT p.*, u.name AS professionalName, c.title AS consultationTitle
     FROM prescriptions p
     LEFT JOIN users u ON u.id = p.professional_user_id
     LEFT JOIN consultations c ON c.id = p.consultation_id
     WHERE p.patient_user_id = ?
     ORDER BY p.created_at DESC`,
    [patientUserId]
  );
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM prescriptions WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ patientUserId, consultationId, professionalUserId, label, dosage, duration, status, startedAt, endedAt }) {
  const [result] = await db.query(
    `INSERT INTO prescriptions (patient_user_id, consultation_id, professional_user_id, label, dosage, duration, status, started_at, ended_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [patientUserId, consultationId || null, professionalUserId || null, label, dosage || null, duration || null, status || 'ACTIF', startedAt || null, endedAt || null]
  );
  return { id: result.insertId, patientUserId, label, status: status || 'ACTIF' };
}

async function updateStatus(id, status) {
  await db.query('UPDATE prescriptions SET status = ? WHERE id = ?', [status, id]);
}

async function countActive(patientUserId) {
  const [[row]] = await db.query(
    'SELECT COUNT(*) AS total FROM prescriptions WHERE patient_user_id = ? AND status = ?',
    [patientUserId, 'ACTIF']
  );
  return row.total;
}

module.exports = { getByPatientUserId, findById, create, updateStatus, countActive };
