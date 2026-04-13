const db = require('../config/db');

async function createAuditLog({ userId, action, ip, metadata }) {
  await db.query(
    'INSERT INTO audit_logs (user_id, action, ip, metadata) VALUES (?, ?, ?, ?)',
    [userId || null, action, ip || null, JSON.stringify(metadata || {})]
  );
}

module.exports = {
  createAuditLog
};
