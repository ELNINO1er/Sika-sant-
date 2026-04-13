const Joi = require('joi');

const requestOtpSchema = Joi.object({
  body: Joi.object({
    cmuNumber: Joi.string().trim().pattern(/^[0-9]{10}$/).required()
  }).required()
});

const verifyOtpSchema = Joi.object({
  body: Joi.object({
    otpRequestId: Joi.number().integer().required(),
    otpCode: Joi.string().trim().length(6).required()
  }).required()
});

const loginSchema = Joi.object({
  body: Joi.object({
    loginType: Joi.string().valid('professional', 'institution').required(),
    email: Joi.when('loginType', {
      is: 'professional',
      then: Joi.string().email().required(),
      otherwise: Joi.forbidden()
    }),
    institutionId: Joi.when('loginType', {
      is: 'institution',
      then: Joi.string().trim().pattern(/^GOV-[A-Z]+-\d{4}$/i).required(),
      otherwise: Joi.forbidden()
    }),
    password: Joi.string().min(12).required()
  }).required()
});

const verifyMfaSchema = Joi.object({
  body: Joi.object({
    mfaRequestId: Joi.number().integer().required(),
    mfaCode: Joi.string().trim().length(6).required()
  }).required()
});

const resendMfaSchema = Joi.object({
  body: Joi.object({
    mfaRequestId: Joi.number().integer().required()
  }).required()
});

const refreshTokenSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required()
  }).required()
});

module.exports = {
  requestOtpSchema,
  verifyOtpSchema,
  loginSchema,
  verifyMfaSchema,
  resendMfaSchema,
  refreshTokenSchema
};
