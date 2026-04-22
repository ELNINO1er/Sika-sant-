const db = require('../config/db');

async function getByPatientUserId(patientUserId, { limit = 20 } = {}) {
  const [rows] = await db.query(
    `SELECT a.*, u.name AS professionalName
     FROM appointments a
     LEFT JOIN users u ON u.id = a.professional_user_id
     ORDER BY a.date DESC
     LIMIT ?`,
    [patientUserId, limit]
  );
  return rows;
}

async function getUpcoming(patientUserId, { limit = 10 } = {}) {
  const [rows] = await db.query(
    `SELECT a.*, u.name AS professionalName
     FROM appointments a
     LEFT JOIN users u ON u.id = a.professional_user_id
     WHERE a.patient_user_id = ? AND a.date >= NOW() AND a.status != 'ANNULE'
     ORDER BY a.date ASC
     LIMIT ?`,
    [patientUserId, limit]
  );
  return rows;
}

async function getPast(patientUserId, { limit = 20 } = {}) {
  const [rows] = await db.query(
    `SELECT a.*, u.name AS professionalName
     FROM appointments a
     LEFT JOIN users u ON u.id = a.professional_user_id
     WHERE a.patient_user_id = ? AND (a.date < NOW() OR a.status = 'REALISE')
     ORDER BY a.date DESC
     LIMIT ?`,
    [patientUserId, limit]
  );
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM appointments WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ patientUserId, professionalUserId, title, date, durationMinutes, location, notes }) {
  const [result] = await db.query(
    `INSERT INTO appointments (patient_user_id, professional_user_id, title, date, duration_minutes, location, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [patientUserId, professionalUserId || null, title, date, durationMinutes || 30, location || 'Centre Sika-Sante, Abidjan', notes || null]
  );
  return { id: result.insertId, patientUserId, title, date, status: 'PLANIFIE' };
}

async function updateStatus(id, status) {
  await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
}

module.exports = { getByPatientUserId, getUpcoming, getPast, findById, create, updateStatus };
