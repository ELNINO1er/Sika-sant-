const db = require('../config/db');

async function saveRefreshToken(userId, tokenHash, expiresAt, metadata = {}) {
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_ip)
     VALUES (?, ?, ?, ?)`,
    [userId, tokenHash, expiresAt, metadata.ip || null]
  );
}

async function findRefreshToken(tokenHash) {
  const [rows] = await db.query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = ?
       AND expires_at >= NOW()
       AND revoked_at IS NULL`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function revokeRefreshToken(tokenHash, metadata = {}) {
  await db.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW(), revoked_ip = ?, replaced_by_hash = COALESCE(?, replaced_by_hash)
     WHERE token_hash = ?`,
    [metadata.ip || null, metadata.replacedByHash || null, tokenHash]
  );
}

module.exports = {
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken
};
