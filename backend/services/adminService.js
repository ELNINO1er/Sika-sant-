const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');

async function getAllUsers() {
  return userModel.getAllUsers();
}

async function getAuditLogs() {
  return auditLogModel.getAllAuditLogs();
}

module.exports = {
  getAllUsers,
  getAuditLogs
};
