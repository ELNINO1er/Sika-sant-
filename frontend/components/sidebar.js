import { getUserData } from '../utils/storage.js';
import { ROLES } from '../utils/access.js';

export const PATIENT_MENU_SECTIONS = [
  {
    title: 'Apercu',
    items: [
      { href: 'dashboard-patient.html', label: 'Apercu sante', icon: 'bi-grid-1x2', key: 'overview' },
      { href: 'patient-record.html', label: 'Dossier medical', icon: 'bi-journal-medical', key: 'record' }
    ]
  },
  {
    title: 'Suivi',
    items: [
      { href: 'patient-medications.html', label: 'Traitements', icon: 'bi-capsule-pill', key: 'medications' },
      { href: 'patient-appointments.html', label: 'Agenda', icon: 'bi-calendar-check', key: 'appointments' },
      { href: 'patient-history.html', label: 'Historique medical', icon: 'bi-clock-history', key: 'history' },
      { href: 'patient-vaccinations.html', label: 'Vaccinations', icon: 'bi-shield-plus', key: 'vaccinations' }
    ]
  },
  {
    title: 'Communication',
    items: [
      { href: 'patient-messages.html', label: 'Messages', icon: 'bi-chat-dots', key: 'messages', countKey: 'messages' },
      { href: 'patient-documents.html', label: 'Documents', icon: 'bi-file-earmark-medical', key: 'documents' }
    ]
  },
  {
    title: 'Compte',
    items: [
      { href: 'patient-profile.html', label: 'Profil', icon: 'bi-person', key: 'profile' },
      { href: 'patient-settings.html', label: 'Parametres', icon: 'bi-gear', key: 'settings' },
      { href: 'patient-help.html', label: 'Aide', icon: 'bi-question-circle', key: 'help' }
    ]
  }
];

const linksByRole = {
  [ROLES.PATIENT]: PATIENT_MENU_SECTIONS.flatMap((section) => section.items),
  [ROLES.PROFESSIONAL]: [
    { href: 'dashboard-professional.html#overview', label: 'Vue clinique', icon: 'bi-grid-1x2-fill' },
    { href: 'dashboard-professional.html#patients', label: 'Patients', icon: 'bi-people-fill' },
    { href: 'dashboard-professional.html#consultations', label: 'Consultations', icon: 'bi-journal-medical' }
  ],
  [ROLES.ADMIN]: [
    { href: 'dashboard-admin.html#overview', label: 'Supervision', icon: 'bi-speedometer2' },
    { href: 'dashboard-admin.html#users', label: 'Utilisateurs', icon: 'bi-person-lines-fill' },
    { href: 'dashboard-admin.html#audit', label: 'Audit', icon: 'bi-shield-check' }
  ],
  [ROLES.INSTITUTION]: [
    { href: 'dashboard-institution.html#overview', label: 'Vue globale', icon: 'bi-grid-1x2-fill' },
    { href: 'dashboard-institution.html#trends', label: 'Tendances', icon: 'bi-graph-up-arrow' },
    { href: 'dashboard-institution.html#alerts', label: 'Alertes', icon: 'bi-bell-fill' }
  ]
};

function isActiveLink(href) {
  const currentFile = window.location.pathname.split('/').pop();
  const currentHash = window.location.hash || '';
  const [targetFile, targetHash = ''] = href.split('#');

  if (currentFile !== targetFile) {
    return false;
  }

  if (!targetHash) {
    return currentHash === '';
  }

  if (!currentHash) {
    return targetHash === 'overview';
  }

  return currentHash === `#${targetHash}`;
}

function renderPatientSections(patientState) {
  const counts = {
    messages: patientState?.messages?.length || 0
  };

  return PATIENT_MENU_SECTIONS.map((section) => `
    <div class="patient-sidebar-group">
      <div class="patient-sidebar-group-title">${section.title}</div>
      <div class="patient-sidebar-group-links">
        ${section.items.map((item) => `
          <a href="${item.href}" class="${isActiveLink(item.href) ? 'active' : ''}">
            <i class="bi ${item.icon}"></i>
            <span>${item.label}</span>
            ${item.countKey && counts[item.countKey] ? `<span class="patient-sidebar-count">${counts[item.countKey]}</span>` : ''}
          </a>
        `).join('')}
      </div>
    </div>
  `).join('');
}

export function renderSidebar(options = {}) {
  const baseUser = getUserData() || { role: ROLES.PATIENT, name: 'Utilisateur' };
  const user = {
    ...baseUser,
    ...(options.user || {})
  };
  const patientState = options.patientState || null;
  const links = linksByRole[user.role] || linksByRole[ROLES.PATIENT];
  const isPatient = user.role === ROLES.PATIENT;

  if (isPatient) {
    const patientName = patientState?.profile?.name || user.name || 'Patient';
    const patientId = patientState?.profile?.cmuNumber || user.cmuNumber || 'Non renseigne';

    return `
      <aside class="sidebar patient-sidebar">
        <div class="patient-sidebar-top">
          <div class="brand">
            <img class="patient-sidebar-logo" src="../assets/img/sika-sante-mark.svg" alt="Logo Sika-Sante">
            <div class="brand-copy">
              <strong>Sika-Sante</strong>
              <small>Carnet medical electronique</small>
            </div>
          </div>

          <div class="patient-sidebar-user">
            <img class="patient-sidebar-avatar" src="../assets/img/Patient-web.jpg" alt="Photo du patient" loading="lazy" decoding="async">
            <div>
              <strong>${patientName}</strong>
              <small>CMU ${patientId}</small>
            </div>
          </div>
        </div>

        <nav class="patient-sidebar-nav">
          ${renderPatientSections(patientState)}
        </nav>
      </aside>
    `;
  }

  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-badge">
          <i class="bi bi-heart-pulse-fill"></i>
        </div>
        <div class="brand-copy">
          <strong>Sika-Sante</strong>
          <small>Carnet medical partage</small>
        </div>
      </div>

      <div class="sidebar-user">
        <div class="small-label">Espace</div>
        <strong>${user.name || 'Utilisateur'}</strong>
        <div class="text-muted">${user.role}</div>
      </div>

      <nav>
        ${links.map(link => `
          <a href="${link.href}" class="${isActiveLink(link.href) ? 'active' : ''}">
            <i class="bi ${link.icon}"></i>
            <span>${link.label}</span>
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-note">
        <div class="small-label mb-2">Promesse produit</div>
        <strong>Une seule lecture du parcours</strong>
        <p class="text-muted mb-0 mt-2">Patient, soignant et institution lisent la meme information utile au bon niveau.</p>
      </div>
    </aside>
  `;
}
