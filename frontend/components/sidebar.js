import { getUserData } from '../utils/storage.js';

const linksByRole = {
  PATIENT: [
    { href: 'dashboard-patient.html', label: 'Tableau de bord', icon: 'bi-person-lines-fill' },
    { href: '#history', label: 'Dossiers médicaux', icon: 'bi-journal-medical' },
    { href: '#appointments', label: 'Rendez-vous', icon: 'bi-calendar-check' }
  ],
  DOCTOR: [
    { href: 'dashboard-professional.html', label: 'Tableau de bord', icon: 'bi-person-badge' },
    { href: '#patients', label: 'Patients', icon: 'bi-people' },
    { href: '#consultations', label: 'Consultations', icon: 'bi-file-medical' }
  ],
  ADMIN: [
    { href: 'dashboard-admin.html', label: 'Tableau de bord', icon: 'bi-speedometer2' },
    { href: '#users', label: 'Utilisateurs', icon: 'bi-person-check' },
    { href: '#audit', label: 'Audit logs', icon: 'bi-shield-lock' }
  ]
};

export function renderSidebar() {
  const user = getUserData() || { role: 'PATIENT', name: 'Utilisateur' };
  const links = linksByRole[user.role] || linksByRole.PATIENT;

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
