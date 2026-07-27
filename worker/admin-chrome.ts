// Shared chrome for the admin pages (worker/index.ts's renderAdminShell,
// worker/calendar-admin.ts, worker/leadership-admin.ts). Each admin page keeps its own
// CSS - unifying that carries visual-regression risk on live pages and is out of scope
// here - but the nav and the HTML escaper are identical across pages, so a fourth admin
// page needs no nav edits in three files.

export function adminNav(current: 'desk' | 'calendar' | 'leadership'): string {
  const link = (href: string, key: string, label: string) =>
    `<a${key === current ? ' aria-current="page"' : ''} href="${href}">${label}</a>`;
  return `${link('/', 'desk', 'Parent inquiries')}${link('/calendar', 'calendar', 'Calendar editor')}${link('/leadership', 'leadership', 'Leadership editor')}`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] ?? c);
}
