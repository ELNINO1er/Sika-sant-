const logger = require('../config/logger');
const AppError = require('../utils/appError');
const authService = require('../services/authService');
const { setAuthCookies, clearAuthCookies, REFRESH_TOKEN_COOKIE } = require('../utils/cookies');

async function requestOtp(req, res, next) {
  try {
    const { cmuNumber } = req.validated.body;
    const otpResult = await authService.requestPatientOtp(cmuNumber, req.ip);
    if (!otpResult) {
      return next(new AppError('Patient introuvable. Inscription requise.', 404));
    }

    return res.formatResponse(
      { otpRequestId: otpResult.requestId, phoneNumber: otpResult.maskedPhone },
      'Code OTP généré'
    );
  } catch (error) {
    logger.error('requestOtp error: %o', error);
    return next(new AppError('Impossible de générer le code OTP', 500));
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { otpRequestId, otpCode } = req.validated.body;
    const tokenResult = await authService.verifyPatientOtp(otpRequestId, otpCode, req.ip);
    if (!tokenResult) {
      return next(new AppError('Code invalide ou expiré', 401));
    }

    setAuthCookies(res, tokenResult.accessToken, tokenResult.refreshToken);
    return res.formatResponse(tokenResult, 'OTP vérifié avec succès');
  } catch (error) {
    logger.error('verifyOtp error: %o', error);
    return next(new AppError('Impossible de vérifier le code OTP', 500));
  }
}

async function login(req, res, next) {
  try {
    const { loginType, email, password, institutionId } = req.validated.body;
    const loginResult = await authService.loginUser(loginType, { email, password, institutionId }, req.ip);
    if (!loginResult) {
      return next(new AppError('Identifiants invalides', 401));
    }

    return res.formatResponse(loginResult, 'Authentification initiale réussie');
  } catch (error) {
    logger.error('login error: %o', error);
    return next(new AppError('Impossible de lancer l’authentification', 500));
  }
}

async function verifyMfa(req, res, next) {
  try {
    const { mfaRequestId, mfaCode } = req.validated.body;
    const tokenResult = await authService.verifyMfaCode(mfaRequestId, mfaCode, req.ip);
    if (!tokenResult) {
      return next(new AppError('Code MFA invalide ou expiré', 401));
    }

    setAuthCookies(res, tokenResult.accessToken, tokenResult.refreshToken);
    return res.formatResponse(tokenResult, 'MFA vérifiée');
  } catch (error) {
    logger.error('verifyMfa error: %o', error);
    return next(new AppError('Impossible de vérifier le code MFA', 500));
  }
}

async function refreshToken(req, res, next) {
  try {
    const token = req.validated?.body?.refreshToken || req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!token) {
      return next(new AppError('Token de rafraîchissement manquant', 401));
    }
    const result = await authService.refreshTokens(token, req.ip);
    if (!result) {
      clearAuthCookies(res);
      return next(new AppError('Token de rafraîchissement invalide', 401));
    }
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return res.formatResponse(result, 'Token rafraîchi');
  } catch (error) {
    logger.error('refreshToken error: %o', error);
    return next(new AppError('Impossible de rafraîchir le token', 500));
  }
}

async function resendMfa(req, res, next) {
  try {
    const { mfaRequestId } = req.validated.body;
    const result = await authService.resendMfaCode(mfaRequestId, req.ip);
    if (!result) {
      return next(new AppError('Requête MFA introuvable ou expirée', 404));
    }

    return res.formatResponse(
      { mfaRequestId: result.requestId, mfaContact: result.maskedContact },
      'Code MFA renvoyé'
    );
  } catch (error) {
    logger.error('resendMfa error: %o', error);
    return next(new AppError('Impossible de renvoyer le code MFA', 500));
  }
}

async function logout(req, res, next) {
  try {
    const token = req.validated?.body?.refreshToken || req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (token) {
      await authService.logout(token, req.ip);
    }
    clearAuthCookies(res);
    return res.formatResponse({ success: true }, 'Session révoquée');
  } catch (error) {
    logger.error('logout error: %o', error);
    return next(new AppError('Impossible de fermer la session', 500));
  }
}

module.exports = {
  requestOtp,
  verifyOtp,
  login,
  verifyMfa,
  refreshToken,
  resendMfa,
  logout
};
