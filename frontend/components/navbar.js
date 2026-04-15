import { getUserData, getDarkMode, setDarkMode } from '../utils/storage.js';
import { logout } from '../services/auth.js';
import { toggleDarkMode, getRoleLabel } from '../utils/helpers.js';

function getTodayLabel() {
  return new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export function renderNavbar() {
  const user = getUserData() || { name: 'Utilisateur', role: 'PATIENT' };
  const darkMode = getDarkMode();
  const firstName = user.name?.split(' ')[0] || 'Utilisateur';

  return `
    <div class="topbar">
      <div>
        <span class="small-label">Session active</span>
        <h1 class="page-title">Bonjour, ${firstName}</h1>
        <p class="text-muted mb-0">${getRoleLabel(user.role)} - ${getTodayLabel()}</p>
      </div>
      <div class="toolbar">
        <div class="profile-pill">
          <i class="bi bi-person-circle"></i>
          <div>
            <strong>${user.name || 'Utilisateur'}</strong>
            <small class="text-muted">${getRoleLabel(user.role)}</small>
          </div>
        </div>
        <button id="darkModeToggle" class="btn btn-sm btn-outline-secondary" type="button">
          <i class="bi ${darkMode ? 'bi-moon-stars-fill' : 'bi-brightness-high-fill'}"></i>
          ${darkMode ? 'Mode sombre' : 'Mode clair'}
        </button>
        <button id="logoutButton" class="btn btn-sm btn-outline-secondary" type="button">
          <i class="bi bi-box-arrow-right"></i>
          Deconnexion
        </button>
      </div>
    </div>
  `;
}

export function bindNavbarActions() {
  const logoutButton = document.getElementById('logoutButton');
  const toggleButton = document.getElementById('darkModeToggle');

  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }

  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      const enabled = !getDarkMode();
      setDarkMode(enabled);
      toggleDarkMode(enabled);
      toggleButton.innerHTML = `<i class="bi ${enabled ? 'bi-moon-stars-fill' : 'bi-brightness-high-fill'}"></i> ${enabled ? 'Mode sombre' : 'Mode clair'}`;
    });
  }
}
