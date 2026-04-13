import { getUserData, getDarkMode, setDarkMode } from '../utils/storage.js';
import { logout } from '../services/auth.js';
import { toggleDarkMode } from '../utils/helpers.js';

export function renderNavbar() {
  const user = getUserData() || { name: 'Utilisateur', role: 'PATIENT' };
  const darkMode = getDarkMode();

  return `
    <div class="topbar">
      <div>
        <h1 class="page-title">Bonjour, ${user.name.split(' ')[0] || 'Utilisateur'}</h1>
        <p class="text-muted mb-0">Rôle : ${user.role}</p>
      </div>
      <div class="toolbar align-items-center">
        <button id="darkModeToggle" class="btn btn-sm btn-outline-secondary" type="button">
          <i class="bi ${darkMode ? 'bi-moon-stars-fill' : 'bi-sun-fill'}"></i> ${darkMode ? 'Sombre' : 'Clair'}
        </button>
        <button id="logoutButton" class="btn btn-sm btn-outline-danger" type="button">
          <i class="bi bi-box-arrow-right"></i> Se déconnecter
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
      toggleButton.innerHTML = `<i class="bi ${enabled ? 'bi-moon-stars-fill' : 'bi-sun-fill'}"></i> ${enabled ? 'Sombre' : 'Clair'}`;
    });
  }
}
