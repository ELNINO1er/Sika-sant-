import { apiPost } from './api';

export function requestOtp(cmuNumber) {
  return apiPost('/auth/request-otp', { cmuNumber });
}

export function verifyOtp(otpRequestId, otpCode) {
  return apiPost('/auth/verify-otp', { otpRequestId, otpCode });
}

export function loginProfessional(email, password) {
  return apiPost('/auth/login', { loginType: 'professional', email, password });
}

export function loginAdmin(email, password) {
  return apiPost('/auth/login', { loginType: 'admin', email, password });
}

export function loginInstitution(institutionId, password) {
  return apiPost('/auth/login', { loginType: 'institution', institutionId, password });
}

export function verifyMfa(mfaRequestId, mfaCode) {
  return apiPost('/auth/verify-mfa', { mfaRequestId, mfaCode });
}

export function resendMfa(mfaRequestId) {
  return apiPost('/auth/resend-mfa', { mfaRequestId });
}

export function refreshSession(refreshToken) {
  return apiPost('/auth/refresh', { refreshToken });
}

export function logoutSession(refreshToken) {
  return apiPost('/auth/logout', { refreshToken });
}
