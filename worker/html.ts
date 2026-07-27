// Shared HTML-escaping helper. Used anywhere untrusted or user-editable text is
// interpolated into a server-rendered response: the admin chrome (worker/admin-chrome.ts)
// and the public roster injector (worker/roster-inject.ts).
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] ?? c);
}
