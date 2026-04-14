const db = require('../config/db');

async function invalidateExistingOtps(userId, purpose) {
  await db.query(
    'UPDATE otp_codes SET used_at = NOW() WHERE user_id = ? AND purpose = ? AND used_at IS NULL',
    [userId, purpose]
  );
}

async function createOtpCode(userId, codeHash, purpose, expiresAt) {
  const [result] = await db.query(
    'INSERT INTO otp_codes (user_id, code_hash, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [userId, codeHash, purpose, expiresAt]
  );
  return result.insertId;
}

async function findValidOtpById(requestId) {
  const [rows] = await db.query(
    `SELECT * FROM otp_codes
     WHERE id = ?
       AND expires_at >= NOW()
       AND used_at IS NULL`,
    [requestId]
  );
  return rows[0] || null;
}

async function findOtpById(requestId) {
  const [rows] = await db.query('SELECT * FROM otp_codes WHERE id = ?', [requestId]);
  return rows[0] || null;
}

async function markOtpUsed(requestId) {
  await db.query('UPDATE otp_codes SET used_at = NOW() WHERE id = ?', [requestId]);
}

module.exports = {
  invalidateExistingOtps,
  createOtpCode,
  findValidOtpById,
  findOtpById,
  markOtpUsed
};
