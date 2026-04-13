const bcrypt = require('bcrypt');
const crypto = require('crypto');
const logger = require('../config/logger');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const patientModel = require('../models/patientModel');
const professionalModel = require('../models/professionalModel');
const institutionModel = require('../models/institutionModel');
const otpModel = require('../models/otpModel');
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');
const refreshTokenModel = require('../models/refreshTokenModel');

const DEFAULT_OTP_LENGTH = 6;
const OTP_EXPIRATION_MINUTES = 5;

function generateNumericCode(length = DEFAULT_OTP_LENGTH) {
  return crypto.randomInt(0, 10 ** length).toString().padStart(length, '0');
}

function maskContact(contact) {
  if (!contact) return null;
  if (contact.includes('@')) {
    const [name, domain] = contact.split('@');
    return `${name[0]}***@${domain}`;
  }

  if (contact.length <= 6) {
    return `${contact.slice(0, 2)}***${contact.slice(-2)}`;
  }

  return `${contact.slice(0, 2)}****${contact.slice(-2)}`;
}

function createTokenPayload(user) {
  return {
    id: user.id,
    role: user.role,
    email: user.email || null
  };
}

function getPermissionsByRole(role) {
  const permissionsByRole = {
    PATIENT: ['view_my_records', 'request_appointments', 'message_professional'],
    DOCTOR: ['read_patient', 'write_consultation', 'prescribe', 'access_full_history'],
    NURSE: ['read_patient', 'write_vitals', 'access_limited_history'],
    PHARMACIST: ['read_prescription', 'validate_prescription', 'dispense'],
    ER: ['read_patient', 'write_emergency', 'access_emergency_info'],
    ADMIN: ['full_access'],
    INSTITUTION: ['view_anonymized_data', 'generate_reports', 'view_statistics']
  };
  return permissionsByRole[role] || [];
}

async function createOtpForUser(userId, purpose) {
  await otpModel.invalidateExistingOtps(userId, purpose);
  const code = generateNumericCode(DEFAULT_OTP_LENGTH);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
  const requestId = await otpModel.createOtpCode(userId, code, purpose, expiresAt);
  return { requestId, code };
}

async function requestPatientOtp(cmuNumber, ip) {
  const user = await patientModel.findPatientByCmu(cmuNumber);
  if (!user) {
    logger.warn('Patient OTP request failed for CMU %s from %s', cmuNumber, ip);
    return null;
  }

  const { requestId, code } = await createOtpForUser(user.id, 'PATIENT_LOGIN');
  await auditLogModel.createAuditLog({
    userId: user.id,
    action: 'REQUEST_PATIENT_OTP',
    ip,
    metadata: { cmuNumber }
  });

  logger.info('OTP request generated for patient %s', cmuNumber);
  return {
    requestId,
    maskedPhone: maskContact(user.phone || user.email || '******')
  };
}

async function verifyPatientOtp(otpRequestId, otpCode, ip) {
  const otp = await otpModel.findValidOtpById(otpRequestId, otpCode);
  if (!otp) {
    logger.warn('Invalid patient OTP verification attempt %s from %s', otpRequestId, ip);
    return null;
  }

  const user = await userModel.findUserById(otp.user_id);
  if (!user) {
    return null;
  }

  await otpModel.markOtpUsed(otpRequestId);
  await auditLogModel.createAuditLog({ userId: user.id, action: 'VERIFY_PATIENT_OTP', ip });

  const payload = createTokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await refreshTokenModel.saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  return {
    success: true,
    accessToken,
    refreshToken,
    permissions: getPermissionsByRole(user.role),
    userData: { id: user.id, role: user.role, email: user.email, phone: user.phone }
  };
}

async function loginUser(loginType, credentials, ip) {
  const { email, password, institutionId } = credentials;
  let user;

  if (loginType === 'professional') {
    if (!email) return null;
    user = await professionalModel.findProfessionalByEmail(email);
  } else if (loginType === 'institution') {
    if (!institutionId) return null;
    user = await institutionModel.findInstitutionByInstitutionId(institutionId);
  } else {
    return null;
  }

  if (!user || !user.password_hash) {
    logger.warn('Failed login attempt for %s from %s', loginType, ip);
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    logger.warn('Invalid password for %s from %s', loginType, ip);
    return null;
  }

  const purpose = loginType === 'professional' ? 'PROFESSIONAL_MFA' : 'INSTITUTION_MFA';
  const { requestId } = await createOtpForUser(user.id, purpose);

  await auditLogModel.createAuditLog({
    userId: user.id,
    action: loginType === 'professional' ? 'PROFESSIONAL_LOGIN_REQUEST' : 'INSTITUTION_LOGIN_REQUEST',
    ip,
    metadata: { loginType, institutionId, email }
  });

  logger.info('MFA requested for %s from %s', loginType, ip);
  return {
    success: true,
    mfaRequestId: requestId,
    mfaContact: maskContact(user.phone || user.email || '******'),
    role: user.role,
    permissions: getPermissionsByRole(user.role),
    userData: { id: user.id, role: user.role, email: user.email, phone: user.phone }
  };
}

async function verifyMfaCode(mfaRequestId, mfaCode, ip) {
  const otp = await otpModel.findValidOtpById(mfaRequestId, mfaCode);
  if (!otp) {
    logger.warn('Invalid MFA verification attempt %s from %s', mfaRequestId, ip);
    return null;
  }

  const user = await userModel.findUserById(otp.user_id);
  if (!user) {
    return null;
  }

  await otpModel.markOtpUsed(mfaRequestId);
  await auditLogModel.createAuditLog({ userId: user.id, action: 'VERIFY_MFA', ip });

  const payload = createTokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await refreshTokenModel.saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  return {
    success: true,
    accessToken,
    refreshToken,
    role: user.role,
    permissions: getPermissionsByRole(user.role),
    userData: { id: user.id, role: user.role, email: user.email, phone: user.phone }
  };
}

async function resendMfaCode(mfaRequestId, ip) {
  const otp = await otpModel.findOtpById(mfaRequestId);
  if (!otp) {
    logger.warn('Invalid MFA resend attempt %s from %s', mfaRequestId, ip);
    return null;
  }

  const user = await userModel.findUserById(otp.user_id);
  if (!user) {
    return null;
  }

  const { requestId } = await createOtpForUser(user.id, otp.purpose);
  await auditLogModel.createAuditLog({
    userId: user.id,
    action: 'RESEND_MFA',
    ip,
    metadata: { mfaRequestId, purpose: otp.purpose }
  });

  return {
    requestId,
    maskedContact: maskContact(user.phone || user.email || '******')
  };
}

async function refreshTokens(refreshToken, ip) {
  const saved = await refreshTokenModel.findRefreshToken(refreshToken);
  if (!saved) {
    logger.warn('Invalid refresh token used from %s', ip);
    return null;
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await userModel.findUserById(decoded.id);
    if (!user) return null;

    const accessToken = signAccessToken(createTokenPayload(user));
    const newRefreshToken = signRefreshToken(createTokenPayload(user));
    await refreshTokenModel.revokeRefreshToken(refreshToken);
    await refreshTokenModel.saveRefreshToken(user.id, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    await auditLogModel.createAuditLog({
      userId: user.id,
      action: 'REFRESH_TOKEN_ROTATION',
      ip
    });

    return {
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    logger.error('refreshTokens error: %o', error);
    return null;
  }
}

module.exports = {
  requestPatientOtp,
  verifyPatientOtp,
  loginUser,
  verifyMfaCode,
  resendMfaCode,
  refreshTokens
};
