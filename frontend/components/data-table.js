import { createEmptyStateMarkup, createLoadingMarkup } from '../utils/helpers.js';

const DEFAULT_PAGE_SIZE = 10;

export function renderDataTable(
  container,
  { columns, rows, loading = false, emptyTitle = 'Aucune donnee', emptyDescription = 'Aucun element a afficher.', pageSize = DEFAULT_PAGE_SIZE, currentPage = 1, onPageChange = null }
) {
  if (!container) return;

  if (loading) {
    container.innerHTML = createLoadingMarkup();
    return;
  }

  if (!rows || rows.length === 0) {
    container.innerHTML = createEmptyStateMarkup(emptyTitle, emptyDescription);
    return;
  }

  const totalPages = Math.ceil(rows.length / pageSize);
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);

  const head = columns.map(column => `<th>${column.label}</th>`).join('');
  const body = pageRows.map(row => `
    <tr>
      ${columns.map(column => `<td>${column.render(row)}</td>`).join('')}
    </tr>
  `).join('');

  const paginationHtml = totalPages > 1 ? `
    <div class="table-pagination">
      <span class="table-pagination-info">${startIndex + 1}-${Math.min(startIndex + pageSize, rows.length)} sur ${rows.length}</span>
      <div class="table-pagination-controls">
        <button class="btn btn-sm btn-outline-secondary" data-page="${safePage - 1}" ${safePage <= 1 ? 'disabled' : ''}>
          <i class="bi bi-chevron-left"></i>
        </button>
        ${Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => {
          return p === 1 || p === totalPages || Math.abs(p - safePage) <= 1;
        }).reduce((acc, p, idx, arr) => {
          if (idx > 0 && p - arr[idx - 1] > 1) {
            acc.push('<span class="table-pagination-ellipsis">...</span>');
          }
          acc.push(`<button class="btn btn-sm ${p === safePage ? 'btn-primary' : 'btn-outline-secondary'}" data-page="${p}">${p}</button>`);
          return acc;
        }, []).join('')}
        <button class="btn btn-sm btn-outline-secondary" data-page="${safePage + 1}" ${safePage >= totalPages ? 'disabled' : ''}>
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  ` : '';

  container.innerHTML = `
    <div class="table-shell">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      ${paginationHtml}
    </div>
  `;

  if (totalPages > 1) {
    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = Number(btn.dataset.page);
        if (page >= 1 && page <= totalPages) {
          renderDataTable(container, { columns, rows, pageSize, currentPage: page, onPageChange, emptyTitle, emptyDescription });
          if (onPageChange) onPageChange(page);
        }
      });
    });
  }
}
