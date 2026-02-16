/**
 * Authentication Pharmacie - Sika-Santé
 * Gestion de la connexion pharmacie avec MFA
 */

// État de l'application
let appState = {
  mfaRequestId: null,
  pharmacyLicense: null,
  pharmacyName: null,
  pharmacistEmail: null,
  userRole: 'PHARMACIEN',
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
const pharmacyNameInput = document.getElementById('pharmacyName');
const pharmacyLicenseInput = document.getElementById('pharmacyLicense');
const pharmacistEmailInput = document.getElementById('pharmacistEmail');
const pharmacyPasswordInput = document.getElementById('pharmacyPassword');
const togglePassword = document.getElementById('togglePassword');
const toggleIcon = document.getElementById('toggleIcon');
const otpInputs = document.querySelectorAll('.otp-input');
const mfaContact = document.getElementById('mfaContact');
const pharmacyDisplay = document.getElementById('pharmacyDisplay');
const pharmacyText = document.getElementById('pharmacyText');
const roleText = document.getElementById('roleText');
const licenseText = document.getElementById('licenseText');
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

  // Format automatique du numéro de licence
  pharmacyLicenseInput.addEventListener('input', formatLicenseNumber);
});

/**
 * Format automatique du numéro de licence pharmacie
 */
function formatLicenseNumber(e) {
  let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

  // Ajouter le préfixe PH-CI- si absent
  if (value.length > 0 && !value.startsWith('PH-CI-')) {
    value = 'PH-CI-' + value.replace(/^(PH-|CI-|PH-CI-)/g, '');
  }

  e.target.value = value;
}

/**
 * Login (Step 1)
 */
async function handleLogin(e) {
  e.preventDefault();
  hideMessages();

  const pharmacyName = pharmacyNameInput.value;
  const license = pharmacyLicenseInput.value.trim();
  const email = pharmacistEmailInput.value.trim();
  const password = pharmacyPasswordInput.value;

  // Validation
  if (!pharmacyName || !license || !email || !password) {
    showError('Veuillez remplir tous les champs');
    return;
  }

  if (!license.startsWith('PH-CI-')) {
    showError('Format de licence invalide (PH-CI-XXXX)');
    return;
  }

  // Vérifier tentatives de connexion
  if (appState.loginAttempts >= appState.maxLoginAttempts) {
    showError('Trop de tentatives. Votre compte a été temporairement bloqué. Contactez le support pharmacie.');
    return;
  }

  // Désactiver le bouton
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Connexion...';

  try {
    // Simulation API call
    const response = await simulateLogin(pharmacyName, license, email, password);

    if (response.success) {
      appState.mfaRequestId = response.mfaRequestId;
      appState.pharmacyLicense = license;
      appState.pharmacyName = pharmacyName;
      appState.pharmacistEmail = email;
      appState.userRole = response.role || 'PHARMACIEN';
      appState.mfaAttempts = 0;

      // Afficher l'écran MFA
      showMfaScreen();

      // Démarrer le compte à rebours
      startResendCountdown();

    } else {
      appState.loginAttempts++;
      const remainingAttempts = appState.maxLoginAttempts - appState.loginAttempts;
      showError(response.message + (remainingAttempts > 0 ? ` (${remainingAttempts} tentatives restantes)` : ''));
    }

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    showError('Une erreur est survenue. Veuillez réessayer.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Continuer';
  }
}

/**
 * Simulation de l'API de login pharmacie
 */
async function simulateLogin(pharmacyName, license, email, password) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Compte de test
      const validCredentials = {
        license: 'PH-CI-2025',
        email: 'pharmacie.moderne@sika-sante.ci',
        password: 'Pharma2025!',
        pharmacyName: 'pharmacie-moderne'
      };

      if (
        license === validCredentials.license &&
        email === validCredentials.email &&
        password === validCredentials.password &&
        pharmacyName === validCredentials.pharmacyName
      ) {
        // Générer un code MFA simulé
        const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Stocker temporairement dans sessionStorage
        sessionStorage.setItem('temp_mfa_code', mfaCode);
        sessionStorage.setItem('temp_mfa_time', Date.now().toString());

        console.log('═══════════════════════════════════════════════════════');
        console.log('🔐 CODE MFA PHARMACIE (SIMULATION)');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`Code à 6 chiffres : ${mfaCode}`);
        console.log(`Pharmacie : ${pharmacyName}`);
        console.log(`Licence : ${license}`);
        console.log(`Validité : 5 minutes`);
        console.log('═══════════════════════════════════════════════════════');
        console.log('⚠️  Ce code est affiché dans la console pour les tests.');
        console.log('   En production, il serait envoyé par SMS/Email.');
        console.log('═══════════════════════════════════════════════════════');

        resolve({
          success: true,
          mfaRequestId: `MFA-PHARMA-${Date.now()}`,
          role: 'PHARMACIEN',
          message: 'Code MFA envoyé'
        });
      } else {
        resolve({
          success: false,
          message: 'Identifiants invalides'
        });
      }
    }, 800);
  });
}

/**
 * Afficher l'écran MFA
 */
function showMfaScreen() {
  loginSection.style.display = 'none';
  mfaSection.style.display = 'block';

  // Masquer l'email partiellement
  const maskedEmail = maskEmail(appState.pharmacistEmail);
  mfaContact.textContent = maskedEmail;

  // Afficher les infos pharmacie
  pharmacyDisplay.style.display = 'block';
  pharmacyText.textContent = getPharmacyDisplayName(appState.pharmacyName);
  roleText.textContent = appState.userRole;
  licenseText.textContent = appState.pharmacyLicense;

  // Focus premier input
  otpInputs[0].focus();

  showSuccess('Code de vérification envoyé à votre email professionnel');
}

/**
 * Obtenir le nom d'affichage de la pharmacie
 */
function getPharmacyDisplayName(value) {
  const names = {
    'pharmacie-moderne': 'Pharmacie Moderne d\'Abidjan',
    'pharmacie-plateau': 'Pharmacie du Plateau',
    'pharmacie-cocody': 'Pharmacie de Cocody',
    'pharmacie-yopougon': 'Pharmacie de Yopougon',
    'pharmacie-chu': 'Pharmacie Hospitalière CHU Cocody',
    'pharmacie-autre': 'Autre pharmacie agréée'
  };
  return names[value] || value;
}

/**
 * Vérification MFA (Step 2)
 */
async function handleVerifyMfa(e) {
  e.preventDefault();
  hideMessages();

  // Collecter le code OTP
  let otpCode = '';
  otpInputs.forEach(input => {
    otpCode += input.value;
  });

  // Validation
  if (otpCode.length !== 6) {
    showError('Veuillez entrer le code à 6 chiffres');
    return;
  }

  // Vérifier tentatives MFA
  if (appState.mfaAttempts >= appState.maxAttempts) {
    showError('Trop de tentatives. Session expirée. Veuillez recommencer.');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    return;
  }

  // Désactiver le bouton
  verifyMfaBtn.disabled = true;
  verifyMfaBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Vérification...';

  try {
    // Simulation API call
    const response = await simulateVerifyMfa(appState.mfaRequestId, otpCode);

    if (response.success) {
      showSuccess('Authentification réussie ! Redirection...');

      // Enregistrer les informations d'authentification
      localStorage.setItem('sika_access_token', response.accessToken);
      localStorage.setItem('sika_user_role', appState.userRole);
      localStorage.setItem('sika_pharmacy_license', appState.pharmacyLicense);
      localStorage.setItem('sika_pharmacy_name', appState.pharmacyName);
      localStorage.setItem('sika_user_email', appState.pharmacistEmail);

      // Log d'audit
      logPharmacyAccess();

      // Redirection vers le dashboard pharmacie
      setTimeout(() => {
        window.location.href = 'dashboard-pharmacie.html';
      }, 1500);

    } else {
      appState.mfaAttempts++;
      const remainingAttempts = appState.maxAttempts - appState.mfaAttempts;

      // Vider les inputs
      otpInputs.forEach(input => input.value = '');
      otpInputs[0].focus();

      if (remainingAttempts > 0) {
        showError(`${response.message} (${remainingAttempts} tentatives restantes)`);
      } else {
        showError('Nombre maximum de tentatives atteint. Session expirée.');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }

  } catch (error) {
    console.error('Erreur lors de la vérification MFA:', error);
    showError('Une erreur est survenue. Veuillez réessayer.');
  } finally {
    verifyMfaBtn.disabled = false;
    verifyMfaBtn.innerHTML = '<i class="bi bi-shield-check me-2"></i>Vérifier et accéder';
  }
}

/**
 * Simulation de la vérification MFA
 */
async function simulateVerifyMfa(mfaRequestId, otpCode) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const storedCode = sessionStorage.getItem('temp_mfa_code');
      const storedTime = parseInt(sessionStorage.getItem('temp_mfa_time'));

      // Vérifier expiration
      if (Date.now() - storedTime > appState.mfaExpirationTime) {
        resolve({
          success: false,
          message: 'Le code a expiré'
        });
        return;
      }

      // Vérifier le code
      if (otpCode === storedCode) {
        // Nettoyer le code temporaire
        sessionStorage.removeItem('temp_mfa_code');
        sessionStorage.removeItem('temp_mfa_time');

        resolve({
          success: true,
          accessToken: `jwt_token_pharmacy_${Date.now()}`,
          message: 'MFA validé'
        });
      } else {
        resolve({
          success: false,
          message: 'Code incorrect'
        });
      }
    }, 500);
  });
}

/**
 * Log d'accès pharmacie (audit trail)
 */
function logPharmacyAccess() {
  const accessLog = {
    timestamp: new Date().toISOString(),
    pharmacyLicense: appState.pharmacyLicense,
    pharmacyName: appState.pharmacyName,
    email: appState.pharmacistEmail,
    role: appState.userRole,
    action: 'LOGIN_SUCCESS',
    ip: 'simulated_ip',
    userAgent: navigator.userAgent
  };

  console.log('📋 [AUDIT PHARMACIE] Accès enregistré:', accessLog);

  // En production, ceci serait envoyé au serveur d'audit
  // await fetch('/api/audit/pharmacy-access', { method: 'POST', body: JSON.stringify(accessLog) });
}

/**
 * Renvoyer le code MFA
 */
async function handleResendMfa() {
  hideMessages();

  // Désactiver le bouton
  resendMfaBtn.disabled = true;

  try {
    // Simuler le renvoi
    const response = await simulateResendMfa(appState.mfaRequestId);

    if (response.success) {
      showSuccess('Nouveau code envoyé !');
      appState.mfaAttempts = 0;

      // Vider les inputs
      otpInputs.forEach(input => input.value = '');
      otpInputs[0].focus();

      // Redémarrer le compte à rebours
      startResendCountdown();
    } else {
      showError(response.message);
    }

  } catch (error) {
    console.error('Erreur lors du renvoi:', error);
    showError('Impossible de renvoyer le code');
  }
}

/**
 * Simulation du renvoi MFA
 */
async function simulateResendMfa(mfaRequestId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Générer un nouveau code
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();

      sessionStorage.setItem('temp_mfa_code', newCode);
      sessionStorage.setItem('temp_mfa_time', Date.now().toString());

      console.log('═══════════════════════════════════════════════════════');
      console.log('🔄 NOUVEAU CODE MFA PHARMACIE');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Nouveau code : ${newCode}`);
      console.log(`Validité : 5 minutes`);
      console.log('═══════════════════════════════════════════════════════');

      resolve({
        success: true,
        message: 'Nouveau code envoyé'
      });
    }, 500);
  });
}

/**
 * Compte à rebours pour le renvoi
 */
function startResendCountdown() {
  appState.resendCountdown = 60;
  resendMfaBtn.disabled = true;
  resendTimer.textContent = `(${appState.resendCountdown}s)`;

  if (appState.resendInterval) {
    clearInterval(appState.resendInterval);
  }

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
 * Retour à l'écran de login
 */
function backToLogin() {
  mfaSection.style.display = 'none';
  loginSection.style.display = 'block';

  // Vider les champs MFA
  otpInputs.forEach(input => input.value = '');

  // Arrêter le compte à rebours
  if (appState.resendInterval) {
    clearInterval(appState.resendInterval);
  }

  hideMessages();
}

/**
 * Toggle password visibility
 */
function handleTogglePassword() {
  const type = pharmacyPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  pharmacyPasswordInput.setAttribute('type', type);

  if (type === 'password') {
    toggleIcon.classList.remove('bi-eye-slash');
    toggleIcon.classList.add('bi-eye');
  } else {
    toggleIcon.classList.remove('bi-eye');
    toggleIcon.classList.add('bi-eye-slash');
  }
}

/**
 * Setup des inputs OTP
 */
function setupOtpInputs() {
  otpInputs.forEach((input, index) => {
    // Auto-focus sur le suivant
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    // Backspace pour revenir en arrière
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    // Autoriser uniquement les chiffres
    input.addEventListener('keypress', (e) => {
      if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    });

    // Paste handling
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

      if (pastedData.length === 6) {
        otpInputs.forEach((inp, i) => {
          inp.value = pastedData[i] || '';
        });
        otpInputs[5].focus();
      }
    });
  });
}

/**
 * Masquer l'email partiellement
 */
function maskEmail(email) {
  const [local, domain] = email.split('@');
  const maskedLocal = local.substring(0, 2) + '***' + local.substring(local.length - 1);
  return `${maskedLocal}@${domain}`;
}

/**
 * Afficher un message d'erreur
 */
function showError(message) {
  errorText.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
}

/**
 * Afficher un message de succès
 */
function showSuccess(message) {
  successText.textContent = message;
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
}

/**
 * Cacher tous les messages
 */
function hideMessages() {
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';
}
