import { ROLE_LABELS } from './access.js';

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export function ensureToastContainer() {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'primary') {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${type} border-0 show`;
  toast.role = 'alert';
  toast.ariaLive = 'assertive';
  toast.ariaAtomic = 'true';
  const wrapper = document.createElement('div');
  wrapper.className = 'd-flex';

  const body = document.createElement('div');
  body.className = 'toast-body';
  body.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'btn-close btn-close-white me-2 m-auto';
  closeButton.setAttribute('aria-label', 'Fermer');
  closeButton.addEventListener('click', () => toast.remove());

  wrapper.append(body, closeButton);
  toast.appendChild(wrapper);
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

export function setAlertMessage(target, message, type = 'success') {
  if (!target) return;
  if (!message) {
    target.className = 'alert d-none';
    target.textContent = '';
    return;
  }

  target.textContent = message;
  target.className = `alert alert-${type}`;
}

export function toggleDarkMode(enabled) {
  document.body.classList.toggle('dark', enabled);
  document.querySelectorAll('.card-surface').forEach(el => {
    el.classList.toggle('dark', enabled);
  });
}

export function createLoadingMarkup(label = 'Chargement...') {
  return `
    <div class="loading-state">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">${label}</span>
      </div>
      <p class="text-muted mb-0">${label}</p>
    </div>
  `;
}

export function createEmptyStateMarkup(title, description) {
  return `
    <div class="empty-state">
      <i class="bi bi-inbox fs-1 text-muted"></i>
      <h3 class="h6 mt-3">${title}</h3>
      <p class="text-muted mb-0">${description}</p>
    </div>
  `;
}

/**
 * Initialise tous les custom dropdowns (.pd-dropdown) de la page.
 * Synchronise le <select> caché pour compatibilité avec le JS existant.
 */
export function initCustomDropdowns() {
  document.querySelectorAll('.pd-dropdown').forEach(dd => {
    const trigger = dd.querySelector('.pd-dropdown-trigger');
    const menu = dd.querySelector('.pd-dropdown-menu');
    const hiddenSelect = dd.querySelector('select');
    const label = trigger.querySelector('span:first-child');
    const items = menu.querySelectorAll('.pd-dropdown-item');

    // Toggle
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close other dropdowns
      document.querySelectorAll('.pd-dropdown.open').forEach(other => {
        if (other !== dd) other.classList.remove('open');
      });
      dd.classList.toggle('open');
    });

    // Keyboard
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.click();
      }
      if (e.key === 'Escape') dd.classList.remove('open');
    });

    // Select item
    items.forEach(item => {
      item.addEventListener('click', () => {
        const value = item.dataset.value;
        // Update visual
        items.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        label.textContent = item.textContent.trim();
        dd.classList.remove('open');

        // Sync hidden select and fire change event
        if (hiddenSelect) {
          hiddenSelect.value = value;
          hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  });

  // Close all on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.pd-dropdown')) {
      document.querySelectorAll('.pd-dropdown.open').forEach(dd => dd.classList.remove('open'));
    }
  });
}
