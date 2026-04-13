const apiBaseUrl = 'http://localhost:4000/api';

async function postJson(path, body) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || 'Erreur de communication avec le serveur');
  }
  return payload;
}

async function requestOtp(cmuNumber) {
  return postJson('/auth/request-otp', { cmuNumber });
}

async function verifyOtp(otpRequestId, otpCode) {
  return postJson('/auth/verify-otp', { otpRequestId, otpCode });
}

async function loginUser(loginType, credentials) {
  return postJson('/auth/login', { loginType, ...credentials });
}

async function verifyMfa(mfaRequestId, mfaCode) {
  return postJson('/auth/verify-mfa', { mfaRequestId, mfaCode });
}

async function resendMfa(mfaRequestId) {
  return postJson('/auth/resend-mfa', { mfaRequestId });
}

async function refreshToken(refreshToken) {
  return postJson('/auth/refresh', { refreshToken });
}

async function fetchProfile(accessToken) {
  const response = await fetch(`${apiBaseUrl}/user/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || 'Impossible de récupérer le profil');
  }
  return payload;
}
