export function ensureModal({ id, title }) {
  let modal = document.getElementById(id);
  if (modal) {
    return modal;
  }

  modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = id;
  modal.tabIndex = -1;
  modal.innerHTML = `
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
        </div>
        <div class="modal-body"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

export function openModal(id, bodyHtml) {
  const modalElement = document.getElementById(id);
  if (!modalElement) return;
  modalElement.querySelector('.modal-body').innerHTML = bodyHtml;
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}
