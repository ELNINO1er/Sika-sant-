const Joi = require('joi');

const requestOtpSchema = {
  body: Joi.object({
    cmuNumber: Joi.string().trim().pattern(/^[0-9]{10}$/).required()
  }).required()
};

const verifyOtpSchema = {
  body: Joi.object({
    otpRequestId: Joi.number().integer().required(),
    otpCode: Joi.string().trim().pattern(/^[0-9]{6}$/).required()
  }).required()
};

const loginSchema = {
  body: Joi.object({
    loginType: Joi.string().valid('professional', 'admin', 'institution').required(),
    email: Joi.when('loginType', {
      is: Joi.valid('professional', 'admin'),
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
};

const verifyMfaSchema = {
  body: Joi.object({
    mfaRequestId: Joi.number().integer().required(),
    mfaCode: Joi.string().trim().pattern(/^[0-9]{6}$/).required()
  }).required()
};

const resendMfaSchema = {
  body: Joi.object({
    mfaRequestId: Joi.number().integer().required()
  }).required()
};

const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required()
  }).required()
};

const logoutSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required()
  }).required()
};

module.exports = {
  requestOtpSchema,
  verifyOtpSchema,
  loginSchema,
  verifyMfaSchema,
  resendMfaSchema,
  refreshTokenSchema,
  logoutSchema
};
