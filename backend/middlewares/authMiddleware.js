const logger = require('../config/logger');
const AppError = require('../utils/appError');
const { verifyAccessToken } = require('../config/jwt');
const { getPermissionsByRole } = require('../constants/access');
const { ACCESS_TOKEN_COOKIE } = require('../utils/cookies');

function verifyToken(req, res, next) {
  let token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return next(new AppError('Token manquant', 401));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      ...decoded,
      permissions: decoded.permissions || getPermissionsByRole(decoded.role)
    };
    next();
  } catch (error) {
    logger.error('JWT error: %o', error);
    return next(new AppError('Token invalide ou expiré', 401));
  }
}

module.exports = {
  verifyToken
};
