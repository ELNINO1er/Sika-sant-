const db = require('../config/db');

async function getByPatientUserId(patientUserId) {
  const [rows] = await db.query(
    'SELECT * FROM vaccinations WHERE patient_user_id = ? ORDER BY administered_at DESC',
    [patientUserId]
  );
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM vaccinations WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ patientUserId, vaccineName, dose, administeredAt, nextDoseAt, location, professionalName, lotNumber, notes }) {
  const [result] = await db.query(
    `INSERT INTO vaccinations (patient_user_id, vaccine_name, dose, administered_at, next_dose_at, location, professional_name, lot_number, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [patientUserId, vaccineName, dose || null, administeredAt, nextDoseAt || null, location || null, professionalName || null, lotNumber || null, notes || null]
  );
  return { id: result.insertId, patientUserId, vaccineName, dose, administeredAt };
}

async function getUpcoming(patientUserId) {
  const [rows] = await db.query(
    'SELECT * FROM vaccinations WHERE patient_user_id = ? AND next_dose_at IS NOT NULL AND next_dose_at >= CURDATE() ORDER BY next_dose_at ASC',
    [patientUserId]
  );
  return rows;
}

module.exports = { getByPatientUserId, findById, create, getUpcoming };
