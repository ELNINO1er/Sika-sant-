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

module.exports = {
  findUserByEmail,
  findUserById,
  findUserByPhone,
  updateUserRefreshToken,
  saveNewUser
};
