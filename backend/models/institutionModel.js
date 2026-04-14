const db = require('../config/db');

async function findInstitutionByInstitutionId(institutionId) {
  const [rows] = await db.query(
    `SELECT u.*, i.type AS institution_type, i.institution_id
     FROM institutions i
     JOIN users u ON u.id = i.user_id
     WHERE i.institution_id = ?`,
    [institutionId]
  );
  return rows[0] || null;
}

async function findInstitutionByUserId(userId) {
  const [rows] = await db.query(
    `SELECT institution_id, type AS institution_type, user_id
     FROM institutions
     WHERE user_id = ?`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = {
  findInstitutionByInstitutionId,
  findInstitutionByUserId
};
