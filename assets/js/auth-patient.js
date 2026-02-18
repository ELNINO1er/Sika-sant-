/**
 * Authentication Patient - Sika-Santé
 * Connexion via CMU + OTP avec séparation création/activation
 * Architecture : patientProfile | patientMedicalRecord | consentements
 */

// ─── Clés de stockage ───────────────────────────────────────────────────────
const TOKEN_KEY            = 'sika_access_token';
const ROLE_KEY             = 'sika_user_role';
const USER_KEY             = 'sika_user_data';
const PROFILE_KEY          = 'sika_patient_profile';
const MEDICAL_KEY          = 'sika_patient_medical_record';
const SESSION_KEY          = 'sika_patient_session_id';
const LOGIN_HISTORY_KEY    = 'sika_patient_login_history_v1';
const DEVICES_KEY          = 'sika_patient_devices_v1';
const DEVICE_FINGERPRINT_KEY = 'sika_patient_device_fingerprint_v1';

// ─── Statuts patient ─────────────────────────────────────────────────────────
const STATUS = {
  PENDING_ACTIVATION : 'PENDING_ACTIVATION', // Créé en centre, OTP pas encore validé
  ACTIVE             : 'ACTIVE',             // Compte activé par OTP
  SUSPENDED          : 'SUSPENDED'           // Bloqué par admin
};

// ─── État de l'application ───────────────────────────────────────────────────
let appState = {
  otpRequestId      : null,
  cmuNumber         : null,
  isProvisionalId   : false,   // true si ID provisoire (pas de CMU)
  patientStatus     : null,    // STATUS.* selon base mock
  isFirstLogin      : false,   // true si première activation
  otpAttempts       : 0,
  maxAttempts       : 5,
  otpExpirationTime : 5 * 60 * 1000, // 5 min
  otpDeadline       : null,
  resendCountdown   : 60,
  resendInterval    : null,
  otpExpiryInterval : null
};

// ─── Éléments DOM ────────────────────────────────────────────────────────────
const requestOtpSection   = document.getElementById('requestOtpSection');
const otpSection          = document.getElementById('otpSection');
const activationSection   = document.getElementById('activationSection');
const requestOtpForm      = document.getElementById('requestOtpForm');
const verifyOtpForm       = document.getElementById('verifyOtpForm');
const cmuNumberInput      = document.getElementById('cmuNumber');
const otpInputs           = document.querySelectorAll('.otp-input');
const phoneDisplay        = document.getElementById('phoneDisplay');
const requestOtpBtn       = document.getElementById('requestOtpBtn');
const verifyOtpBtn        = document.getElementById('verifyOtpBtn');
const resendOtpBtn        = document.getElementById('resendOtpBtn');
const backToCmuBtn        = document.getElementById('backToCmuBtn');
const attemptsInfo        = document.getElementById('attemptsInfo');
const otpExpiryInfo       = document.getElementById('otpExpiryInfo');
const provisionalBadge    = document.getElementById('provisionalBadge');
const creationCenterInfo  = document.getElementById('creationCenterInfo');
const errorMessage        = document.getElementById('errorMessage');
const errorText           = document.getElementById('errorText');
const successMessage      = document.getElementById('successMessage');
const successText         = document.getElementById('successText');

// ─── Initialisation ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  if (!requestOtpForm || !verifyOtpForm) return;

  requestOtpForm.addEventListener('submit', handleRequestOtp);
  verifyOtpForm.addEventListener('submit', handleVerifyOtp);
  setupOtpInputs();

  if (backToCmuBtn)  backToCmuBtn.addEventListener('click', backToCmu);
  if (resendOtpBtn)  resendOtpBtn.addEventListener('click', handleResendOtp);

  renderAttemptsInfo();
  renderOtpExpiryInfo();

  // Accepter aussi PROV-XXXXXXXXXX (ID provisoire)
  if (cmuNumberInput) {
    cmuNumberInput.addEventListener('input', handleCmuInput);
  }
});

// ─── Gestion input CMU : auto-détection ID provisoire ───────────────────────
function handleCmuInput(e) {
  const val = (e.target.value || '').trim().toUpperCase();
  if (val.startsWith('PROV-')) {
    e.target.value = val;
  }
}

// ─── ÉTAPE 1 : Demande OTP ───────────────────────────────────────────────────
async function handleRequestOtp(e) {
  e.preventDefault();
  hideMessages();

  const rawInput    = (cmuNumberInput.value || '').trim();
  const isCmu       = /^\d{10}$/.test(rawInput);
  const isProvisional = /^PROV-[A-Z0-9]{6,12}$/i.test(rawInput);

  if (!isCmu && !isProvisional) {
    showError('Entrez un numéro CMU (10 chiffres) ou un ID provisoire (PROV-XXXXXX).');
    return;
  }

  appState.isProvisionalId = isProvisional;

  requestOtpBtn.disabled = true;
  requestOtpBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Vérification...';

  try {
    const response = await simulateRequestOtp(rawInput);

    if (!response.success) {
      registerLoginEvent('FAILED_CMU', rawInput);
      showError(response.message || 'Identifiant non trouvé.');
      return;
    }

    appState.otpRequestId   = response.otpRequestId;
    appState.cmuNumber      = rawInput;
    appState.patientStatus  = response.patientStatus;
    appState.isFirstLogin   = response.patientStatus === STATUS.PENDING_ACTIVATION;
    appState.otpAttempts    = 0;
    appState.otpDeadline    = Date.now() + appState.otpExpirationTime;

    // Afficher badge ID provisoire
    if (provisionalBadge) {
      provisionalBadge.style.display = appState.isProvisionalId ? 'inline-flex' : 'none';
    }

    // Afficher centre de création
    if (creationCenterInfo && response.createdByCenter) {
      creationCenterInfo.textContent = `Créé au : ${response.createdByCenter}`;
      creationCenterInfo.style.display = 'block';
    }

    if (phoneDisplay) {
      phoneDisplay.textContent = maskPhoneNumber(response.phoneNumber);
    }

    // Afficher message premier login
    if (appState.isFirstLogin) {
      showSuccess('Première connexion détectée. Validez votre OTP pour activer votre compte.');
    }

    requestOtpSection.style.display = 'none';
    otpSection.style.display        = 'block';

    clearOtpInputs();
    if (verifyOtpBtn) verifyOtpBtn.disabled = false;
    renderAttemptsInfo();
    startResendCountdown();
    startOtpExpiryCountdown();
    if (otpInputs[0]) otpInputs[0].focus();

  } catch (error) {
    showError('Erreur de connexion. Veuillez réessayer.');
  } finally {
    requestOtpBtn.disabled = false;
    requestOtpBtn.innerHTML = '<i class="bi bi-phone me-2"></i>Recevoir un code par SMS';
  }
}

// ─── ÉTAPE 2 : Vérification OTP ──────────────────────────────────────────────
async function handleVerifyOtp(e) {
  e.preventDefault();
  hideMessages();

  if (isOtpExpired()) {
    showError('Le code a expiré. Veuillez demander un nouveau code.');
    return;
  }

  const otpCode = Array.from(otpInputs).map(i => i.value).join('');
  if (otpCode.length !== 6) {
    showError('Veuillez entrer le code complet à 6 chiffres.');
    return;
  }

  if (appState.otpAttempts >= appState.maxAttempts) {
    showError('Trop de tentatives. Demandez un nouveau code OTP.');
    clearOtpInputs();
    return;
  }

  appState.otpAttempts += 1;
  renderAttemptsInfo();

  verifyOtpBtn.disabled = true;
  verifyOtpBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Vérification...';

  try {
    const response = await simulateVerifyOtp(appState.otpRequestId, otpCode);

    if (!response.success) {
      registerLoginEvent('FAILED_OTP', appState.cmuNumber);
      clearOtpInputs();
      if (otpInputs[0]) otpInputs[0].focus();

      const remaining = appState.maxAttempts - appState.otpAttempts;
      showError(remaining <= 0
        ? 'Code incorrect. Limite atteinte, renvoyez un OTP.'
        : `Code incorrect. ${remaining} tentative(s) restante(s).`
      );
      return;
    }

    // ── Stocker tokens + profil + dossier médical ─────────────────────────
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    localStorage.setItem(TOKEN_KEY,   response.accessToken);
    localStorage.setItem(ROLE_KEY,    'PATIENT');
    localStorage.setItem(USER_KEY,    JSON.stringify(response.userData));
    localStorage.setItem(SESSION_KEY, sessionId);

    // Séparation identité / médical
    localStorage.setItem(PROFILE_KEY, JSON.stringify(response.patientProfile));
    localStorage.setItem(MEDICAL_KEY, JSON.stringify(response.patientMedicalRecord));

    registerLoginEvent('SUCCESS', response.userData.cmuNumber || appState.cmuNumber);
    registerDeviceSession(sessionId, response.userData.cmuNumber || appState.cmuNumber);

    stopOtpTimers();

    // ── Première activation → écran de bienvenue ──────────────────────────
    if (appState.isFirstLogin && activationSection) {
      otpSection.style.display        = 'none';
      activationSection.style.display = 'block';

      const centerEl = document.getElementById('activationCenter');
      if (centerEl) {
        centerEl.textContent = response.patientProfile.createdByCenter || 'Centre de santé';
      }

      const nameEl = document.getElementById('activationName');
      if (nameEl) {
        nameEl.textContent = response.patientProfile.firstName + ' ' + response.patientProfile.lastName;
      }

      setTimeout(() => { window.location.href = 'dashboard-patient.html'; }, 3000);
    } else {
      showSuccess('Connexion réussie ! Redirection en cours...');
      setTimeout(() => { window.location.href = 'dashboard-patient.html'; }, 1200);
    }

  } catch (error) {
    registerLoginEvent('FAILED_TECHNICAL', appState.cmuNumber);
    showError('Erreur de vérification. Veuillez réessayer.');
    clearOtpInputs();
  } finally {
    if (verifyOtpBtn) {
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.innerHTML = '<i class="bi bi-shield-check me-2"></i>Vérifier le code';
    }
  }
}

// ─── Renvoi OTP ──────────────────────────────────────────────────────────────
async function handleResendOtp() {
  hideMessages();
  if (resendOtpBtn) resendOtpBtn.disabled = true;

  try {
    const response = await simulateRequestOtp(appState.cmuNumber);
    if (!response.success) {
      showError('Erreur lors du renvoi. Veuillez réessayer.');
      return;
    }

    appState.otpRequestId  = response.otpRequestId;
    appState.otpAttempts   = 0;
    appState.otpDeadline   = Date.now() + appState.otpExpirationTime;
    clearOtpInputs();
    if (verifyOtpBtn) verifyOtpBtn.disabled = false;
    renderAttemptsInfo();
    startResendCountdown();
    startOtpExpiryCountdown();
    showSuccess('Un nouveau code OTP a été envoyé.');
  } catch (error) {
    showError('Erreur de connexion.');
  }
}

// ─── OTP inputs setup ─────────────────────────────────────────────────────────
function setupOtpInputs() {
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', function (e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener('paste', function (e) {
      e.preventDefault();
      const pasted = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '');
      const digits = pasted.split('').slice(0, 6);
      digits.forEach((digit, i) => { if (otpInputs[i]) otpInputs[i].value = digit; });
      if (digits.length === 6) otpInputs[5].focus();
    });
  });
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function backToCmu() {
  if (otpSection)        otpSection.style.display        = 'none';
  if (requestOtpSection) requestOtpSection.style.display = 'block';
  clearOtpInputs();
  hideMessages();
  stopOtpTimers();
  appState.otpAttempts  = 0;
  appState.otpDeadline  = null;
  appState.isFirstLogin = false;
  if (provisionalBadge)   provisionalBadge.style.display   = 'none';
  if (creationCenterInfo) creationCenterInfo.style.display  = 'none';
  if (verifyOtpBtn) verifyOtpBtn.disabled = false;
  renderAttemptsInfo();
  renderOtpExpiryInfo();
}

// ─── Timers ───────────────────────────────────────────────────────────────────
function startResendCountdown() {
  if (appState.resendInterval) clearInterval(appState.resendInterval);
  appState.resendCountdown = 60;
  if (resendOtpBtn) resendOtpBtn.disabled = true;
  updateResendTimerLabel();

  appState.resendInterval = setInterval(() => {
    appState.resendCountdown -= 1;
    updateResendTimerLabel();
    if (appState.resendCountdown <= 0) {
      clearInterval(appState.resendInterval);
      appState.resendInterval = null;
      if (resendOtpBtn) resendOtpBtn.disabled = false;
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
      if (verifyOtpBtn) verifyOtpBtn.disabled = true;
      showError('Le code OTP a expiré. Cliquez sur "Renvoyer".');
    }
  }, 1000);
}

function stopOtpTimers() {
  if (appState.resendInterval)    { clearInterval(appState.resendInterval);    appState.resendInterval    = null; }
  if (appState.otpExpiryInterval) { clearInterval(appState.otpExpiryInterval); appState.otpExpiryInterval = null; }
}

function updateResendTimerLabel() {
  const timer = document.getElementById('resendTimer');
  if (!timer) return;
  timer.textContent = appState.resendCountdown > 0 ? `(${appState.resendCountdown}s)` : '';
}

function isOtpExpired() {
  return !!appState.otpDeadline && Date.now() > appState.otpDeadline;
}

// ─── Utilitaires UI ───────────────────────────────────────────────────────────
function clearOtpInputs() {
  otpInputs.forEach(i => { i.value = ''; });
}

function maskPhoneNumber(phone) {
  const n = (phone || '').replace(/\D/g, '');
  if (n.length < 10) return '+225 ** ** ** **';
  return n.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '+225 $1 ** ** ** $5');
}

function renderAttemptsInfo() {
  if (!attemptsInfo) return;
  const remaining = Math.max(0, appState.maxAttempts - appState.otpAttempts);
  attemptsInfo.textContent = `Tentatives restantes : ${remaining}/${appState.maxAttempts}`;
}

function renderOtpExpiryInfo() {
  if (!otpExpiryInfo) return;
  if (!appState.otpDeadline) { otpExpiryInfo.textContent = 'Code valide pendant 05:00'; return; }
  const remainingMs   = Math.max(0, appState.otpDeadline - Date.now());
  const totalSeconds  = Math.floor(remainingMs / 1000);
  const minutes       = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds       = String(totalSeconds % 60).padStart(2, '0');
  otpExpiryInfo.textContent = `Code valide pendant ${minutes}:${seconds}`;
}

function showError(message)   { if (errorText) errorText.textContent = message; if (errorMessage) errorMessage.style.display = 'block'; if (successMessage) successMessage.style.display = 'none'; }
function showSuccess(message) { if (successText) successText.textContent = message; if (successMessage) successMessage.style.display = 'block'; if (errorMessage) errorMessage.style.display = 'none'; }
function hideMessages()       { if (errorMessage) errorMessage.style.display = 'none'; if (successMessage) successMessage.style.display = 'none'; }

// ─── Audit / Appareils ────────────────────────────────────────────────────────
function readArrayFromStorage(key) {
  try { const p = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(p) ? p : []; }
  catch (_) { return []; }
}

function registerLoginEvent(status, cmuNumber) {
  const history = readArrayFromStorage(LOGIN_HISTORY_KEY);
  history.unshift({
    id        : `login-${Date.now()}`,
    at        : Date.now(),
    status,
    cmuNumber : cmuNumber || 'N/A',
    method    : 'CMU + OTP',
    device    : getDeviceLabel(),
    location  : 'Abidjan (mock)'
  });
  localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(history.slice(0, 80)));
}

function registerDeviceSession(sessionId, cmuNumber) {
  const devices     = readArrayFromStorage(DEVICES_KEY);
  const fingerprint = getOrCreateDeviceFingerprint();
  const now         = Date.now();
  let currentDevice = devices.find(d => d.fingerprint === fingerprint);
  devices.forEach(d => { d.isCurrent = false; });

  if (!currentDevice) {
    currentDevice = { id: sessionId, fingerprint, label: getDeviceLabel(), cmuNumber, firstSeenAt: now, lastSeenAt: now, status: 'active', isCurrent: true };
    devices.unshift(currentDevice);
  } else {
    Object.assign(currentDevice, { id: sessionId, cmuNumber, lastSeenAt: now, status: 'active', isCurrent: true });
  }

  if (devices.length === 1) {
    devices.push({ id: `sess-mock-${now - 86400000}`, fingerprint: 'mock-other-device', label: 'iPhone Safari (mock)', cmuNumber, firstSeenAt: now - 86400000 * 14, lastSeenAt: now - 86400000, status: 'active', isCurrent: false });
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
  if (/Android/i.test(ua))         return 'Android WebView';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Safari';
  if (/Windows/i.test(ua))          return 'Windows Browser';
  if (/Macintosh/i.test(ua))        return 'Mac Browser';
  return 'Navigateur Web';
}

// ─── BASE DE DONNÉES MOCKÉE ───────────────────────────────────────────────────
/**
 * Structure complète : patientProfile | patientMedicalRecord | consentements
 * Statuts : PENDING_ACTIVATION (jamais connecté) → ACTIVE (OTP validé)
 */
const MOCK_PATIENTS = {

  // ── Patient 1 : Compte ACTIF ──────────────────────────────────────────────
  '1234567890': {
    status     : STATUS.ACTIVE,
    phone      : '0701234567',
    patientProfile: {
      patientId         : 'PAT-001',
      cmu               : '1234567890',
      temporaryId       : null,
      firstName         : 'Jean',
      lastName          : 'KOUASSI',
      dateOfBirth       : '1985-01-15',
      gender            : 'M',
      phone             : '0701234567',
      photo             : null,
      address           : 'Cocody, Abidjan',
      createdByCenter   : 'CHU de Cocody',
      createdAt         : '2025-01-10T08:30:00Z',
      accountStatus     : STATUS.ACTIVE,
      activatedAt       : '2025-01-10T08:45:00Z',
      emergencyContact  : { name: 'Marie KOUASSI', relation: 'Épouse', phone: '0701234568' }
    },
    patientMedicalRecord: {
      patientId         : 'PAT-001',
      bloodType         : 'O+',
      weight            : '75 kg',
      height            : '178 cm',
      allergies         : ['Pénicilline'],
      chronicDiseases   : [],
      disabilities      : [],
      consultations     : [
        { id: 'CONS-001', date: '2025-01-25', doctor: 'Dr. Jean KOUASSI', center: 'CHU Cocody', specialty: 'Cardiologie', diagnosis: 'Contrôle de routine - RAS', notes: '' },
        { id: 'CONS-002', date: '2024-12-10', doctor: 'Dr. Marie KONÉ', center: 'Centre Abobo', specialty: 'Médecine Générale', diagnosis: 'Grippe saisonnière', notes: '' }
      ],
      prescriptions     : [
        { id: 'ORD-2025-001', date: '2025-01-25', doctor: 'Dr. Jean KOUASSI', items: ['Paracétamol 500mg - 3x/j', 'Vitamine C'], status: 'ACTIVE', qrCode: 'QR-ORD-2025-001' },
        { id: 'ORD-2024-045', date: '2024-12-10', doctor: 'Dr. Marie KONÉ',   items: ['Amoxicilline', 'Sirop antitussif'], status: 'DISPENSED', qrCode: 'QR-ORD-2024-045' }
      ],
      vaccines          : [
        { name: 'COVID-19 (Rappel)', date: '2025-01-10', center: 'Centre Abobo', status: 'DONE' },
        { name: 'Fièvre Jaune',      date: '2020-06-15', center: 'Institut Pasteur', status: 'DONE' },
        { name: 'Tétanos',           date: '2020-01-10', center: 'CHU Cocody', status: 'BOOSTER_DUE', nextDue: '2025-03-01' }
      ],
      exams             : [
        { id: 'EXAM-001', name: 'Bilan Sanguin Complet', date: '2025-01-20', lab: 'BIOLAB', result: 'Normal', fileUrl: null },
        { id: 'EXAM-002', name: 'Radiographie Thoracique', date: '2024-11-10', lab: 'CHU Cocody', result: 'Normal', fileUrl: null }
      ],
      lastUpdatedBy     : 'Dr. Jean KOUASSI',
      lastUpdatedAt     : '2025-01-25T14:30:00Z'
    },
    consentements: {
      patientId         : 'PAT-001',
      authorizedProviders: [
        { providerId: 'PRO-KOUASSI', name: 'Dr. Jean KOUASSI', center: 'CHU Cocody', scope: 'FULL', expiresAt: null,           grantedAt: '2025-01-10T08:45:00Z' },
        { providerId: 'PRO-KONE',    name: 'Dr. Marie KONÉ',   center: 'Centre Abobo', scope: 'EMERGENCY_ONLY', expiresAt: '2025-02-07', grantedAt: '2024-12-10T09:00:00Z' }
      ],
      accessHistory     : [
        { providerId: 'PRO-KOUASSI', name: 'Dr. Jean KOUASSI', center: 'CHU Cocody', sections: ['profil', 'consultations'], at: '2025-01-25T14:30:00Z' },
        { providerId: 'PRO-KONE',    name: 'Dr. Marie KONÉ',   center: 'Centre Abobo', sections: ['urgences', 'vaccins'],  at: '2024-12-10T09:15:00Z' }
      ],
      pendingRequests   : [
        { providerId: 'PRO-TRAORE', name: 'Dr. Ibrahim TRAORÉ', center: 'Pharmacie Centrale', scope: 'PRESCRIPTIONS_ONLY', requestedAt: '2025-02-18T10:00:00Z' }
      ]
    }
  },

  // ── Patient 2 : Compte ACTIF ──────────────────────────────────────────────
  '0987654321': {
    status     : STATUS.ACTIVE,
    phone      : '0709876543',
    patientProfile: {
      patientId         : 'PAT-002',
      cmu               : '0987654321',
      temporaryId       : null,
      firstName         : 'Marie',
      lastName          : 'KONÉ',
      dateOfBirth       : '1992-05-20',
      gender            : 'F',
      phone             : '0709876543',
      photo             : null,
      address           : 'Yopougon, Abidjan',
      createdByCenter   : 'CHU de Treichville',
      createdAt         : '2025-01-15T10:00:00Z',
      accountStatus     : STATUS.ACTIVE,
      activatedAt       : '2025-01-15T10:15:00Z',
      emergencyContact  : { name: 'Issa KONÉ', relation: 'Époux', phone: '0709876544' }
    },
    patientMedicalRecord: {
      patientId         : 'PAT-002',
      bloodType         : 'A+',
      weight            : '62 kg',
      height            : '165 cm',
      allergies         : [],
      chronicDiseases   : ['Diabète type 2'],
      disabilities      : [],
      consultations     : [
        { id: 'CONS-003', date: '2025-02-01', doctor: 'Dr. Traoré Awa', center: 'CHU Treichville', specialty: 'Endocrinologie', diagnosis: 'Suivi diabète - stable', notes: 'HbA1c 6.8%' }
      ],
      prescriptions     : [
        { id: 'ORD-2025-010', date: '2025-02-01', doctor: 'Dr. Traoré Awa', items: ['Metformine 500mg - 2x/j'], status: 'ACTIVE', qrCode: 'QR-ORD-2025-010' }
      ],
      vaccines          : [
        { name: 'COVID-19',   date: '2024-09-01', center: 'CHU Treichville', status: 'DONE' },
        { name: 'Grippe',     date: '2024-11-01', center: 'Centre Yopougon', status: 'DONE' }
      ],
      exams             : [],
      lastUpdatedBy     : 'Dr. Traoré Awa',
      lastUpdatedAt     : '2025-02-01T11:00:00Z'
    },
    consentements: { patientId: 'PAT-002', authorizedProviders: [], accessHistory: [], pendingRequests: [] }
  },

  // ── Patient 3 : Compte en ATTENTE D'ACTIVATION (premier login) ────────────
  '1111111111': {
    status     : STATUS.PENDING_ACTIVATION,
    phone      : '0701111111',
    patientProfile: {
      patientId         : 'PAT-003',
      cmu               : '1111111111',
      temporaryId       : null,
      firstName         : 'Ibrahim',
      lastName          : 'TRAORÉ',
      dateOfBirth       : '1978-11-03',
      gender            : 'M',
      phone             : '0701111111',
      photo             : null,
      address           : 'Abobo, Abidjan',
      createdByCenter   : 'Centre de Santé Abobo-Gare',
      createdAt         : '2026-02-18T09:00:00Z',
      accountStatus     : STATUS.PENDING_ACTIVATION,
      activatedAt       : null,
      emergencyContact  : { name: 'Fatoumata TRAORÉ', relation: 'Épouse', phone: '0701111112' }
    },
    patientMedicalRecord: {
      patientId         : 'PAT-003',
      bloodType         : 'B+',
      weight            : null,
      height            : null,
      allergies         : [],
      chronicDiseases   : [],
      disabilities      : [],
      consultations     : [],
      prescriptions     : [],
      vaccines          : [],
      exams             : [],
      lastUpdatedBy     : null,
      lastUpdatedAt     : null
    },
    consentements: { patientId: 'PAT-003', authorizedProviders: [], accessHistory: [], pendingRequests: [] }
  },

  // ── Patient 4 : ID PROVISOIRE (sans CMU) ─────────────────────────────────
  'PROV-ABJ001': {
    status     : STATUS.PENDING_ACTIVATION,
    phone      : '0705000001',
    patientProfile: {
      patientId         : 'PAT-004',
      cmu               : null,
      temporaryId       : 'PROV-ABJ001',
      firstName         : 'Adjoua',
      lastName          : 'YAO',
      dateOfBirth       : '2000-03-12',
      gender            : 'F',
      phone             : '0705000001',
      photo             : null,
      address           : 'Adjamé, Abidjan',
      createdByCenter   : 'Centre de Santé Adjamé',
      createdAt         : '2026-02-17T14:00:00Z',
      accountStatus     : STATUS.PENDING_ACTIVATION,
      activatedAt       : null,
      emergencyContact  : { name: 'Koffi YAO', relation: 'Père', phone: '0705000002' }
    },
    patientMedicalRecord: {
      patientId         : 'PAT-004',
      bloodType         : null,
      weight            : null,
      height            : null,
      allergies         : [],
      chronicDiseases   : [],
      disabilities      : [],
      consultations     : [],
      prescriptions     : [],
      vaccines          : [],
      exams             : [],
      lastUpdatedBy     : null,
      lastUpdatedAt     : null
    },
    consentements: { patientId: 'PAT-004', authorizedProviders: [], accessHistory: [], pendingRequests: [] }
  }
};

// ─── Simulations API ─────────────────────────────────────────────────────────

async function simulateRequestOtp(identifier) {
  await new Promise(resolve => setTimeout(resolve, 900));

  const key = identifier.toUpperCase().startsWith('PROV-')
    ? identifier.toUpperCase()
    : identifier;

  const patient = MOCK_PATIENTS[key];
  if (!patient) {
    return { success: false, message: 'Identifiant non trouvé dans la base de données.' };
  }

  if (patient.status === STATUS.SUSPENDED) {
    return { success: false, message: 'Compte suspendu. Contactez votre centre de santé.' };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`%c[SIMULATION] OTP pour ${key}: ${otp}`, 'color:#2ecc71;font-weight:bold;font-size:14px');
  console.log(`%c[SIMULATION] Statut patient: ${patient.status}`, 'color:#3498db');

  sessionStorage.setItem('temp_otp',      otp);
  sessionStorage.setItem('temp_otp_time', Date.now().toString());
  sessionStorage.setItem('temp_patient_key', key);

  return {
    success         : true,
    otpRequestId    : `OTP-${Date.now()}`,
    phoneNumber     : patient.phone,
    patientStatus   : patient.status,
    createdByCenter : patient.patientProfile.createdByCenter,
    message         : 'Code envoyé avec succès'
  };
}

async function simulateVerifyOtp(otpRequestId, otpCode) {
  await new Promise(resolve => setTimeout(resolve, 700));

  const storedOtp  = sessionStorage.getItem('temp_otp');
  const storedTime = parseInt(sessionStorage.getItem('temp_otp_time') || '0', 10);
  const patientKey = sessionStorage.getItem('temp_patient_key');

  if (!storedOtp || !storedTime || Date.now() - storedTime > appState.otpExpirationTime) {
    return { success: false, message: 'Le code a expiré. Veuillez en demander un nouveau.' };
  }

  if (otpCode !== storedOtp) {
    return { success: false, message: 'Code OTP incorrect.' };
  }

  // Nettoyer session
  sessionStorage.removeItem('temp_otp');
  sessionStorage.removeItem('temp_otp_time');
  sessionStorage.removeItem('temp_patient_key');

  const patient = MOCK_PATIENTS[patientKey];

  // Activer le compte si PENDING_ACTIVATION
  if (patient.status === STATUS.PENDING_ACTIVATION) {
    patient.status = STATUS.ACTIVE;
    patient.patientProfile.accountStatus = STATUS.ACTIVE;
    patient.patientProfile.activatedAt   = new Date().toISOString();
    console.log(`%c[SIMULATION] Compte ${patientKey} activé !`, 'color:#e74c3c;font-weight:bold');
  }

  return {
    success              : true,
    accessToken          : `jwt_token_${Date.now()}`,
    refreshToken         : `refresh_${Date.now()}`,
    userData             : {
      role      : 'PATIENT',
      cmuNumber : patient.patientProfile.cmu || patient.patientProfile.temporaryId,
      name      : `${patient.patientProfile.firstName} ${patient.patientProfile.lastName}`
    },
    patientProfile       : patient.patientProfile,
    patientMedicalRecord : patient.patientMedicalRecord,
    consentements        : patient.consentements
  };
}
