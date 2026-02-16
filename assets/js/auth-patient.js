/**
 * Authentication Patient - Sika-Santé
 * Gestion de la connexion patient via OTP/SMS
 */

// État de l'application
let appState = {
  otpRequestId: null,
  cmuNumber: null,
  otpAttempts: 0,
  maxAttempts: 5,
  otpExpirationTime: 5 * 60 * 1000, // 5 minutes
  resendCountdown: 60, // secondes
  resendInterval: null
};

// Éléments DOM
const requestOtpSection = document.getElementById('requestOtpSection');
const otpSection = document.getElementById('otpSection');
const requestOtpForm = document.getElementById('requestOtpForm');
const verifyOtpForm = document.getElementById('verifyOtpForm');
const cmuNumberInput = document.getElementById('cmuNumber');
const otpInputs = document.querySelectorAll('.otp-input');
const phoneDisplay = document.getElementById('phoneDisplay');
const requestOtpBtn = document.getElementById('requestOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const resendTimer = document.getElementById('resendTimer');
const backToCmuBtn = document.getElementById('backToCmuBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');

/**
 * Initialisation
 */
document.addEventListener('DOMContentLoaded', function() {
  // Gestion du formulaire de demande OTP
  requestOtpForm.addEventListener('submit', handleRequestOtp);

  // Gestion du formulaire de vérification OTP
  verifyOtpForm.addEventListener('submit', handleVerifyOtp);

  // Gestion des inputs OTP
  setupOtpInputs();

  // Bouton retour
  backToCmuBtn.addEventListener('click', backToCmu);

  // Bouton renvoi OTP
  resendOtpBtn.addEventListener('click', handleResendOtp);
});

/**
 * Demande d'OTP (Step 1)
 */
async function handleRequestOtp(e) {
  e.preventDefault();
  hideMessages();

  const cmuNumber = cmuNumberInput.value.trim();

  // Validation
  if (!/^\d{10}$/.test(cmuNumber)) {
    showError('Le numéro CMU doit contenir exactement 10 chiffres');
    return;
  }

  // Désactiver le bouton
  requestOtpBtn.disabled = true;
  requestOtpBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Envoi en cours...';

  try {
    // Simulation API call
    const response = await simulateRequestOtp(cmuNumber);

    if (response.success) {
      appState.otpRequestId = response.otpRequestId;
      appState.cmuNumber = cmuNumber;
      appState.otpAttempts = 0;

      // Masquer numéro de téléphone
      const maskedPhone = maskPhoneNumber(response.phoneNumber);
      phoneDisplay.textContent = maskedPhone;

      // Passer à l'étape OTP
      requestOtpSection.style.display = 'none';
      otpSection.style.display = 'block';

      // Démarrer le compte à rebours
      startResendCountdown();

      // Focus sur premier input
      otpInputs[0].focus();

    } else {
      showError(response.message || 'Erreur lors de l\'envoi du code');
    }
  } catch (error) {
    showError('Erreur de connexion. Veuillez réessayer.');
  } finally {
    requestOtpBtn.disabled = false;
    requestOtpBtn.innerHTML = '<i class="bi bi-phone me-2"></i>Recevoir un code par SMS';
  }
}

/**
 * Vérification OTP (Step 2)
 */
async function handleVerifyOtp(e) {
  e.preventDefault();
  hideMessages();

  // Récupérer le code OTP
  const otpCode = Array.from(otpInputs).map(input => input.value).join('');

  // Validation
  if (otpCode.length !== 6) {
    showError('Veuillez entrer le code complet à 6 chiffres');
    return;
  }

  // Vérifier tentatives
  if (appState.otpAttempts >= appState.maxAttempts) {
    showError('Trop de tentatives. Veuillez demander un nouveau code.');
    clearOtpInputs();
    return;
  }

  appState.otpAttempts++;

  // Désactiver le bouton
  verifyOtpBtn.disabled = true;
  verifyOtpBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Vérification...';

  try {
    // Simulation API call
    const response = await simulateVerifyOtp(appState.otpRequestId, otpCode);

    if (response.success) {
      // Stocker le token
      localStorage.setItem('sika_access_token', response.accessToken);
      localStorage.setItem('sika_user_role', 'PATIENT');
      localStorage.setItem('sika_user_data', JSON.stringify(response.userData));

      showSuccess('Connexion réussie ! Redirection en cours...');

      // Redirection vers le dashboard
      setTimeout(() => {
        window.location.href = 'dashboard-patient.html';
      }, 1500);

    } else {
      showError(response.message || 'Code incorrect ou expiré');
      clearOtpInputs();
      otpInputs[0].focus();

      // Afficher tentatives restantes
      const remaining = appState.maxAttempts - appState.otpAttempts;
      if (remaining > 0) {
        showError(`Code incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`);
      }
    }
  } catch (error) {
    showError('Erreur de vérification. Veuillez réessayer.');
    clearOtpInputs();
  } finally {
    verifyOtpBtn.disabled = false;
    verifyOtpBtn.innerHTML = '<i class="bi bi-shield-check me-2"></i>Vérifier le code';
  }
}

/**
 * Renvoyer l'OTP
 */
async function handleResendOtp() {
  hideMessages();

  resendOtpBtn.disabled = true;
  resendOtpBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Envoi...';

  try {
    const response = await simulateRequestOtp(appState.cmuNumber);

    if (response.success) {
      appState.otpRequestId = response.otpRequestId;
      appState.otpAttempts = 0;
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
 * Configuration des inputs OTP
 */
function setupOtpInputs() {
  otpInputs.forEach((input, index) => {
    // Auto-focus suivant
    input.addEventListener('input', function(e) {
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    // Gestion backspace
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    // Autoriser uniquement les chiffres
    input.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Paste handler
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
 * Retour au formulaire CMU
 */
function backToCmu() {
  otpSection.style.display = 'none';
  requestOtpSection.style.display = 'block';
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
  resendOtpBtn.disabled = true;

  appState.resendInterval = setInterval(() => {
    appState.resendCountdown--;
    resendTimer.textContent = `(${appState.resendCountdown}s)`;

    if (appState.resendCountdown <= 0) {
      clearInterval(appState.resendInterval);
      resendOtpBtn.disabled = false;
      resendTimer.textContent = '';
    }
  }, 1000);
}

/**
 * Utilitaires
 */
function clearOtpInputs() {
  otpInputs.forEach(input => input.value = '');
}

function maskPhoneNumber(phone) {
  return phone.replace(/(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '+225 $1 ** ** $5');
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
async function simulateRequestOtp(cmuNumber) {
  // Simuler délai réseau
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simuler base de données de patients
  const mockDatabase = {
    '1234567890': { name: 'KOUASSI Jean', phone: '0701234567' },
    '0987654321': { name: 'KONÉ Marie', phone: '0709876543' },
    '1111111111': { name: 'TRAORÉ Ibrahim', phone: '0701111111' }
  };

  if (mockDatabase[cmuNumber]) {
    // Générer un OTP (en réalité, envoyé par SMS)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[SIMULATION] OTP généré pour ${cmuNumber}: ${otp}`);

    // Stocker temporairement (en réalité, stocké côté serveur)
    sessionStorage.setItem('temp_otp', otp);
    sessionStorage.setItem('temp_otp_time', Date.now().toString());

    return {
      success: true,
      otpRequestId: `OTP-${Date.now()}`,
      phoneNumber: mockDatabase[cmuNumber].phone,
      message: 'Code envoyé avec succès'
    };
  } else {
    return {
      success: false,
      message: 'Numéro CMU non trouvé dans la base de données'
    };
  }
}

async function simulateVerifyOtp(otpRequestId, otpCode) {
  // Simuler délai réseau
  await new Promise(resolve => setTimeout(resolve, 1000));

  const storedOtp = sessionStorage.getItem('temp_otp');
  const storedTime = parseInt(sessionStorage.getItem('temp_otp_time'));

  // Vérifier expiration (5 minutes)
  if (Date.now() - storedTime > appState.otpExpirationTime) {
    return {
      success: false,
      message: 'Le code a expiré. Veuillez en demander un nouveau.'
    };
  }

  // Vérifier le code
  if (otpCode === storedOtp) {
    // Nettoyer
    sessionStorage.removeItem('temp_otp');
    sessionStorage.removeItem('temp_otp_time');

    return {
      success: true,
      accessToken: 'jwt_token_' + Date.now(),
      refreshToken: 'refresh_' + Date.now(),
      userData: {
        role: 'PATIENT',
        cmuNumber: appState.cmuNumber,
        name: 'Jean KOUASSI'
      }
    };
  } else {
    return {
      success: false,
      message: 'Code incorrect'
    };
  }
}
