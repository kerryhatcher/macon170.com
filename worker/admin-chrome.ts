// Shared chrome for the admin pages (worker/index.ts's renderAdminShell,
// worker/calendar-admin.ts, worker/leadership-admin.ts). Each admin page keeps its own
// CSS - unifying that carries visual-regression risk on live pages and is out of scope
// here - but the nav is identical across pages, so a fourth admin page needs no nav
// edits in three files.
import { escapeHtml } from './html';

export function adminNav(current: 'desk' | 'calendar' | 'leadership'): string {
  const link = (href: string, key: string, label: string) =>
    `<a${key === current ? ' aria-current="page"' : ''} href="${href}">${label}</a>`;
  return `${link('/', 'desk', 'Parent inquiries')}${link('/calendar', 'calendar', 'Calendar editor')}${link('/leadership', 'leadership', 'Leadership editor')}`;
}

// Re-exported so existing admin-chrome importers (worker/index.ts, calendar-admin.ts,
// leadership-admin.ts) don't need an extra import line for the same helper.
export { escapeHtml };
