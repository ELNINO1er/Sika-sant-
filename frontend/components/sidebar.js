import { getUserData } from '../utils/storage.js';
import { ROLES } from '../utils/access.js';

const linksByRole = {
  [ROLES.PATIENT]: [
    { href: 'dashboard-patient.html', label: 'Apercu sante', icon: 'bi-grid-1x2-fill' },
    { href: '#', label: 'Recherche', icon: 'bi-search', action: 'search' },
    { href: 'patient-messages.html', label: 'Messages', icon: 'bi-chat-left-text' },
    { href: 'patient-documents.html', label: 'Documents', icon: 'bi-file-earmark-medical' },
    { href: 'patient-profile.html', label: 'Profil', icon: 'bi-person-badge' },
    { href: 'patient-medications.html', label: 'Traitements', icon: 'bi-capsule-pill' },
    { href: 'patient-appointments.html', label: 'Agenda', icon: 'bi-calendar-event' },
    { href: 'patient-history.html', label: 'Dossier medical', icon: 'bi-clock-history' },
  ],
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

export function renderSidebar() {
  const user = getUserData() || { role: ROLES.PATIENT, name: 'Utilisateur' };
  const links = linksByRole[user.role] || linksByRole[ROLES.PATIENT];
  const isPatient = user.role === ROLES.PATIENT;

  if (isPatient) {
    return `
      <aside class="sidebar patient-sidebar">
        <div class="brand">
          <img class="patient-sidebar-logo" src="../assets/img/sika-sante-mark.svg" alt="Logo Sika-Sante">
          <div class="brand-copy">
            <strong>Sika-Sante</strong>
          </div>
        </div>

        <nav class="patient-sidebar-nav">
          ${links.map(link => `
            <a href="${link.href}" class="${isActiveLink(link.href) ? 'active' : ''}" ${link.action ? `data-patient-action="${link.action}"` : ''}>
              <i class="bi ${link.icon}"></i>
              <span>${link.label}</span>
            </a>
          `).join('')}
        </nav>

        <div class="patient-sidebar-footer">
          <a href="#" data-patient-action="settings">
            <i class="bi bi-gear"></i>
            <span>Parametres</span>
          </a>
          <a href="#" data-patient-action="help">
            <i class="bi bi-question-circle"></i>
            <span>Aide</span>
          </a>
        </div>
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
