const db = require('../config/db');

async function saveRefreshToken(userId, token, expiresAt) {
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
}

async function findRefreshToken(token) {
  const [rows] = await db.query(
    'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at >= NOW()',
    [token]
  );
  return rows[0] || null;
}

async function revokeRefreshToken(token) {
  await db.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
}

module.exports = {
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken
};
