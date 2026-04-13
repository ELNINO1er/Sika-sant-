const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login', authController.login);
router.post('/verify-mfa', authController.verifyMfa);
router.post('/resend-mfa', authController.resendMfa);
router.post('/refresh', authController.refreshToken);

module.exports = router;
