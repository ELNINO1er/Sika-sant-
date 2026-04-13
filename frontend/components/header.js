export function renderHeader(title, subtitle) {
  return `
    <div class="mb-4">
      <div class="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-start">
        <div>
          <h2 class="h4 mb-1">${title}</h2>
          <p class="text-muted mb-0">${subtitle}</p>
        </div>
      </div>
    </div>
  `;
}
