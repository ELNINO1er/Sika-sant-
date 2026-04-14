const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');

async function getAllUsers(options) {
  return userModel.getAllUsers(options);
}

async function getAuditLogs(options) {
  return auditLogModel.getAllAuditLogs(options);
}

module.exports = {
  getAllUsers,
  getAuditLogs
};
