/**
 * Authentication Institution - Sika-Santé
 * Gestion de la connexion institutionnelle avec sécurité renforcée
 */

// État de l'application
let appState = {
  mfaRequestId: null,
  institutionId: null,
  institution: null,
  mfaAttempts: 0,
  maxAttempts: 3, // Plus strict pour les institutions
  mfaExpirationTime: 5 * 60 * 1000,
  resendCountdown: 90, // Plus long pour institutions
  resendInterval: null,
  loginAttempts: 0,
  maxLoginAttempts: 3
};

// Éléments DOM
const loginSection = document.getElementById('loginSection');
const mfaSection = document.getElementById('mfaSection');
const loginForm = document.getElementById('loginForm');
const verifyMfaForm = document.getElementById('verifyMfaForm');
const institutionSelect = document.getElementById('institution');
const institutionIdInput = document.getElementById('institutionId');
const govPasswordInput = document.getElementById('govPassword');
const togglePassword = document.getElementById('togglePassword');
const toggleIcon = document.getElementById('toggleIcon');
const otpInputs = document.querySelectorAll('.otp-input');
const mfaContact = document.getElementById('mfaContact');
const institutionDisplay = document.getElementById('institutionDisplay');
const institutionText = document.getElementById('institutionText');
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

  // Formater ID institutionnel
  institutionIdInput.addEventListener('input', formatInstitutionId);
});

/**
 * Login (Step 1)
 */
async function handleLogin(e) {
  e.preventDefault();
  hideMessages();

  const institution = institutionSelect.value;
  const institutionId = institutionIdInput.value.trim();
  const password = govPasswordInput.value;

  // Validation
  if (!institution) {
    showError('Veuillez sélectionner votre institution');
    return;
  }

  if (!institutionId || !password) {
    showError('Veuillez remplir tous les champs');
    return;
  }

  // Validation format ID
  if (!/^GOV-[A-Z]+-\d{4}$/i.test(institutionId)) {
    showError('Format d\'identifiant invalide (GOV-XXX-0000)');
    return;
  }

  // Validation mot de passe robuste
  if (password.length < 12) {
    showError('Le mot de passe doit contenir au moins 12 caractères');
    return;
  }

  // Vérifier tentatives de connexion
  if (appState.loginAttempts >= appState.maxLoginAttempts) {
    showError('Compte bloqué pour des raisons de sécurité. Contactez support-gov@sika-sante.ci');
    // Logger la tentative de connexion suspecte
    logSuspiciousActivity();
    return;
  }

  // Désactiver le bouton
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Vérification sécurisée...';

  try {
    // Simulation API call
    const response = await simulateLogin(institution, institutionId, password);

    if (response.success) {
      appState.mfaRequestId = response.mfaRequestId;
      appState.institutionId = institutionId;
      appState.institution = institution;
      appState.mfaAttempts = 0;

      // Afficher contact masqué
      mfaContact.textContent = maskContact(response.mfaContact);

      // Afficher institution
      institutionText.textContent = getInstitutionName(institution);
      institutionDisplay.style.display = 'block';

      // Passer à l'étape MFA
      loginSection.style.display = 'none';
      mfaSection.style.display = 'block';

      // Démarrer le compte à rebours (90s pour institutions)
      startResendCountdown();

      // Focus sur premier input
      otpInputs[0].focus();

      // Reset login attempts
      appState.loginAttempts = 0;

    } else {
      appState.loginAttempts++;
      const remaining = appState.maxLoginAttempts - appState.loginAttempts;

      // Logger la tentative
      logFailedAttempt(institutionId);

      if (remaining > 0) {
        showError(`${response.message || 'Identifiants incorrects'}. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`);
      } else {
        showError('Accès bloqué. Une alerte de sécurité a été envoyée. Contactez support-gov@sika-sante.ci');
        logSuspiciousActivity();
      }
    }
  } catch (error) {
    showError('Erreur de connexion sécurisée. Veuillez réessayer.');
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

  // Vérifier tentatives (plus strict)
  if (appState.mfaAttempts >= appState.maxAttempts) {
    showError('Trop de tentatives. Accès bloqué. Contactez le support.');
    logSuspiciousActivity();
    clearOtpInputs();
    return;
  }

  appState.mfaAttempts++;

  // Désactiver le bouton
  verifyMfaBtn.disabled = true;
  verifyMfaBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Vérification sécurisée...';

  try {
    // Simulation API call
    const response = await simulateVerifyMfa(appState.mfaRequestId, mfaCode);

    if (response.success) {
      // Stocker les tokens et informations
      localStorage.setItem('sika_access_token', response.accessToken);
      localStorage.setItem('sika_refresh_token', response.refreshToken);
      localStorage.setItem('sika_user_role', 'INSTITUTION');
      localStorage.setItem('sika_institution', appState.institution);
      localStorage.setItem('sika_user_permissions', JSON.stringify(response.permissions));
      localStorage.setItem('sika_user_data', JSON.stringify(response.userData));

      // Enregistrer l'accès (audit trail obligatoire)
      await logSecureAccess(response.userData);

      showSuccess('Authentification réussie ! Chargement du tableau de bord...');

      // Redirection vers le dashboard
      setTimeout(() => {
        window.location.href = 'dashboard-institution.html';
      }, 2000);

    } else {
      showError(response.message || 'Code incorrect ou expiré');
      clearOtpInputs();
      otpInputs[0].focus();

      const remaining = appState.maxAttempts - appState.mfaAttempts;
      if (remaining > 0) {
        showError(`Code incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`);
      } else {
        showError('Accès bloqué. Alerte de sécurité envoyée.');
        logSuspiciousActivity();
      }
    }
  } catch (error) {
    showError('Erreur de vérification. Veuillez réessayer.');
    clearOtpInputs();
  } finally {
    verifyMfaBtn.disabled = false;
    verifyMfaBtn.innerHTML = '<i class="bi bi-shield-check me-2"></i>Vérifier et accéder au tableau de bord';
  }
}

/**
 * Renvoyer le code MFA
 */
async function handleResendMfa() {
  hideMessages();

  resendMfaBtn.disabled = true;
  resendMfaBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Envoi sécurisé...';

  try {
    const response = await simulateResendMfa(appState.mfaRequestId);

    if (response.success) {
      appState.mfaRequestId = response.mfaRequestId;
      appState.mfaAttempts = 0;
      clearOtpInputs();
      showSuccess('Un nouveau code sécurisé a été envoyé !');
      startResendCountdown();
    } else {
      showError('Erreur lors du renvoi. Contactez le support.');
    }
  } catch (error) {
    showError('Erreur de connexion sécurisée.');
  }
}

/**
 * Formater l'ID institutionnel
 */
function formatInstitutionId(e) {
  let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

  // Auto-format: GOV-XXX-0000
  if (value.length > 0 && !value.startsWith('GOV-')) {
    value = 'GOV-' + value;
  }

  e.target.value = value;
}

/**
 * Toggle password visibility
 */
function handleTogglePassword() {
  const type = govPasswordInput.type === 'password' ? 'text' : 'password';
  govPasswordInput.type = type;
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
 * Compte à rebours pour le renvoi (90s pour institutions)
 */
function startResendCountdown() {
  appState.resendCountdown = 90;
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
 * Logger l'accès sécurisé (obligatoire pour institutions)
 */
async function logSecureAccess(userData) {
  const accessLog = {
    userId: userData.id,
    institution: userData.institution,
    institutionId: userData.institutionId,
    accessLevel: 'HIGH',
    timestamp: new Date().toISOString(),
    ip: 'simulated_ip',
    userAgent: navigator.userAgent,
    sessionId: 'SESSION-' + Date.now()
  };

  console.log('[AUDIT INSTITUTIONNEL] Accès enregistré:', accessLog);

  // En production: envoi obligatoire au serveur d'audit
  // await fetch('/api/audit/gov-access', { method: 'POST', body: JSON.stringify(accessLog) });
}

/**
 * Logger les tentatives échouées
 */
function logFailedAttempt(institutionId) {
  const failLog = {
    institutionId: institutionId,
    timestamp: new Date().toISOString(),
    ip: 'simulated_ip',
    attempt: appState.loginAttempts
  };

  console.warn('[SECURITY] Tentative échouée:', failLog);

  // En production: alerter si > 3 tentatives
}

/**
 * Logger activité suspecte
 */
function logSuspiciousActivity() {
  const suspiciousLog = {
    institutionId: appState.institutionId,
    timestamp: new Date().toISOString(),
    ip: 'simulated_ip',
    reason: 'MAX_ATTEMPTS_EXCEEDED',
    severity: 'HIGH'
  };

  console.error('[SECURITY ALERT] Activité suspecte détectée:', suspiciousLog);

  // En production: alerte immédiate au SOC (Security Operations Center)
}

/**
 * Utilitaires
 */
function clearOtpInputs() {
  otpInputs.forEach(input => input.value = '');
}

function maskContact(contact) {
  if (contact.includes('@')) {
    const [name, domain] = contact.split('@');
    return `${name.substring(0, 3)}***@${domain}`;
  } else {
    return contact.replace(/(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '+225 $1 ** ** $5');
  }
}

function getInstitutionName(code) {
  const institutions = {
    'ministere-sante': 'Ministère de la Santé et de l\'Hygiène Publique',
    'artci': 'Autorité de Régulation des Télécommunications de Côte d\'Ivoire',
    'cnam': 'Caisse Nationale d\'Assurance Maladie',
    'inp': 'Institut National de Santé Publique',
    'dge': 'Direction Générale des Épidémies'
  };
  return institutions[code] || code;
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
async function simulateLogin(institution, institutionId, password) {
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Base de données mock (institutions autorisées)
  const mockInstitutions = {
    'GOV-MSANTE-1001': {
      institution: 'ministere-sante',
      password: 'SecureGov2024!@#',
      contact: 'securite@msante.gouv.ci',
      phone: '0727000001',
      level: 'FULL_ACCESS'
    },
    'GOV-ARTCI-2001': {
      institution: 'artci',
      password: 'ArtciSecure2024!',
      contact: 'admin@artci.ci',
      phone: '0727000002',
      level: 'REGULATORY'
    },
    'GOV-CNAM-3001': {
      institution: 'cnam',
      password: 'CnamSecure2024!',
      contact: 'support@cnam.ci',
      phone: '0727000003',
      level: 'INSURANCE'
    }
  };

  const instData = mockInstitutions[institutionId];

  if (instData && instData.institution === institution && instData.password === password) {
    // Générer MFA code
    const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[SIMULATION INSTITUTION] Code MFA pour ${institutionId}: ${mfaCode}`);

    // Stocker temporairement
    sessionStorage.setItem('temp_gov_mfa', mfaCode);
    sessionStorage.setItem('temp_gov_mfa_time', Date.now().toString());
    sessionStorage.setItem('temp_gov_data', JSON.stringify(instData));

    return {
      success: true,
      mfaRequestId: `GOV-MFA-${Date.now()}`,
      mfaContact: instData.phone,
      message: 'Code de validation envoyé'
    };
  } else {
    return {
      success: false,
      message: 'Identifiants institutionnels incorrects ou accès non autorisé'
    };
  }
}

async function simulateVerifyMfa(mfaRequestId, mfaCode) {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const storedMfa = sessionStorage.getItem('temp_gov_mfa');
  const storedTime = parseInt(sessionStorage.getItem('temp_gov_mfa_time'));
  const instData = JSON.parse(sessionStorage.getItem('temp_gov_data'));

  // Vérifier expiration
  if (Date.now() - storedTime > appState.mfaExpirationTime) {
    return {
      success: false,
      message: 'Le code a expiré pour des raisons de sécurité. Veuillez en demander un nouveau.'
    };
  }

  // Vérifier le code
  if (mfaCode === storedMfa) {
    // Nettoyer
    sessionStorage.removeItem('temp_gov_mfa');
    sessionStorage.removeItem('temp_gov_mfa_time');
    sessionStorage.removeItem('temp_gov_data');

    // Permissions institutionnelles (accès données anonymisées uniquement)
    const permissions = [
      'view_anonymized_data',
      'generate_reports',
      'view_statistics',
      'epidemio_dashboard',
      'health_alerts'
    ];

    return {
      success: true,
      accessToken: 'jwt_gov_' + Date.now(),
      refreshToken: 'refresh_gov_' + Date.now(),
      permissions: permissions,
      userData: {
        id: appState.institutionId,
        institution: appState.institution,
        institutionId: appState.institutionId,
        institutionName: getInstitutionName(appState.institution),
        accessLevel: instData.level,
        type: 'GOVERNMENT'
      }
    };
  } else {
    return {
      success: false,
      message: 'Code de validation incorrect'
    };
  }
}

async function simulateResendMfa(mfaRequestId) {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[SIMULATION INSTITUTION] Nouveau code MFA: ${mfaCode}`);

  sessionStorage.setItem('temp_gov_mfa', mfaCode);
  sessionStorage.setItem('temp_gov_mfa_time', Date.now().toString());

  return {
    success: true,
    mfaRequestId: `GOV-MFA-${Date.now()}`
  };
}
