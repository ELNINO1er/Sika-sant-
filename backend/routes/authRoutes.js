const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequest } = require('../middlewares/validateMiddleware');
const {
  requestOtpSchema,
  verifyOtpSchema,
  loginSchema,
  verifyMfaSchema,
  resendMfaSchema,
  refreshTokenSchema,
  logoutSchema
} = require('../validation/authValidation');

router.post('/request-otp', validateRequest(requestOtpSchema), authController.requestOtp);
router.post('/verify-otp', validateRequest(verifyOtpSchema), authController.verifyOtp);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/verify-mfa', validateRequest(verifyMfaSchema), authController.verifyMfa);
router.post('/resend-mfa', validateRequest(resendMfaSchema), authController.resendMfa);
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refreshToken);
router.post('/logout', validateRequest(logoutSchema), authController.logout);

module.exports = router;
