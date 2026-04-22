const db = require('../config/db');

async function create({ userId, requestType, subject, message }) {
  const [result] = await db.query(
    `INSERT INTO support_requests (user_id, request_type, subject, message)
     VALUES (?, ?, ?, ?)`,
    [userId, requestType, subject, message]
  );
  return { id: result.insertId, userId, requestType, subject, status: 'OUVERT' };
}

async function getByUserId(userId) {
  const [rows] = await db.query(
    'SELECT * FROM support_requests WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

module.exports = { create, getByUserId };
