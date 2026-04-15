import {
  requestOtp,
  verifyOtp,
  loginProfessional,
  loginAdmin,
  loginInstitution,
  resendMfa,
  verifyMfa
} from '../../services/auth.js';
import { setAccessToken, setRefreshToken, setUserData } from '../../utils/storage.js';
import { setAlertMessage, showToast } from '../../utils/helpers.js';

const profiles = {
  patient: {
    badgeIcon: 'bi-person-heart',
    badgeText: 'Connexion patient',
    title: 'Accedez a votre espace patient',
    description: "Entrez votre numero CMU puis votre code OTP.",
    stageTitle: 'Identification patient',
    stageText: '',
    dashboard: 'dashboard-patient.html'
  },
  professional: {
    badgeIcon: 'bi-stethoscope',
    badgeText: 'Connexion professionnel',
    title: 'Connectez-vous a votre espace clinique',
    description: "Entrez votre email professionnel puis votre code MFA.",
    stageTitle: 'Connexion professionnelle',
    stageText: '',
    dashboard: 'dashboard-professional.html'
  },
  admin: {
    badgeIcon: 'bi-shield-lock',
    badgeText: 'Connexion admin',
    title: "Connectez-vous a l'espace admin",
    description: "Entrez votre email admin puis votre code MFA.",
    stageTitle: 'Connexion administrateur',
    stageText: '',
    dashboard: 'dashboard-admin.html'
  },
  institution: {
    badgeIcon: 'bi-bank',
    badgeText: 'Connexion institution',
    title: "Connectez-vous a l'espace institution",
    description: "Entrez l'identifiant de votre structure puis votre code MFA.",
    stageTitle: 'Connexion institutionnelle',
    stageText: '',
    dashboard: 'dashboard-institution.html'
  }
};

const state = {
  activeProfile: 'patient',
  phase: 'primary',
  requestId: null,
  mfaContact: '',
  loginLabel: ''
};

const elements = {
  badge: document.getElementById('selectorBadge'),
  title: document.getElementById('selectorTitle'),
  description: document.getElementById('selectorDescription'),
  stage: document.getElementById('selectorStage'),
  mount: document.getElementById('selectorFormMount'),
  message: document.getElementById('selectorMessage'),
  cards: Array.from(document.querySelectorAll('.auth-role-card'))
};

function resetStateForProfile(profile) {
  state.activeProfile = profile;
  state.phase = 'primary';
  state.requestId = null;
  state.mfaContact = '';
  state.loginLabel = '';
  setAlertMessage(elements.message, '');
}

function updateContent() {
  const profile = profiles[state.activeProfile];
  elements.badge.innerHTML = `<i class="bi ${profile.badgeIcon}"></i>${profile.badgeText}`;
  elements.title.textContent = profile.title;
  elements.description.textContent = profile.description;
  elements.stage.innerHTML = profile.stageText
    ? `<strong>${profile.stageTitle}</strong><div class="text-muted">${profile.stageText}</div>`
    : `<strong>${profile.stageTitle}</strong>`;

  elements.cards.forEach(card => {
    card.classList.toggle('is-active', card.dataset.profile === state.activeProfile);
  });
}

function setPending(button, label) {
  button.disabled = true;
  button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${label}`;
}

function resetButton(button, label) {
  button.disabled = false;
  button.textContent = label;
}

function finalizeAuth(response, redirectTo) {
  setAccessToken(response.data.accessToken);
  setRefreshToken(response.data.refreshToken);
  setUserData(response.data.userData);
  window.location.href = redirectTo;
}

function primaryFormMarkup(profileKey) {
  if (profileKey === 'patient') {
    return `
      <form id="primaryAuthForm" class="auth-selector-form-body">
        <div>
          <label for="cmuNumber" class="form-label">Numero CMU</label>
          <input type="text" class="form-control" id="cmuNumber" placeholder="1234567890" maxlength="10" pattern="[0-9]{10}" required>
          <div class="form-text">Entrez les 10 chiffres de votre identifiant patient.</div>
        </div>
        <div class="auth-selector-form-actions">
          <button type="submit" id="primarySubmitButton" class="btn btn-primary">Recevoir un code OTP</button>
        </div>
      </form>
    `;
  }

  if (profileKey === 'institution') {
    return `
      <form id="primaryAuthForm" class="auth-selector-form-body">
        <div>
          <label for="institutionId" class="form-label">Identifiant institutionnel</label>
          <input type="text" class="form-control" id="institutionId" placeholder="GOV-CNAM-3001" required>
        </div>
        <div>
          <label for="password" class="form-label">Mot de passe</label>
          <input type="password" class="form-control" id="password" placeholder="Minimum 12 caracteres" minlength="12" required>
        </div>
        <div class="auth-selector-form-actions">
          <button type="submit" id="primarySubmitButton" class="btn btn-primary">Demander le code MFA</button>
        </div>
      </form>
    `;
  }

  const emailLabel = profileKey === 'admin' ? 'Email admin' : 'Email professionnel';
  const emailPlaceholder = profileKey === 'admin' ? 'admin@sika-sante.ci' : 'medecin@structure.ci';

  return `
    <form id="primaryAuthForm" class="auth-selector-form-body">
      <div>
        <label for="email" class="form-label">${emailLabel}</label>
        <input type="email" class="form-control" id="email" placeholder="${emailPlaceholder}" required>
      </div>
      <div>
        <label for="password" class="form-label">Mot de passe</label>
        <input type="password" class="form-control" id="password" placeholder="Minimum 12 caracteres" minlength="12" required>
      </div>
      <div class="auth-selector-form-actions">
        <button type="submit" id="primarySubmitButton" class="btn btn-primary">Demander le code MFA</button>
      </div>
    </form>
  `;
}

function verificationFormMarkup(profileKey) {
  if (profileKey === 'patient') {
    return `
      <form id="verifyAuthForm" class="auth-selector-form-body">
        <div>
          <label for="otpCode" class="form-label">Code OTP</label>
          <input type="text" class="form-control" id="otpCode" placeholder="000000" maxlength="6" required>
          <div class="form-text">Le code a ete envoye a votre contact masque.</div>
        </div>
        <div class="auth-selector-form-actions">
          <button type="submit" id="verifySubmitButton" class="btn btn-primary">Verifier et acceder au carnet</button>
          <button type="button" id="backToPrimaryButton" class="btn btn-outline-secondary">Modifier le numero CMU</button>
        </div>
      </form>
    `;
  }

  return `
    <form id="verifyAuthForm" class="auth-selector-form-body">
      <div>
        <label for="mfaCode" class="form-label">Code MFA</label>
        <input type="text" class="form-control" id="mfaCode" placeholder="000000" maxlength="6" required>
        <div class="form-text">Code envoye vers ${state.mfaContact || 'votre contact de verification'}.</div>
      </div>
      <div class="auth-selector-form-actions">
        <button type="submit" id="verifySubmitButton" class="btn btn-primary">Valider et acceder</button>
        <button type="button" id="resendCodeButton" class="btn btn-outline-secondary">Renvoyer le code</button>
      </div>
    </form>
  `;
}

function renderForm() {
  elements.mount.innerHTML = state.phase === 'primary'
    ? primaryFormMarkup(state.activeProfile)
    : verificationFormMarkup(state.activeProfile);

  if (state.phase === 'primary') {
    bindPrimarySubmit();
    return;
  }

  bindVerificationSubmit();
}

async function handlePrimarySubmit() {
  const profile = state.activeProfile;

  if (profile === 'patient') {
    const cmuNumber = document.getElementById('cmuNumber').value.trim();
    const response = await requestOtp(cmuNumber);
    state.requestId = response.data.otpRequestId;
    state.phase = 'verify';
    setAlertMessage(elements.message, `Code envoye au contact masque ${response.data.phoneNumber}.`, 'success');
    renderForm();
    return;
  }

  let response;
  if (profile === 'professional') {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    response = await loginProfessional(email, password);
  } else if (profile === 'admin') {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    response = await loginAdmin(email, password);
  } else {
    const institutionId = document.getElementById('institutionId').value.trim();
    const password = document.getElementById('password').value.trim();
    response = await loginInstitution(institutionId, password);
  }

  state.requestId = response.data.mfaRequestId;
  state.mfaContact = response.data.mfaContact;
  state.phase = 'verify';
  setAlertMessage(elements.message, `Code envoye vers ${response.data.mfaContact}.`, 'success');
  renderForm();
}

async function handleVerificationSubmit() {
  const profile = profiles[state.activeProfile];

  if (state.activeProfile === 'patient') {
    const otpCode = document.getElementById('otpCode').value.trim();
    const response = await verifyOtp(state.requestId, otpCode);
    finalizeAuth(response, profile.dashboard);
    return;
  }

  const mfaCode = document.getElementById('mfaCode').value.trim();
  const response = await verifyMfa(state.requestId, mfaCode);
  finalizeAuth(response, profile.dashboard);
}

function bindPrimarySubmit() {
  const form = document.getElementById('primaryAuthForm');
  const button = document.getElementById('primarySubmitButton');
  const idleLabel = button.textContent;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setPending(button, 'Verification...');
    setAlertMessage(elements.message, '');

    try {
      await handlePrimarySubmit();
    } catch (error) {
      setAlertMessage(elements.message, error.message, 'danger');
    } finally {
      if (document.body.contains(button)) {
        resetButton(button, idleLabel);
      }
    }
  });
}

function bindVerificationSubmit() {
  const form = document.getElementById('verifyAuthForm');
  const button = document.getElementById('verifySubmitButton');
  const idleLabel = button.textContent;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setPending(button, 'Connexion...');
    setAlertMessage(elements.message, '');

    try {
      await handleVerificationSubmit();
    } catch (error) {
      setAlertMessage(elements.message, error.message, 'danger');
    } finally {
      if (document.body.contains(button)) {
        resetButton(button, idleLabel);
      }
    }
  });

  const backButton = document.getElementById('backToPrimaryButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      state.phase = 'primary';
      state.requestId = null;
      setAlertMessage(elements.message, '');
      renderForm();
    });
  }

  const resendButton = document.getElementById('resendCodeButton');
  if (resendButton) {
    resendButton.addEventListener('click', async () => {
      try {
        const response = await resendMfa(state.requestId);
        state.requestId = response.data.mfaRequestId;
        state.mfaContact = response.data.mfaContact;
        setAlertMessage(elements.message, `Nouveau code envoye vers ${response.data.mfaContact}.`, 'success');
        renderForm();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  }
}

function activateProfile(profileKey) {
  resetStateForProfile(profileKey);
  updateContent();
  renderForm();
  window.history.replaceState({}, '', `#${profileKey}`);
}

elements.cards.forEach(card => {
  card.addEventListener('click', () => activateProfile(card.dataset.profile));
});

const initialProfile = window.location.hash.replace('#', '');
if (profiles[initialProfile]) {
  state.activeProfile = initialProfile;
}

updateContent();
renderForm();
