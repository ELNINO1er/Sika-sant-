const logger = require('../config/logger');
const AppError = require('../utils/appError');
const userService = require('../services/userService');

async function getProfile(req, res, next) {
  try {
    const profile = await userService.getUserProfile(req.user.id);
    if (!profile) {
      return next(new AppError('Utilisateur introuvable', 404));
    }

    return res.formatResponse(profile, 'Profil utilisateur chargé');
  } catch (error) {
    logger.error('getProfile error: %o', error);
    return next(new AppError('Impossible de récupérer le profil utilisateur', 500));
  }
}

module.exports = {
  getProfile
};
