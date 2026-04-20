const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../config/logger');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { ROLES, getPermissionsByRole } = require('../constants/access');
const { hashToken } = require('../utils/security');
const patientModel = require('../models/patientModel');
const institutionModel = require('../models/institutionModel');
const otpModel = require('../models/otpModel');
const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');
const refreshTokenModel = require('../models/refreshTokenModel');

const DEFAULT_OTP_LENGTH = 6;
const OTP_EXPIRATION_MINUTES = 5;
const OTP_SALT_ROUNDS = 8;

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
    name: user.name,
    role: user.role,
    email: user.email || null,
    permissions: getPermissionsByRole(user.role)
  };
}

async function persistRefreshToken(userId, refreshToken, ip, replacedToken = null) {
  const refreshTokenHash = hashToken(refreshToken);
  const replacedByHash = replacedToken ? hashToken(replacedToken) : null;

  if (replacedToken) {
    await refreshTokenModel.revokeRefreshToken(hashToken(replacedToken), {
      ip,
      replacedByHash
    });
  }

  await refreshTokenModel.saveRefreshToken(
    userId,
    refreshTokenHash,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    { ip }
  );
}

async function createOtpForUser(userId, purpose) {
  await otpModel.invalidateExistingOtps(userId, purpose);
  const code = generateNumericCode(DEFAULT_OTP_LENGTH);
  const codeHash = await bcrypt.hash(code, OTP_SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
  const requestId = await otpModel.createOtpCode(userId, codeHash, purpose, expiresAt);

  if (process.env.NODE_ENV !== 'production') {
    logger.info('DEV OTP generated for request %s: %s', requestId, code);
  }

  return { requestId, code };
}

async function requestPatientOtp(cmuNumber, ip) {
  const user = await patientModel.findPatientByCmu(cmuNumber);
  if (!user) {
    logger.warn('Patient OTP request failed for CMU %s from %s', cmuNumber, ip);
    return null;
  }

  const { requestId } = await createOtpForUser(user.id, 'PATIENT_LOGIN');
  await auditLogModel.createAuditLog({
    userId: user.id,
    action: 'REQUEST_PATIENT_OTP',
    ip,
    metadata: { cmuNumber }
  });

  return {
    requestId,
    maskedPhone: maskContact(user.phone || user.email || '******')
  };
}

async function verifyPatientOtp(otpRequestId, otpCode, ip) {
  const otp = await otpModel.findValidOtpById(otpRequestId);
  if (!otp) {
    logger.warn('Invalid patient OTP verification attempt %s from %s', otpRequestId, ip);
    return null;
  }

  const isValidCode = await bcrypt.compare(otpCode, otp.code_hash);
  if (!isValidCode) {
    logger.warn('Invalid patient OTP code for request %s from %s', otpRequestId, ip);
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
  await persistRefreshToken(user.id, refreshToken, ip);

  return {
    success: true,
    accessToken,
    refreshToken,
    permissions: payload.permissions,
    userData: { id: user.id, name: user.name, role: user.role, email: user.email, phone: user.phone }
  };
}

async function loginUser(loginType, credentials, ip) {
  const { email, password, institutionId } = credentials;
  let user;

  if (loginType === 'professional') {
    user = await userModel.findUserByEmailAndRole(email, ROLES.PROFESSIONAL);
  } else if (loginType === 'admin') {
    user = await userModel.findUserByEmailAndRole(email, ROLES.ADMIN);
  } else if (loginType === 'institution') {
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

  const purposeByLoginType = {
    professional: 'PROFESSIONAL_MFA',
    admin: 'ADMIN_MFA',
    institution: 'INSTITUTION_MFA'
  };

  const { requestId } = await createOtpForUser(user.id, purposeByLoginType[loginType]);
  await auditLogModel.createAuditLog({
    userId: user.id,
    action: `${loginType.toUpperCase()}_LOGIN_REQUEST`,
    ip,
    metadata: { loginType, email: user.email || null, institutionId: institutionId || null }
  });

  return {
    success: true,
    mfaRequestId: requestId,
    mfaContact: maskContact(user.phone || user.email || '******'),
    role: user.role,
    permissions: getPermissionsByRole(user.role),
    userData: { id: user.id, name: user.name, role: user.role, email: user.email, phone: user.phone }
  };
}

async function verifyMfaCode(mfaRequestId, mfaCode, ip) {
  const otp = await otpModel.findValidOtpById(mfaRequestId);
  if (!otp) {
    logger.warn('Invalid MFA verification attempt %s from %s', mfaRequestId, ip);
    return null;
  }

  const isValidCode = await bcrypt.compare(mfaCode, otp.code_hash);
  if (!isValidCode) {
    logger.warn('Invalid MFA code for request %s from %s', mfaRequestId, ip);
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
  await persistRefreshToken(user.id, refreshToken, ip);

  return {
    success: true,
    accessToken,
    refreshToken,
    role: user.role,
    permissions: payload.permissions,
    userData: { id: user.id, name: user.name, role: user.role, email: user.email, phone: user.phone }
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
    metadata: { previousRequestId: mfaRequestId, purpose: otp.purpose }
  });

  return {
    requestId,
    maskedContact: maskContact(user.phone || user.email || '******')
  };
}

async function refreshTokens(refreshToken, ip) {
  const refreshTokenHash = hashToken(refreshToken);
  const saved = await refreshTokenModel.findRefreshToken(refreshTokenHash);
  if (!saved) {
    logger.warn('Invalid refresh token used from %s', ip);
    return null;
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await userModel.findUserById(decoded.id);
    if (!user) return null;

    const payload = createTokenPayload(user);
    const accessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);
    await persistRefreshToken(user.id, newRefreshToken, ip, refreshToken);

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
    await refreshTokenModel.revokeRefreshToken(refreshTokenHash, { ip });
    return null;
  }
}

async function logout(refreshToken, ip) {
  await refreshTokenModel.revokeRefreshToken(hashToken(refreshToken), { ip });
  return { success: true };
}

module.exports = {
  requestPatientOtp,
  verifyPatientOtp,
  loginUser,
  verifyMfaCode,
  resendMfaCode,
  refreshTokens,
  logout
};
