const auditLogModel = require('../models/auditLogModel');

async function logAction({ userId, action, ip, metadata }) {
  await auditLogModel.createAuditLog({
    userId: userId || null,
    action,
    ip: ip || null,
    metadata
  });
}

module.exports = {
  logAction
};
