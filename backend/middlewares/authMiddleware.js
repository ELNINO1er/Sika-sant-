const logger = require('../config/logger');
const AppError = require('../utils/appError');
const { verifyAccessToken } = require('../config/jwt');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token manquant', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('JWT error: %o', error);
    return next(new AppError('Token invalide ou expiré', 401));
  }
}

module.exports = {
  verifyToken
};
