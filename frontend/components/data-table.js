import { createEmptyStateMarkup, createLoadingMarkup } from '../utils/helpers.js';

export function renderDataTable(
  container,
  { columns, rows, loading = false, emptyTitle = 'Aucune donnee', emptyDescription = 'Aucun element a afficher.' }
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

  const head = columns.map(column => `<th>${column.label}</th>`).join('');
  const body = rows.map(row => `
    <tr>
      ${columns.map(column => `<td>${column.render(row)}</td>`).join('')}
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="table-shell">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
  `;
}
