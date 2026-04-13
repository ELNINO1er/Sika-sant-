const db = require('../config/db');

async function findPatientByCmu(cmuNumber) {
  const [rows] = await db.query(
    `SELECT u.* FROM patients p
     JOIN users u ON u.id = p.user_id
     WHERE p.cmu_number = ?`,
    [cmuNumber]
  );
  return rows[0] || null;
}

async function findPatientByUserId(userId) {
  const [rows] = await db.query('SELECT * FROM patients WHERE user_id = ?', [userId]);
  return rows[0] || null;
}

async function getAllPatients() {
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, u.phone, p.cmu_number AS cmuNumber, u.created_at
     FROM patients p
     JOIN users u ON u.id = p.user_id
     ORDER BY u.created_at DESC`
  );
  return rows;
}

async function savePatientRecord(userId, cmuNumber) {
  const [result] = await db.query(
    'INSERT INTO patients (user_id, cmu_number) VALUES (?, ?)',
    [userId, cmuNumber]
  );
  return { id: result.insertId, userId, cmuNumber };
}

module.exports = {
  findPatientByCmu,
  findPatientByUserId,
  getAllPatients,
  savePatientRecord
};
