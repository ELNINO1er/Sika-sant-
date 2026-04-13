const authService = require('../services/authService');

async function requestOtp(req, res) {
  try {
    const { cmuNumber } = req.body;
    if (!cmuNumber) {
      return res.status(400).json({ success: false, message: 'Numéro CMU requis' });
    }

    const otpResult = await authService.requestPatientOtp(cmuNumber);
    if (!otpResult) {
      return res.status(404).json({ success: false, message: 'Patient introuvable. Inscription requise.' });
    }

    res.json({ success: true, otpRequestId: otpResult.requestId, phoneNumber: otpResult.maskedPhone });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Impossible de générer le code OTP' });
  }
}

async function verifyOtp(req, res) {
  try {
    const { otpRequestId, otpCode } = req.body;
    if (!otpRequestId || !otpCode) {
      return res.status(400).json({ success: false, message: 'Requête invalide' });
    }

    const tokenResult = await authService.verifyPatientOtp(otpRequestId, otpCode);
    if (!tokenResult) {
      return res.status(401).json({ success: false, message: 'Code invalide ou expiré' });
    }

    res.json(tokenResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Impossible de vérifier le code OTP' });
  }
}

async function login(req, res) {
  try {
    const { loginType, email, password, institutionId } = req.body;
    if (!loginType || !password) {
      return res.status(400).json({ success: false, message: 'Paramètres de connexion manquants' });
    }

    const loginResult = await authService.loginUser(loginType, { email, password, institutionId });
    if (!loginResult) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    res.json(loginResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Impossible de lancer l’authentification' });
  }
}

async function verifyMfa(req, res) {
  try {
    const { mfaRequestId, mfaCode } = req.body;
    if (!mfaRequestId || !mfaCode) {
      return res.status(400).json({ success: false, message: 'Requête invalide' });
    }

    const tokenResult = await authService.verifyMfaCode(mfaRequestId, mfaCode);
    if (!tokenResult) {
      return res.status(401).json({ success: false, message: 'Code MFA invalide ou expiré' });
    }

    res.json(tokenResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Impossible de vérifier le code MFA' });
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Token de rafraîchissement requis' });
    }

    const result = await authService.refreshTokens(refreshToken);
    if (!result) {
      return res.status(401).json({ success: false, message: 'Token de rafraîchissement invalide' });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Impossible de rafraîchir le token' });
  }
}

async function resendMfa(req, res) {
  try {
    const { mfaRequestId } = req.body;
    if (!mfaRequestId) {
      return res.status(400).json({ success: false, message: 'ID de requête MFA requis' });
    }

    const result = await authService.resendMfaCode(mfaRequestId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Requête MFA introuvable ou expirée' });
    }

    res.json({ success: true, mfaRequestId: result.requestId, mfaContact: result.maskedContact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Impossible de renvoyer le code MFA' });
  }
}

module.exports = {
  requestOtp,
  verifyOtp,
  login,
  verifyMfa,
  refreshToken,
  resendMfa
};
