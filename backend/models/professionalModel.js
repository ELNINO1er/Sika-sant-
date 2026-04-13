const db = require('../config/db');

async function findProfessionalByEmail(email) {
  const [rows] = await db.query(
    `SELECT u.* FROM users u
     JOIN professionals p ON p.user_id = u.id
     WHERE u.email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function findProfessionalByUserId(userId) {
  const [rows] = await db.query(
    `SELECT * FROM professionals WHERE user_id = ?`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = {
  findProfessionalByEmail,
  findProfessionalByUserId
};
