const db = require('../config/db');

async function getByRecipientUserId(recipientUserId, { limit = 30 } = {}) {
  const [rows] = await db.query(
    `SELECT m.*, u.name AS senderName
     FROM messages m
     JOIN users u ON u.id = m.sender_user_id
     WHERE m.recipient_user_id = ?
     ORDER BY m.created_at DESC
     LIMIT ?`,
    [recipientUserId, limit]
  );
  return rows;
}

async function findById(id) {
  const [rows] = await db.query(
    `SELECT m.*, u.name AS senderName
     FROM messages m
     JOIN users u ON u.id = m.sender_user_id
     WHERE m.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function markAsRead(id) {
  await db.query('UPDATE messages SET is_read = 1 WHERE id = ?', [id]);
}

async function countUnread(recipientUserId) {
  const [[row]] = await db.query(
    'SELECT COUNT(*) AS total FROM messages WHERE recipient_user_id = ? AND is_read = 0',
    [recipientUserId]
  );
  return row.total;
}

async function create({ senderUserId, recipientUserId, subject, body, attachmentDocumentId }) {
  const [result] = await db.query(
    `INSERT INTO messages (sender_user_id, recipient_user_id, subject, body, attachment_document_id)
     VALUES (?, ?, ?, ?, ?)`,
    [senderUserId, recipientUserId, subject, body, attachmentDocumentId || null]
  );
  return { id: result.insertId, senderUserId, recipientUserId, subject };
}

module.exports = { getByRecipientUserId, findById, markAsRead, countUnread, create };
