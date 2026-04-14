const logger = require('../config/logger');
const AppError = require('../utils/appError');
const adminService = require('../services/adminService');

async function listUsers(req, res, next) {
  try {
    const users = await adminService.getAllUsers(req.validated.query);
    return res.formatResponse(users, 'Liste des utilisateurs chargée');
  } catch (error) {
    logger.error('listUsers error: %o', error);
    return next(new AppError('Impossible de récupérer les utilisateurs', 500));
  }
}

async function listAuditLogs(req, res, next) {
  try {
    const logs = await adminService.getAuditLogs(req.validated.query);
    return res.formatResponse(logs, 'Audit logs chargés');
  } catch (error) {
    logger.error('listAuditLogs error: %o', error);
    return next(new AppError('Impossible de récupérer les journaux d’audit', 500));
  }
}

module.exports = {
  listUsers,
  listAuditLogs
};
