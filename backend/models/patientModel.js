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

module.exports = {
  findPatientByCmu,
  findPatientByUserId
};
