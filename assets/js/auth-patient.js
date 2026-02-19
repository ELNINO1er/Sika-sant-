/**
 * Authentication Patient - Sika-Sante
 * Principe: un patient peut se connecter uniquement s'il a ete cree par un professionnel.
 */

const TOKEN_KEY = 'sika_access_token';
const ROLE_KEY = 'sika_user_role';
const USER_KEY = 'sika_user_data';
const PROFILE_KEY = 'sika_patient_profile';
const MEDICAL_KEY = 'sika_patient_medical_record';
const SESSION_KEY = 'sika_patient_session_id';
const LOGIN_HISTORY_KEY = 'sika_patient_login_history_v1';
const DEVICES_KEY = 'sika_patient_devices_v1';
const DEVICE_FINGERPRINT_KEY = 'sika_patient_device_fingerprint_v1';
const PATIENT_REGISTRY_KEY = 'sika_patient_registry_v1';

const STATUS = {
  PENDING_ACTIVATION: 'PENDING_ACTIVATION',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED'
};

let appState = {
  otpRequestId: null,
  identifier: null,
  otpAttempts: 0,
  maxAttempts: 5,
  otpExpirationTime: 5 * 60 * 1000,
  otpDeadline: null,
  resendCountdown: 60,
  resendInterval: null,
  otpExpiryInterval: null,
  selectedPatientId: null,
  selectedPatientStatus: null
};

const requestOtpSection = document.getElementById('requestOtpSection');
const otpSection = document.getElementById('otpSection');
const activationSection = document.getElementById('activationSection');
const requestOtpForm = document.getElementById('requestOtpForm');
const verifyOtpForm = document.getElementById('verifyOtpForm');
const identifierInput = document.getElementById('cmuNumber');
const otpInputs = document.querySelectorAll('.otp-input');
const phoneDisplay = document.getElementById('phoneDisplay');
const requestOtpBtn = document.getElementById('requestOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const backToCmuBtn = document.getElementById('backToCmuBtn');
const attemptsInfo = document.getElementById('attemptsInfo');
const otpExpiryInfo = document.getElementById('otpExpiryInfo');
const provisionalBadge = document.getElementById('provisionalBadge');
const creationCenterInfo = document.getElementById('creationCenterInfo');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');

document.addEventListener('DOMContentLoaded', function () {
  if (!requestOtpForm || !verifyOtpForm) return;
  requestOtpForm.addEventListener('submit', handleRequestOtp);
  verifyOtpForm.addEventListener('submit', handleVerifyOtp);
  setupOtpInputs();
  if (backToCmuBtn) backToCmuBtn.addEventListener('click', backToCmu);
  if (resendOtpBtn) resendOtpBtn.addEventListener('click', handleResendOtp);
  renderAttemptsInfo();
  renderOtpExpiryInfo();
});

function safeParse(value, fallback) {
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function readArrayStorage(key) {
  const parsed = safeParse(localStorage.getItem(key) || '[]', []);
  return Array.isArray(parsed) ? parsed : [];
}

function readRegistry() {
  const parsed = safeParse(localStorage.getItem(PATIENT_REGISTRY_KEY) || '[]', []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveRegistry(registry) {
  localStorage.setItem(PATIENT_REGISTRY_KEY, JSON.stringify(registry));
}

function normalizePhone(value) {
  return (value || '').replace(/[^\d]/g, '');
}

function normalizeIdentifier(value) {
  return (value || '').trim();
}

function isLikelyPhone(value) {
  const digits = normalizePhone(value);
  return digits.length >= 8 && digits.length <= 14;
}

function isLikelyCmu(value) {
  return /^\d{10}$/.test(value || '');
}

function isLikelyTemporaryId(value) {
  return /^PROV-[A-Z0-9]{4,16}$/i.test(value || '');
}

function findPatientRecord(identifier) {
  const registry = readRegistry();
  const id = normalizeIdentifier(identifier);
  const upper = id.toUpperCase();
  const phone = normalizePhone(id);
  return registry.find((entry) => {
    const p = entry.profile || {};
    return (
      (p.cmu && p.cmu === id) ||
      (p.temporaryId && p.temporaryId.toUpperCase() === upper) ||
      (p.patientId && p.patientId.toUpperCase() === upper) ||
      (normalizePhone(p.phone) === phone)
    );
  }) || null;
}

async function handleRequestOtp(e) {
  e.preventDefault();
  hideMessages();

  const identifier = normalizeIdentifier(identifierInput.value);
  if (!isLikelyCmu(identifier) && !isLikelyPhone(identifier) && !isLikelyTemporaryId(identifier)) {
    showError('Entrez un numero CMU, un telephone ou un identifiant provisoire valide.');
    return;
  }

  requestOtpBtn.disabled = true;
  requestOtpBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verification...';

  try {
    const response = await simulateRequestOtp(identifier);
    if (!response.success) {
      registerLoginEvent('FAILED_IDENTIFIER', identifier);
      showError(response.message || 'Patient introuvable.');
      return;
    }

    appState.otpRequestId = response.otpRequestId;
    appState.identifier = identifier;
    appState.selectedPatientId = response.patientId;
    appState.selectedPatientStatus = response.patientStatus;
    appState.otpAttempts = 0;
    appState.otpDeadline = Date.now() + appState.otpExpirationTime;

    if (phoneDisplay) phoneDisplay.textContent = maskPhoneNumber(response.phoneNumber);

    // MODE DEV : afficher l'OTP simulé directement dans l'UI
    const devOtpBanner = document.getElementById('devOtpBanner');
    const devOtpCode = document.getElementById('devOtpCode');
    if (devOtpBanner && devOtpCode && response.devOtp) {
      devOtpCode.textContent = response.devOtp;
      devOtpBanner.style.display = 'block';
    }

    if (provisionalBadge) provisionalBadge.style.display = response.isProvisional ? 'inline-flex' : 'none';
    if (creationCenterInfo) {
      creationCenterInfo.textContent = response.createdByCenter ? `Cree au : ${response.createdByCenter}` : '';
      creationCenterInfo.style.display = response.createdByCenter ? 'block' : 'none';
    }

    if (response.patientStatus === STATUS.PENDING_ACTIVATION) {
      showSuccess('Premiere activation detectee. Validez l OTP pour activer le compte.');
    }

    requestOtpSection.style.display = 'none';
    otpSection.style.display = 'block';
    clearOtpInputs();
    verifyOtpBtn.disabled = false;
    renderAttemptsInfo();
    startResendCountdown();
    startOtpExpiryCountdown();
    if (otpInputs[0]) otpInputs[0].focus();
  } catch (error) {
    showError('Erreur reseau. Reessayez.');
  } finally {
    requestOtpBtn.disabled = false;
    requestOtpBtn.innerHTML = '<i class="bi bi-phone me-2"></i>Recevoir un code par SMS';
  }
}

async function handleVerifyOtp(e) {
  e.preventDefault();
  hideMessages();

  if (isOtpExpired()) {
    showError('Le code a expire. Demandez un nouveau code OTP.');
    return;
  }

  const otpCode = Array.from(otpInputs).map((i) => i.value).join('');
  if (otpCode.length !== 6) {
    showError('Veuillez entrer le code complet a 6 chiffres.');
    return;
  }

  if (appState.otpAttempts >= appState.maxAttempts) {
    showError('Trop de tentatives. Renvoyez un OTP.');
    return;
  }

  appState.otpAttempts += 1;
  renderAttemptsInfo();
  verifyOtpBtn.disabled = true;
  verifyOtpBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verification...';

  try {
    const response = await simulateVerifyOtp(appState.otpRequestId, otpCode);
    if (!response.success) {
      registerLoginEvent('FAILED_OTP', appState.identifier);
      clearOtpInputs();
      if (otpInputs[0]) otpInputs[0].focus();
      const remaining = appState.maxAttempts - appState.otpAttempts;
      showError(remaining > 0 ? `Code incorrect. ${remaining} tentative(s) restante(s).` : 'Code incorrect. Limite atteinte.');
      return;
    }

    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(ROLE_KEY, 'PATIENT');
    localStorage.setItem(USER_KEY, JSON.stringify(response.userData));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(response.patientProfile));
    localStorage.setItem(MEDICAL_KEY, JSON.stringify(response.patientMedicalRecord));
    localStorage.setItem(SESSION_KEY, sessionId);

    registerLoginEvent('SUCCESS', response.userData.cmuNumber || response.userData.name);
    registerDeviceSession(sessionId, response.userData.cmuNumber || response.userData.name);

    if (response.firstActivation && activationSection) {
      otpSection.style.display = 'none';
      activationSection.style.display = 'block';
      const nameEl = document.getElementById('activationName');
      const centerEl = document.getElementById('activationCenter');
      if (nameEl) nameEl.textContent = `${response.patientProfile.firstName || ''} ${response.patientProfile.lastName || ''}`.trim();
      if (centerEl) centerEl.textContent = response.patientProfile.createdByCenter || 'Centre de sante';
      setTimeout(() => { window.location.href = 'dashboard-patient.html'; }, 2500);
    } else {
      showSuccess('Connexion reussie. Redirection...');
      setTimeout(() => { window.location.href = 'dashboard-patient.html'; }, 1200);
    }
  } catch (error) {
    console.error('[Auth] Erreur simulateVerifyOtp:', error);
    showError('Erreur de verification. Reessayez.');
  } finally {
    verifyOtpBtn.disabled = false;
    verifyOtpBtn.innerHTML = '<i class="bi bi-shield-check me-2"></i>Verifier le code';
  }
}

async function handleResendOtp() {
  hideMessages();
  resendOtpBtn.disabled = true;
  try {
    const response = await simulateRequestOtp(appState.identifier);
    if (!response.success) {
      showError('Impossible de renvoyer le code.');
      return;
    }
    appState.otpRequestId = response.otpRequestId;
    appState.otpAttempts = 0;
    appState.otpDeadline = Date.now() + appState.otpExpirationTime;
    clearOtpInputs();
    verifyOtpBtn.disabled = false;
    renderAttemptsInfo();
    startResendCountdown();
    startOtpExpiryCountdown();
    // MODE DEV : mettre à jour le code affiché
    const devOtpBanner = document.getElementById('devOtpBanner');
    const devOtpCode = document.getElementById('devOtpCode');
    if (devOtpBanner && devOtpCode && response.devOtp) {
      devOtpCode.textContent = response.devOtp;
      devOtpBanner.style.display = 'block';
    }
    showSuccess('Nouveau code OTP envoye.');
  } catch (_) {
    showError('Erreur de connexion.');
  }
}

function setupOtpInputs() {
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', function (e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value.length === 1 && index < otpInputs.length - 1) otpInputs[index + 1].focus();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) otpInputs[index - 1].focus();
    });
    input.addEventListener('paste', function (e) {
      e.preventDefault();
      const digits = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6).split('');
      digits.forEach((digit, i) => { if (otpInputs[i]) otpInputs[i].value = digit; });
      if (digits.length === 6) otpInputs[5].focus();
    });
  });
}

function backToCmu() {
  otpSection.style.display = 'none';
  requestOtpSection.style.display = 'block';
  clearOtpInputs();
  stopOtpTimers();
  // Masquer le bloc dev OTP
  const devOtpBanner = document.getElementById('devOtpBanner');
  if (devOtpBanner) devOtpBanner.style.display = 'none';
  appState.otpAttempts = 0;
  appState.otpDeadline = null;
  verifyOtpBtn.disabled = false;
  renderAttemptsInfo();
  renderOtpExpiryInfo();
  hideMessages();
}

function startResendCountdown() {
  if (appState.resendInterval) clearInterval(appState.resendInterval);
  appState.resendCountdown = 60;
  resendOtpBtn.disabled = true;
  updateResendTimerLabel();
  appState.resendInterval = setInterval(() => {
    appState.resendCountdown -= 1;
    updateResendTimerLabel();
    if (appState.resendCountdown <= 0) {
      clearInterval(appState.resendInterval);
      appState.resendInterval = null;
      resendOtpBtn.disabled = false;
      updateResendTimerLabel();
    }
  }, 1000);
}

function startOtpExpiryCountdown() {
  if (appState.otpExpiryInterval) clearInterval(appState.otpExpiryInterval);
  renderOtpExpiryInfo();
  appState.otpExpiryInterval = setInterval(() => {
    renderOtpExpiryInfo();
    if (isOtpExpired()) {
      clearInterval(appState.otpExpiryInterval);
      appState.otpExpiryInterval = null;
      verifyOtpBtn.disabled = true;
      showError('Code OTP expire. Cliquez sur Renvoyer.');
    }
  }, 1000);
}

function stopOtpTimers() {
  if (appState.resendInterval) clearInterval(appState.resendInterval);
  if (appState.otpExpiryInterval) clearInterval(appState.otpExpiryInterval);
  appState.resendInterval = null;
  appState.otpExpiryInterval = null;
}

function updateResendTimerLabel() {
  const timer = document.getElementById('resendTimer');
  if (timer) timer.textContent = appState.resendCountdown > 0 ? `(${appState.resendCountdown}s)` : '';
}

function isOtpExpired() {
  return !!appState.otpDeadline && Date.now() > appState.otpDeadline;
}

function clearOtpInputs() {
  otpInputs.forEach((i) => { i.value = ''; });
}

function maskPhoneNumber(phone) {
  const digits = normalizePhone(phone);
  if (digits.length < 8) return '+225 ** ** ** **';
  return `${digits.slice(0, 3)} ** ** ${digits.slice(-2)}`;
}

function renderAttemptsInfo() {
  if (!attemptsInfo) return;
  const remaining = Math.max(0, appState.maxAttempts - appState.otpAttempts);
  attemptsInfo.textContent = `Tentatives restantes: ${remaining}/${appState.maxAttempts}`;
}

function renderOtpExpiryInfo() {
  if (!otpExpiryInfo) return;
  if (!appState.otpDeadline) {
    otpExpiryInfo.textContent = 'Code valide pendant 05:00';
    return;
  }
  const left = Math.max(0, appState.otpDeadline - Date.now());
  const sec = Math.floor(left / 1000);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  otpExpiryInfo.textContent = `Code valide pendant ${mm}:${ss}`;
}

function showError(message) {
  if (errorText) errorText.textContent = message;
  if (errorMessage) errorMessage.style.display = 'block';
  if (successMessage) successMessage.style.display = 'none';
}

function showSuccess(message) {
  if (successText) successText.textContent = message;
  if (successMessage) successMessage.style.display = 'block';
  if (errorMessage) errorMessage.style.display = 'none';
}

function hideMessages() {
  if (errorMessage) errorMessage.style.display = 'none';
  if (successMessage) successMessage.style.display = 'none';
}

function registerLoginEvent(status, identifier) {
  const history = readArrayStorage(LOGIN_HISTORY_KEY);
  history.unshift({
    id: `login-${Date.now()}`,
    at: Date.now(),
    status,
    identifier,
    method: 'CMU/Telephone + OTP',
    device: getDeviceLabel(),
    location: 'Abidjan (mock)'
  });
  localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(history.slice(0, 80)));
}

function registerDeviceSession(sessionId, identifier) {
  const devices = readArrayStorage(DEVICES_KEY);
  const fingerprint = getOrCreateDeviceFingerprint();
  const now = Date.now();
  devices.forEach((d) => { d.isCurrent = false; });
  let current = devices.find((d) => d.fingerprint === fingerprint);
  if (!current) {
    current = { id: sessionId, fingerprint, label: getDeviceLabel(), identifier, firstSeenAt: now, lastSeenAt: now, status: 'active', isCurrent: true };
    devices.unshift(current);
  } else {
    Object.assign(current, { id: sessionId, identifier, lastSeenAt: now, status: 'active', isCurrent: true });
  }
  localStorage.setItem(DEVICES_KEY, JSON.stringify(devices.slice(0, 12)));
}

function getOrCreateDeviceFingerprint() {
  const existing = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
  if (existing) return existing;
  const generated = `fp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(DEVICE_FINGERPRINT_KEY, generated);
  return generated;
}

function getDeviceLabel() {
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'Android Browser';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Safari';
  if (/Windows/i.test(ua)) return 'Windows Browser';
  return 'Navigateur Web';
}

async function simulateRequestOtp(identifier) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const record = findPatientRecord(identifier);
  if (!record) {
    return { success: false, message: 'Ce patient n existe pas encore. Demandez sa creation par un professionnel.' };
  }

  const status = (record.profile && record.profile.accountStatus) || (record.account && record.account.status) || STATUS.PENDING_ACTIVATION;
  if (status === STATUS.SUSPENDED) {
    return { success: false, message: 'Compte suspendu. Contactez votre centre de sante.' };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Utiliser localStorage au lieu de sessionStorage pour compatibilité multi-onglets
  localStorage.setItem('sika_temp_otp', otp);
  localStorage.setItem('sika_temp_otp_time', Date.now().toString());
  localStorage.setItem('sika_temp_patient_id', record.patientId);

  return {
    success: true,
    otpRequestId: `OTP-${Date.now()}`,
    phoneNumber: (record.profile && record.profile.phone) || '',
    patientStatus: status,
    createdByCenter: (record.profile && record.profile.createdByCenter) || '',
    isProvisional: !record.profile.cmu && !!record.profile.temporaryId,
    patientId: record.patientId,
    devOtp: otp  // MODE DEV LOCAL : code visible côté UI
  };
}

async function simulateVerifyOtp(otpRequestId, otpCode) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const storedOtp = localStorage.getItem('sika_temp_otp');
  const storedTime = parseInt(localStorage.getItem('sika_temp_otp_time') || '0', 10);
  const patientId = localStorage.getItem('sika_temp_patient_id');
  if (!storedOtp || !storedTime || !patientId || (Date.now() - storedTime > appState.otpExpirationTime)) {
    return { success: false, message: 'OTP expire.' };
  }
  if (otpCode !== storedOtp) return { success: false, message: 'OTP invalide.' };

  localStorage.removeItem('sika_temp_otp');
  localStorage.removeItem('sika_temp_otp_time');
  localStorage.removeItem('sika_temp_patient_id');

  const registry = readRegistry();
  const idx = registry.findIndex((entry) => entry.patientId === patientId);
  if (idx < 0) return { success: false, message: 'Patient introuvable.' };
  const record = registry[idx];

  let firstActivation = false;
  const status = (record.profile && record.profile.accountStatus) || STATUS.PENDING_ACTIVATION;
  if (status === STATUS.PENDING_ACTIVATION) {
    firstActivation = true;
    record.profile.accountStatus = STATUS.ACTIVE;
    record.profile.activatedAt = new Date().toISOString();
    if (!record.account) record.account = {};
    record.account.status = STATUS.ACTIVE;
    saveRegistry(registry);
  }

  const profile = record.profile || {};
  const medical = record.medical || {};
  return {
    success: true,
    firstActivation,
    accessToken: `jwt_token_${Date.now()}`,
    refreshToken: `refresh_${Date.now()}`,
    userData: {
      role: 'PATIENT',
      cmuNumber: profile.cmu || profile.temporaryId || profile.phone || profile.patientId,
      name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Patient'
    },
    patientProfile: profile,
    patientMedicalRecord: medical
  };
}
