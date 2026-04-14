import { createEmptyStateMarkup, createLoadingMarkup } from '../utils/helpers.js';

export function renderDataTable(container, { columns, rows, loading = false, emptyTitle = 'Aucune donnée', emptyDescription = 'Aucun élément à afficher.' }) {
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
    <div class="table-responsive">
      <table class="table align-middle mb-0">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}
