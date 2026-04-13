const db = require('../config/db');

async function findUserByEmail(email) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findUserByPhone(phone) {
  const [rows] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
  return rows[0] || null;
}

async function updateUserRefreshToken(userId, refreshTokenHash) {
  await db.query('UPDATE users SET refresh_token_hash = ? WHERE id = ?', [refreshTokenHash, userId]);
}

async function saveNewUser(user) {
  const { name, role, email, phone, passwordHash } = user;
  const [result] = await db.query(
    'INSERT INTO users (name, role, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
    [name, role, email || null, phone || null, passwordHash || null]
  );
  return result.insertId;
}

async function getAllUsers() {
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.role, u.email, u.phone, p.cmu_number AS cmuNumber, pr.specialty, pr.license, i.institution_id AS institutionId, i.type AS institutionType
     FROM users u
     LEFT JOIN patients p ON p.user_id = u.id
     LEFT JOIN professionals pr ON pr.user_id = u.id
     LEFT JOIN institutions i ON i.user_id = u.id
     ORDER BY u.created_at DESC`
  );
  return rows;
}

module.exports = {
  findUserByEmail,
  findUserById,
  findUserByPhone,
  updateUserRefreshToken,
  saveNewUser,
  getAllUsers
};
