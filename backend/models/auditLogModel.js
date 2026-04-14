const db = require('../config/db');

async function createAuditLog({ userId, action, ip, metadata }) {
  await db.query(
    'INSERT INTO audit_logs (user_id, action, ip, metadata) VALUES (?, ?, ?, ?)',
    [userId || null, action, ip || null, JSON.stringify(metadata || {})]
  );
}

async function getAllAuditLogs({ page = 1, pageSize = 20 } = {}) {
  const offset = (page - 1) * pageSize;
  const [[meta]] = await db.query('SELECT COUNT(*) AS total FROM audit_logs');
  const [rows] = await db.query(
    `SELECT a.id, a.action, a.ip, a.metadata, a.created_at, u.name AS userName, u.email AS userEmail, u.role AS userRole
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [pageSize, offset]
  );

  return {
    items: rows,
    meta: {
      total: meta.total,
      page,
      pageSize,
      totalPages: Math.ceil(meta.total / pageSize) || 1
    }
  };
}

module.exports = {
  createAuditLog,
  getAllAuditLogs
};
