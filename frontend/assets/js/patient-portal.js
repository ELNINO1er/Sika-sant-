import { renderNavbar, bindNavbarActions } from '../../components/navbar.js';
import { renderSidebar } from '../../components/sidebar.js';
import { renderDataTable } from '../../components/data-table.js';
import { loadUserProfile } from '../../services/auth.js';
import { authGuard, roleGuard } from '../../utils/guards.js';
import { ROLES } from '../../utils/access.js';
import {
  formatDate,
  formatDateTime,
  getRoleLabel,
  showToast,
  toggleDarkMode
} from '../../utils/helpers.js';
import { getDarkMode } from '../../utils/storage.js';

function byNewest(a, b) {
  return new Date(b.created_at) - new Date(a.created_at);
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function getInitials(name) {
  return (name || 'Patient')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function detectDocumentKind(entry) {
  const combined = `${entry.title || ''} ${entry.summary || ''}`.toLowerCase();
  if (/prescri|ordon/.test(combined)) return 'Ordonnance';
  if (/analyse|resultat|biologie/.test(combined)) return 'Resultat';
  if (/imager|radio|scanner|irm/.test(combined)) return 'Imagerie';
  return 'Compte rendu';
}

function detectMedicationStatus(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  return diffDays <= 45 ? 'Actif' : 'Termine';
}

function extractConditions(history) {
  const text = history.map((item) => `${item.title || ''} ${item.summary || ''}`.toLowerCase()).join(' ');
  const conditions = [];

  if (/cardio|tension|hypertension/.test(text)) conditions.push('Suivi cardiovasculaire');
  if (/diab|glyc/.test(text)) conditions.push('Suivi glycemique');
  if (/asthm|respir/.test(text)) conditions.push('Suivi respiratoire');
  if (/allerg/.test(text)) conditions.push('Allergies a verifier');

  return conditions;
}

function buildTreatments(history) {
  const items = [];

  history.forEach((entry) => {
    const combined = `${entry.title || ''} ${entry.summary || ''}`.toLowerCase();
    if (!/trait|prescri|ordon|maintenu|cardio|suivi/.test(combined)) {
      return;
    }

    let label = 'Traitement a verifier';
    let dosage = 'Selon la prescription du soignant';

    if (/cardio|tension/.test(combined)) {
      label = 'Suivi cardiologique';
      dosage = 'Controle regulier et observance quotidienne';
    } else if (/prescri|ordon/.test(combined)) {
      label = 'Prescription recente';
      dosage = 'Posologie detaillee dans l ordonnance';
    } else if (/maintenu/.test(combined)) {
      label = 'Traitement maintenu';
      dosage = 'Poursuite selon les recommandations';
    } else if (/suivi/.test(combined)) {
      label = 'Suivi therapeutique';
    }

    items.push({
      id: `${entry.id}-treatment`,
      label,
      source: entry.title || 'Consultation',
      detail: entry.summary || 'Information synchronisee depuis le dossier',
      dosage,
      created_at: entry.created_at,
      status: detectMedicationStatus(entry.created_at)
    });
  });

  const unique = [];
  const seen = new Set();

  items.forEach((item) => {
    const key = `${item.label}-${item.source}`;
    if (!seen.has(key) && unique.length < 6) {
      seen.add(key);
      unique.push(item);
    }
  });

  return unique;
}

function buildDocuments(history) {
  return history.slice(0, 6).map((entry, index) => ({
    id: index + 1,
    title: `${detectDocumentKind(entry)} - ${entry.title || 'Consultation'}`,
    description: entry.professionalName || 'Professionnel non renseigne',
    date: entry.created_at,
    kind: detectDocumentKind(entry),
    size: `${320 + index * 24} Ko`,
    downloadable: true
  }));
}

function buildNotifications(history, treatments, documents) {
  const items = [];
  const latest = history[0];

  if (latest) {
    items.push({
      id: 'latest-report',
      icon: 'bi-file-earmark-medical',
      title: 'Dernier compte rendu disponible',
      text: `${latest.title || 'Consultation'} du ${formatDateTime(latest.created_at)}`
    });
  }

  if (treatments.length > 0) {
    items.push({
      id: 'treatment-follow',
      icon: 'bi-capsule-pill',
      title: 'Traitement a suivre',
      text: `${treatments.length} element(s) therapeutiques sont visibles dans votre espace.`
    });
  }

  items.push({
    id: 'appointment-plan',
    icon: 'bi-calendar-event',
    title: 'Rendez-vous a planifier',
    text: 'Aucun rendez-vous futur n est encore synchronise dans votre espace.'
  });

  if (documents.length > 0) {
    items.push({
      id: 'documents-ready',
      icon: 'bi-folder2-open',
      title: 'Documents synchronises',
      text: `${documents.length} document(s) consultables depuis vos consultations recentes.`
    });
  }

  return items.slice(0, 5);
}

function buildMessages(history, documents) {
  const messages = history.slice(0, 4).map((entry, index) => ({
    id: `message-${entry.id}`,
    sender: entry.professionalName || 'Centre de sante',
    subject: entry.title || 'Suivi medical',
    preview: entry.summary || 'Un message d information est disponible dans votre parcours.',
    date: entry.created_at,
    attachment: index === 0 && documents[0] ? documents[0].title : ''
  }));

  if (!messages.length) {
    messages.push({
      id: 'message-empty',
      sender: 'Sika-Sante',
      subject: 'Bienvenue dans votre espace patient',
      preview: 'Vos echanges et informations utiles apparaitront ici.',
      date: new Date().toISOString(),
      attachment: ''
    });
  }

  return messages;
}

function buildAppointments(history) {
  const past = history.slice(0, 8).map((entry) => ({
    id: `appointment-${entry.id}`,
    title: entry.title || 'Consultation',
    professional: entry.professionalName || 'Professionnel non renseigne',
    date: entry.created_at,
    place: 'Centre de sante de reference',
    status: 'Realise',
    summary: entry.summary || 'Suivi clinique enregistre dans le dossier.'
  }));

  const upcoming = [];
  if (history[0]) {
    upcoming.push({
      id: 'planned-follow-up',
      title: 'Controle de suivi',
      professional: history[0].professionalName || 'Professionnel a confirmer',
      date: '',
      place: 'A confirmer avec l etablissement',
      status: 'A planifier',
      summary: 'Demandez un nouveau rendez-vous pour poursuivre votre suivi.'
    });
  }

  return { upcoming, past };
}

function buildSummaryItems(profile, latestHistory, history, conditions, treatments) {
  return [
    { label: 'Groupe sanguin', value: 'Non renseigne' },
    { label: 'Allergies', value: conditions.includes('Allergies a verifier') ? 'A verifier' : 'Non renseigne' },
    {
      label: 'Maladies chroniques',
      value: conditions.filter((item) => item !== 'Allergies a verifier').join(', ') || 'Non renseigne'
    },
    {
      label: 'Antecedents importants',
      value: history.slice(0, 2).map((item) => item.title || 'Consultation').join(', ') || 'Non renseigne'
    },
    { label: 'Traitements en cours', value: treatments.length ? `${treatments.length} suivi(s)` : 'Aucun synchronise' },
    { label: 'Derniere consultation', value: latestHistory ? formatDate(latestHistory.created_at) : 'Aucune' },
    { label: 'Prochain rendez-vous', value: 'A planifier' },
    { label: 'Identifiant patient', value: profile.cmuNumber || 'Non renseigne' }
  ];
}

function buildProfileSections(profile, conditions) {
  return {
    personal: [
      ['Nom complet', profile.name || 'Non renseigne'],
      ['Sexe', 'Non renseigne'],
      ['Date de naissance', 'Non renseignee'],
      ['Photo de profil', 'Disponible sur demande']
    ],
    contact: [
      ['Telephone', profile.phone || 'A completer'],
      ['Email', profile.email || 'A completer'],
      ['Adresse', 'A completer'],
      ['Ville', 'Non renseignee']
    ],
    identifiers: [
      ['Numero CMU', profile.cmuNumber || 'Non renseigne'],
      ['Identifiant patient', profile.cmuNumber || 'Non renseigne'],
      ['Couverture', 'CMU a verifier'],
      ['Role', getRoleLabel(profile.role || ROLES.PATIENT)]
    ],
    emergency: [
      ['Contact urgence', 'A completer'],
      ['Telephone urgence', 'A completer'],
      ['Lien', 'Non renseigne'],
      ['Allergies signalees', conditions.includes('Allergies a verifier') ? 'A verifier' : 'Non renseigne']
    ]
  };
}

function createPatientState(profile) {
  const history = (profile.recentHistory || []).slice().sort(byNewest);
  const latestHistory = history[0] || null;
  const conditions = extractConditions(history);
  const treatments = buildTreatments(history);
  const documents = buildDocuments(history);
  const notifications = buildNotifications(history, treatments, documents);
  const messages = buildMessages(history, documents);
  const appointments = buildAppointments(history);
  const summaryItems = buildSummaryItems(profile, latestHistory, history, conditions, treatments);
  const profileSections = buildProfileSections(profile, conditions);

  return {
    profile,
    history,
    latestHistory,
    conditions,
    treatments,
    documents,
    notifications,
    messages,
    appointments,
    summaryItems,
    profileSections,
    metrics: {
      treatments: treatments.filter((item) => item.status === 'Actif').length,
      documents: documents.length,
      messages: messages.length,
      consultations: history.length
    }
  };
}

export async function initializePatientPage({
  pageTitle,
  heroTitle,
  heroDescription,
  heroBadge,
  heroStats = [],
  showNavbar = true
}) {
  await authGuard();
  roleGuard(ROLES.PATIENT);

  const sidebar = document.getElementById('appSidebar');
  const navbar = document.getElementById('appNavbar');

  if (sidebar) sidebar.innerHTML = renderSidebar();
  if (showNavbar && navbar) {
    navbar.innerHTML = renderNavbar();
    bindNavbarActions();
  } else if (navbar) {
    navbar.innerHTML = '';
  }
  toggleDarkMode(getDarkMode());

  const profile = await loadUserProfile();
  const state = createPatientState(profile);

  if (pageTitle) {
    document.title = `${pageTitle} | Sika-Sante`;
  }

  const heroContainer = document.getElementById('patientPageHero');
  if (heroContainer) {
    const stats = typeof heroStats === 'function' ? heroStats(state) : heroStats;
    heroContainer.innerHTML = createHeroMarkup(state, {
      badge: heroBadge,
      title: heroTitle,
      description: heroDescription,
      stats
    });
  }

  return state;
}

export function createHeroMarkup(state, { badge, title, description, stats = [] }) {
  const heroStats = stats.length ? createMetricCardsMarkup(stats) : '';

  return `
    <section class="card-surface patient-welcome-card">
      <div class="patient-welcome-header">
        <div>
          <span class="saas-badge"><i class="bi bi-heart-pulse"></i>${escapeHtml(badge || 'Espace patient')}</span>
          <h2>${escapeHtml(title || 'Mon espace patient')}</h2>
          <p>${escapeHtml(description || 'Consultez votre dossier, suivez vos soins et interagissez avec votre etablissement.')}</p>
        </div>

        <div class="patient-account-pill">
          <div class="patient-avatar">${escapeHtml(getInitials(state.profile.name))}</div>
          <div>
            <strong>${escapeHtml(state.profile.name || 'Patient')}</strong>
            <div class="text-muted">CMU ${escapeHtml(state.profile.cmuNumber || '-')}</div>
          </div>
        </div>
      </div>

      ${heroStats}
    </section>
  `;
}

export function createMetricCardsMarkup(items) {
  return `
    <div class="patient-kpi-row">
      ${items.map((item) => `
        <article class="patient-kpi-card">
          <span class="small-label">${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `).join('')}
    </div>
  `;
}

export function createListCardMarkup(items, config = {}) {
  const {
    emptyTitle = 'Aucune donnee',
    emptyDescription = 'Les informations apparaitront ici lorsqu elles seront disponibles.',
    itemClass = 'patient-list-item',
    itemRenderer
  } = config;

  if (!items.length) {
    return `
      <div class="patient-empty-card">
        <strong>${escapeHtml(emptyTitle)}</strong>
        <p>${escapeHtml(emptyDescription)}</p>
      </div>
    `;
  }

  return items.map((item) => itemRenderer(item, itemClass)).join('');
}

export function renderTreatmentList(container, items, { limit, emptyTitle, emptyDescription, allowRefill = false } = {}) {
  if (!container) return;
  const rows = typeof limit === 'number' ? items.slice(0, limit) : items;

  container.innerHTML = createListCardMarkup(rows, {
    emptyTitle: emptyTitle || 'Aucun traitement',
    emptyDescription: emptyDescription || 'Les traitements synchronises apparaitront ici.',
    itemRenderer: (item, itemClass) => `
      <div class="${itemClass}">
        <div class="patient-list-item-head">
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <div class="text-muted">${escapeHtml(item.source)}</div>
          </div>
          <span class="status-badge ${item.status === 'Actif' ? 'success' : 'warning'}">${escapeHtml(item.status)}</span>
        </div>
        <p>${escapeHtml(item.detail)}</p>
        <div class="patient-meta-row">
          <span>${escapeHtml(item.dosage)}</span>
          <span>${escapeHtml(formatDate(item.created_at))}</span>
        </div>
        ${allowRefill ? `
          <div class="patient-inline-actions">
            <button type="button" class="btn btn-outline-primary btn-sm" data-patient-action="refill">Demander un renouvellement</button>
          </div>
        ` : ''}
      </div>
    `
  });
}

export function renderMessageList(container, items, { limit, emptyTitle, emptyDescription } = {}) {
  if (!container) return;
  const rows = typeof limit === 'number' ? items.slice(0, limit) : items;

  container.innerHTML = createListCardMarkup(rows, {
    emptyTitle: emptyTitle || 'Aucun message',
    emptyDescription: emptyDescription || 'Les messages utiles apparaitront ici.',
    itemRenderer: (item, itemClass) => `
      <div class="${itemClass} patient-message-item">
        <div class="patient-message-icon"><i class="bi bi-chat-left-text"></i></div>
        <div>
          <strong>${escapeHtml(item.sender)}</strong>
          <div class="patient-message-subject">${escapeHtml(item.subject)}</div>
          <p>${escapeHtml(item.preview)}</p>
          <div class="patient-meta-row">
            <span>${escapeHtml(formatDateTime(item.date))}</span>
            ${item.attachment ? `<span class="patient-attachment-chip"><i class="bi bi-paperclip"></i>${escapeHtml(item.attachment)}</span>` : ''}
          </div>
        </div>
      </div>
    `
  });
}

export function renderDocumentList(container, items, { limit, emptyTitle, emptyDescription } = {}) {
  if (!container) return;
  const rows = typeof limit === 'number' ? items.slice(0, limit) : items;

  container.innerHTML = createListCardMarkup(rows, {
    emptyTitle: emptyTitle || 'Aucun document',
    emptyDescription: emptyDescription || 'Les documents publies par le centre apparaitront ici.',
    itemRenderer: (item, itemClass) => `
      <div class="${itemClass} patient-document-item">
        <div class="patient-document-main">
          <span class="patient-document-kind">${escapeHtml(item.kind)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <div class="text-muted">${escapeHtml(item.description)}</div>
          <small>${escapeHtml(formatDate(item.date))} - ${escapeHtml(item.size)}</small>
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm" data-patient-action="download">Telecharger</button>
      </div>
    `
  });
}

export function renderSummaryGrid(container, items) {
  if (!container) return;
  container.innerHTML = items.map((item) => `
    <div class="patient-summary-item">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join('');
}

export function renderProfileGrid(container, items) {
  if (!container) return;
  container.innerHTML = items.map(([label, value]) => `
    <div class="patient-profile-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');
}

export function renderAppointmentBlocks(container, items, { emptyTitle, emptyDescription, allowManage = false } = {}) {
  if (!container) return;

  container.innerHTML = createListCardMarkup(items, {
    emptyTitle: emptyTitle || 'Aucun rendez-vous',
    emptyDescription: emptyDescription || 'Aucun rendez-vous n est synchronise pour le moment.',
    itemRenderer: (item, itemClass) => `
      <div class="${itemClass}">
        <div class="patient-list-item-head">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <div class="text-muted">${escapeHtml(item.professional)}</div>
          </div>
          <span class="status-badge ${item.status === 'Realise' ? 'success' : 'warning'}">${escapeHtml(item.status)}</span>
        </div>
        <p>${escapeHtml(item.summary)}</p>
        <div class="patient-meta-row">
          <span>${item.date ? escapeHtml(formatDateTime(item.date)) : 'Date a confirmer'}</span>
          <span>${escapeHtml(item.place)}</span>
        </div>
        ${allowManage ? `
          <div class="patient-inline-actions">
            <button type="button" class="btn btn-outline-primary btn-sm" data-patient-action="appointment">Gerer le rendez-vous</button>
          </div>
        ` : ''}
      </div>
    `
  });
}

export function renderHistoryTableWithDetails({ tableContainer, detailContainer, history }) {
  if (!tableContainer || !detailContainer) return;

  const rows = history || [];
  let selected = rows[0] || null;

  function renderDetails(item) {
    if (!item) {
      detailContainer.innerHTML = `
        <div class="patient-empty-card">
          <strong>Aucun detail disponible</strong>
          <p>S&eacute;lectionnez une consultation pour lire le resume detaille.</p>
        </div>
      `;
      return;
    }

    detailContainer.innerHTML = `
      <div class="patient-detail-card">
        <div class="patient-list-item-head">
          <div>
            <span class="small-label">Consultation selectionnee</span>
            <strong>${escapeHtml(item.title || 'Consultation')}</strong>
          </div>
          <span class="status-badge success">${escapeHtml(formatDate(item.created_at))}</span>
        </div>
        <div class="patient-detail-list">
          <div class="patient-profile-item">
            <span>Professionnel</span>
            <strong>${escapeHtml(item.professionalName || 'Non renseigne')}</strong>
          </div>
          <div class="patient-profile-item">
            <span>Date</span>
            <strong>${escapeHtml(formatDateTime(item.created_at))}</strong>
          </div>
          <div class="patient-profile-item">
            <span>Resume</span>
            <strong>${escapeHtml(item.summary || 'Aucun resume disponible')}</strong>
          </div>
          <div class="patient-profile-item">
            <span>Diagnostic</span>
            <strong>A completer par le centre</strong>
          </div>
          <div class="patient-profile-item">
            <span>Traitement prescrit</span>
            <strong>Visible depuis la page Traitements</strong>
          </div>
          <div class="patient-profile-item">
            <span>Recommandations</span>
            <strong>Suivre les instructions du soignant et conserver les documents associes.</strong>
          </div>
        </div>
      </div>
    `;
  }

  renderDataTable(tableContainer, {
    columns: [
      { label: 'Date', render: (row) => formatDateTime(row.created_at) },
      { label: 'Professionnel', render: (row) => escapeHtml(row.professionalName || 'Non renseigne') },
      { label: 'Resume', render: (row) => escapeHtml(row.title || 'Consultation') },
      {
        label: 'Action',
        render: (row) => `<button type="button" class="btn btn-sm btn-outline-primary" data-history-id="${row.id}">Voir details</button>`
      }
    ],
    rows,
    emptyTitle: 'Aucun historique medical',
    emptyDescription: 'Les consultations synchronisees apparaitront ici.'
  });

  renderDetails(selected);

  tableContainer.querySelectorAll('[data-history-id]').forEach((button) => {
    button.addEventListener('click', () => {
      selected = rows.find((row) => String(row.id) === button.dataset.historyId) || null;
      renderDetails(selected);
    });
  });
}

export function bindPatientActionButtons(root = document) {
  const messages = {
    appointment: 'La demande de rendez-vous sera reliee au planning du centre dans la prochaine iteration.',
    refill: 'La demande de renouvellement sera transmise a votre structure de sante.',
    download: 'Le telechargement sera active une fois les documents relies au stockage final.',
    upload: 'Le depot de document personnel sera disponible dans la prochaine version.',
    profile: 'La mise a jour du profil personnel sera ouverte avec un formulaire dedie.',
    message: 'La messagerie securisee patient-soignant sera bientot disponible.',
    settings: 'Le centre de preferences sera ajoute dans la prochaine iteration.',
    help: 'L aide contextuelle patient sera bientot disponible.'
  };

  root.querySelectorAll('[data-patient-action]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const action = button.dataset.patientAction;
      showToast(messages[action] || 'Fonction bientot disponible.', 'primary');
    });
  });
}
