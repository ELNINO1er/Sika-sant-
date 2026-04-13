export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export function createSpinner() {
  const wrapper = document.createElement('div');
  wrapper.className = 'spinner-overlay';
  wrapper.innerHTML = `
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Chargement...</span>
    </div>
  `;
  return wrapper;
}

export function showToast(message, type = 'primary') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${type} border-0 show`;
  toast.role = 'alert';
  toast.ariaLive = 'assertive';
  toast.ariaAtomic = 'true';
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Fermer"></button>
    </div>
  `;

  toast.querySelector('button').addEventListener('click', () => toast.remove());
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 5500);
}

export function toggleDarkMode(enabled) {
  document.body.classList.toggle('dark', enabled);
  if (enabled) {
    document.querySelectorAll('.card-surface').forEach(el => el.classList.add('dark'));
  } else {
    document.querySelectorAll('.card-surface').forEach(el => el.classList.remove('dark'));
  }
}
