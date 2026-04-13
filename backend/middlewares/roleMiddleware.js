const AppError = require('../utils/appError');

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError('Accès refusé', 403));
    }
    next();
  };
}

function authorizePermissions(...requiredPermissions) {
  return (req, res, next) => {
    const permissions = req.user?.permissions || [];
    const hasPermission = requiredPermissions.every(permission => permissions.includes(permission));
    if (!hasPermission) {
      return next(new AppError('Permission refusée', 403));
    }
    next();
  };
}

module.exports = {
  authorizeRoles,
  authorizePermissions
};
