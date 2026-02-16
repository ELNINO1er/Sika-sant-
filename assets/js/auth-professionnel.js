/**
 * Authentication Professionnel - Sika-Santé
 * Gestion de la connexion professionnel avec MFA
 */

// État de l'application
let appState = {
  mfaRequestId: null,
  userEmail: null,
  userRole: null,
  mfaAttempts: 0,
  maxAttempts: 5,
  mfaExpirationTime: 5 * 60 * 1000, // 5 minutes
  resendCountdown: 60,
  resendInterval: null,
  loginAttempts: 0,
  maxLoginAttempts: 5
};

// Éléments DOM
const loginSection = document.getElementById('loginSection');
const mfaSection = document.getElementById('mfaSection');
const loginForm = document.getElementById('loginForm');
const verifyMfaForm = document.getElementById('verifyMfaForm');
const proEmailInput = document.getElementById('proEmail');
const proPasswordInput = document.getElementById('proPassword');
const togglePassword = document.getElementById('togglePassword');
const toggleIcon = document.getElementById('toggleIcon');
const otpInputs = document.querySelectorAll('.otp-input');
const mfaContact = document.getElementById('mfaContact');
const roleDisplay = document.getElementById('roleDisplay');
const roleText = document.getElementById('roleText');
const loginBtn = document.getElementById('loginBtn');
const verifyMfaBtn = document.getElementById('verifyMfaBtn');
const resendMfaBtn = document.getElementById('resendMfaBtn');
const resendTimer = document.getElementById('resendTimer');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', function() {
  // Gestion du formulaire de login
  loginForm.addEventListener('submit', handleLogin);

  // Gestion du formulaire MFA
  verifyMfaForm.addEventListener('submit', handleVerifyMfa);

  // Toggle password visibility
  togglePassword.addEventListener('click', handleTogglePassword);

  // Gestion des inputs OTP
  setupOtpInputs();

  // Bouton retour
  backToLoginBtn.addEventListener('click', backToLogin);

  // Bouton renvoi MFA
  resendMfaBtn.addEventListener('click', handleResendMfa);
});

/**
 * Login (Step 1)
 */
async function handleLogin(e) {
  e.preventDefault();
  hideMessages();

  const email = proEmailInput.value.trim();
  const password = proPasswordInput.value;

  // Validation
  if (!email || !password) {
    showError('Veuillez remplir tous les champs');
    return;
  }

  // Vérifier tentatives de connexion
  if (appState.loginAttempts >= appState.maxLoginAttempts) {
    showError('Trop de tentatives. Votre compte a été temporairement bloqué. Contactez le support.');
    return;
  }

  // Désactiver le bouton
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connexion...';

  try {
    // Simulation API call
    const response = await simulateLogin(email, password);

    if (response.success) {
      appState.mfaRequestId = response.mfaRequestId;
      appState.userEmail = email;
      appState.userRole = response.role;
      appState.mfaAttempts = 0;

      // Masquer contact
      mfaContact.textContent = maskContact(response.mfaContact);

      // Afficher rôle
      roleText.textContent = getRoleDisplayName(response.role);
      roleDisplay.style.display = 'block';

      // Passer à l'étape MFA
      loginSection.style.display = 'none';
      mfaSection.style.display = 'block';

      // Démarrer le compte à rebours
      startResendCountdown();

      // Focus sur premier input
      otpInputs[0].focus();

      // Reset login attempts
      appState.loginAttempts = 0;

    } else {
      appState.loginAttempts++;
      const remaining = appState.maxLoginAttempts - appState.loginAttempts;

      if (remaining > 0) {
        showError(`${response.message || 'Identifiants incorrects'}. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`);
      } else {
        showError('Compte bloqué pour des raisons de sécurité. Contactez le support.');
      }
    }
  } catch (error) {
    showError('Erreur de connexion. Veuillez réessayer.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Continuer';
  }
}

/**
 * Vérification MFA (Step 2)
 */
async function handleVerifyMfa(e) {
  e.preventDefault();
  hideMessages();

  // Récupérer le code MFA
  const mfaCode = Array.from(otpInputs).map(input => input.value).join('');

  // Validation
  if (mfaCode.length !== 6) {
    showError('Veuillez entrer le code complet à 6 chiffres');
    return;
  }

  // Vérifier tentatives
  if (appState.mfaAttempts >= appState.maxAttempts) {
    showError('Trop de tentatives. Veuillez demander un nouveau code.');
    clearOtpInputs();
    return;
  }

  appState.mfaAttempts++;

  // Désactiver le bouton
  verifyMfaBtn.disabled = true;
  verifyMfaBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Vérification...';

  try {
    // Simulation API call
    const response = await simulateVerifyMfa(appState.mfaRequestId, mfaCode);

    if (response.success) {
      // Stocker les tokens et informations
      localStorage.setItem('sika_access_token', response.accessToken);
      localStorage.setItem('sika_refresh_token', response.refreshToken);
      localStorage.setItem('sika_user_role', response.role);
      localStorage.setItem('sika_user_permissions', JSON.stringify(response.permissions));
      localStorage.setItem('sika_user_data', JSON.stringify(response.userData));

      // Enregistrer la connexion
      logAccess(response.userData);

      showSuccess('Authentification réussie ! Redirection...');

      // Redirection vers le dashboard
      setTimeout(() => {
        window.location.href = 'dashboard-professionnel.html';
      }, 1500);

    } else {
      showError(response.message || 'Code incorrect ou expiré');
      clearOtpInputs();
      otpInputs[0].focus();

      const remaining = appState.maxAttempts - appState.mfaAttempts;
      if (remaining > 0) {
        showError(`Code incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`);
      }
    }
  } catch (error) {
    showError('Erreur de vérification. Veuillez réessayer.');
    clearOtpInputs();
  } finally {
    verifyMfaBtn.disabled = false;
    verifyMfaBtn.innerHTML = '<i class="bi bi-shield-check me-2"></i>Vérifier et se connecter';
  }
}

/**
 * Renvoyer le code MFA
 */
async function handleResendMfa() {
  hideMessages();

  resendMfaBtn.disabled = true;
  resendMfaBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Envoi...';

  try {
    const response = await simulateResendMfa(appState.mfaRequestId);

    if (response.success) {
      appState.mfaRequestId = response.mfaRequestId;
      appState.mfaAttempts = 0;
      clearOtpInputs();
      showSuccess('Un nouveau code a été envoyé !');
      startResendCountdown();
    } else {
      showError('Erreur lors du renvoi. Veuillez réessayer.');
    }
  } catch (error) {
    showError('Erreur de connexion.');
  }
}

/**
 * Toggle password visibility
 */
function handleTogglePassword() {
  const type = proPasswordInput.type === 'password' ? 'text' : 'password';
  proPasswordInput.type = type;
  toggleIcon.classList.toggle('bi-eye');
  toggleIcon.classList.toggle('bi-eye-slash');
}

/**
 * Configuration des inputs OTP
 */
function setupOtpInputs() {
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', function(e) {
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    input.addEventListener('paste', function(e) {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
      const digits = pastedData.split('').slice(0, 6);

      digits.forEach((digit, i) => {
        if (otpInputs[i]) {
          otpInputs[i].value = digit;
        }
      });

      if (digits.length === 6) {
        otpInputs[5].focus();
      }
    });
  });
}

/**
 * Retour au login
 */
function backToLogin() {
  mfaSection.style.display = 'none';
  loginSection.style.display = 'block';
  clearOtpInputs();
  hideMessages();
  if (appState.resendInterval) {
    clearInterval(appState.resendInterval);
  }
}

/**
 * Compte à rebours pour le renvoi
 */
function startResendCountdown() {
  appState.resendCountdown = 60;
  resendMfaBtn.disabled = true;

  appState.resendInterval = setInterval(() => {
    appState.resendCountdown--;
    resendTimer.textContent = `(${appState.resendCountdown}s)`;

    if (appState.resendCountdown <= 0) {
      clearInterval(appState.resendInterval);
      resendMfaBtn.disabled = false;
      resendTimer.textContent = '';
    }
  }, 1000);
}

/**
 * Logger l'accès (audit trail)
 */
function logAccess(userData) {
  const accessLog = {
    userId: userData.id,
    email: userData.email,
    role: userData.role,
    timestamp: new Date().toISOString(),
    ip: 'simulated_ip', // En production: récupéré côté serveur
    userAgent: navigator.userAgent
  };

  console.log('[AUDIT] Accès enregistré:', accessLog);

  // En production: envoyer au serveur
  // await fetch('/api/audit/log-access', { method: 'POST', body: JSON.stringify(accessLog) });
}

/**
 * Utilitaires
 */
function clearOtpInputs() {
  otpInputs.forEach(input => input.value = '');
}

function maskContact(contact) {
  if (contact.includes('@')) {
    // Email
    const [name, domain] = contact.split('@');
    return `${name.substring(0, 3)}***@${domain}`;
  } else {
    // Téléphone
    return contact.replace(/(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '+225 $1 ** ** $5');
  }
}

function getRoleDisplayName(role) {
  const roles = {
    'DOCTOR': 'Médecin',
    'NURSE': 'Infirmier(ère)',
    'PHARMACIST': 'Pharmacien(ne)',
    'ER': 'Urgentiste',
    'ADMIN': 'Administrateur'
  };
  return roles[role] || role;
}

function showError(message) {
  errorText.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
}

function showSuccess(message) {
  successText.textContent = message;
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
}

function hideMessages() {
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';
}

/**
 * Simulations API
 */
async function simulateLogin(email, password) {
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Base de données mock
  const mockUsers = {
    'dr.kouassi@chu-abidjan.ci': {
      password: 'Password123!',
      role: 'DOCTOR',
      name: 'Dr. Jean KOUASSI',
      phone: '0701234567',
      speciality: 'Cardiologie'
    },
    'inf.kone@chu-treichville.ci': {
      password: 'Nurse2024!',
      role: 'NURSE',
      name: 'Marie KONÉ',
      phone: '0709876543',
      service: 'Urgences'
    },
    'pharm.traore@pharmacie-ci.ci': {
      password: 'Pharma456!',
      role: 'PHARMACIST',
      name: 'Ibrahim TRAORÉ',
      phone: '0701111111',
      pharmacy: 'Pharmacie Centrale'
    }
  };

  const user = mockUsers[email];

  if (user && user.password === password) {
    // Générer MFA code
    const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[SIMULATION] Code MFA pour ${email}: ${mfaCode}`);

    // Stocker temporairement
    sessionStorage.setItem('temp_mfa', mfaCode);
    sessionStorage.setItem('temp_mfa_time', Date.now().toString());
    sessionStorage.setItem('temp_user_data', JSON.stringify(user));

    return {
      success: true,
      mfaRequestId: `MFA-${Date.now()}`,
      role: user.role,
      mfaContact: user.phone,
      message: 'Code MFA envoyé'
    };
  } else {
    return {
      success: false,
      message: 'Identifiant ou mot de passe incorrect'
    };
  }
}

async function simulateVerifyMfa(mfaRequestId, mfaCode) {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const storedMfa = sessionStorage.getItem('temp_mfa');
  const storedTime = parseInt(sessionStorage.getItem('temp_mfa_time'));
  const userData = JSON.parse(sessionStorage.getItem('temp_user_data'));

  // Vérifier expiration
  if (Date.now() - storedTime > appState.mfaExpirationTime) {
    return {
      success: false,
      message: 'Le code a expiré. Veuillez en demander un nouveau.'
    };
  }

  // Vérifier le code
  if (mfaCode === storedMfa) {
    // Nettoyer
    sessionStorage.removeItem('temp_mfa');
    sessionStorage.removeItem('temp_mfa_time');
    sessionStorage.removeItem('temp_user_data');

    // Permissions selon rôle
    const permissions = getPermissionsByRole(userData.role);

    return {
      success: true,
      accessToken: 'jwt_pro_' + Date.now(),
      refreshToken: 'refresh_pro_' + Date.now(),
      role: userData.role,
      permissions: permissions,
      userData: {
        id: 'PRO-' + Date.now(),
        email: appState.userEmail,
        name: userData.name,
        role: userData.role,
        ...userData
      }
    };
  } else {
    return {
      success: false,
      message: 'Code MFA incorrect'
    };
  }
}

async function simulateResendMfa(mfaRequestId) {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[SIMULATION] Nouveau code MFA: ${mfaCode}`);

  sessionStorage.setItem('temp_mfa', mfaCode);
  sessionStorage.setItem('temp_mfa_time', Date.now().toString());

  return {
    success: true,
    mfaRequestId: `MFA-${Date.now()}`
  };
}

function getPermissionsByRole(role) {
  const permissions = {
    'DOCTOR': ['read_patient', 'write_consultation', 'prescribe', 'access_full_history'],
    'NURSE': ['read_patient', 'write_vitals', 'access_limited_history'],
    'PHARMACIST': ['read_prescription', 'validate_prescription', 'dispense'],
    'ER': ['read_patient', 'write_emergency', 'access_emergency_info'],
    'ADMIN': ['full_access']
  };
  return permissions[role] || [];
}
