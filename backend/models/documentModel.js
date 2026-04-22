const db = require('../config/db');

async function getByPatientUserId(patientUserId, { limit = 50 } = {}) {
  const [rows] = await db.query(
    `SELECT d.*, u.name AS uploadedByName
     FROM documents d
     LEFT JOIN users u ON u.id = d.uploaded_by_user_id
     WHERE d.patient_user_id = ?
     ORDER BY d.created_at DESC
     LIMIT ?`,
    [patientUserId, limit]
  );
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM documents WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ patientUserId, consultationId, title, kind, filePath, fileSize, mimeType, uploadedByUserId }) {
  const [result] = await db.query(
    `INSERT INTO documents (patient_user_id, consultation_id, title, kind, file_path, file_size, mime_type, uploaded_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [patientUserId, consultationId || null, title, kind || 'AUTRE', filePath || null, fileSize || 0, mimeType || 'application/pdf', uploadedByUserId || null]
  );
  return { id: result.insertId, patientUserId, title, kind };
}

async function countByPatientUserId(patientUserId) {
  const [[row]] = await db.query('SELECT COUNT(*) AS total FROM documents WHERE patient_user_id = ?', [patientUserId]);
  return row.total;
}

module.exports = { getByPatientUserId, findById, create, countByPatientUserId };
