import { getUserData } from '../utils/storage.js';
import { ROLES } from '../utils/access.js';

const linksByRole = {
  [ROLES.PATIENT]: [
    { href: 'dashboard-patient.html', label: 'Tableau de bord', icon: 'bi-person-lines-fill' }
  ],
  [ROLES.PROFESSIONAL]: [
    { href: 'dashboard-professional.html', label: 'Tableau de bord', icon: 'bi-person-badge' }
  ],
  [ROLES.ADMIN]: [
    { href: 'dashboard-admin.html', label: 'Administration', icon: 'bi-speedometer2' }
  ],
  [ROLES.INSTITUTION]: [
    { href: 'dashboard-institution.html', label: 'Institution', icon: 'bi-building' }
  ]
};

export function renderSidebar() {
  const user = getUserData() || { role: ROLES.PATIENT, name: 'Utilisateur' };
  const links = linksByRole[user.role] || linksByRole[ROLES.PATIENT];

  return `
    <div class="sidebar p-0">
      <div class="brand text-primary">Sika-Santé</div>
      <div class="px-3 mb-3 text-muted">${user.name || 'Bienvenue'}</div>
      <nav>
        ${links.map(link => `
          <a href="${link.href}" class="d-flex align-items-center">
            <i class="bi ${link.icon}"></i>
            <span>${link.label}</span>
          </a>
        `).join('')}
      </nav>
    </div>
  `;
}
