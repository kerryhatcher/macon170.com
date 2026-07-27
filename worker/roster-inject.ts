import { readRoster, type PublicRole } from './leadership-routes';
import { escapeHtml } from './html';

// Only these paths are piped through HTMLRewriter. Everything else is served as a
// plain static asset. Add a path here only once a page actually carries a
// [data-roster] placeholder — otherwise it pays the etag/cache-control cost in
// worker/index.ts for nothing.
export const ROSTER_PATHS = new Set(['/about', '/about/']);

export function rosterMarkup(roles: PublicRole[], view: string): string {
  const chosen =
    view === 'filled'
      ? roles.filter((role) => !role.vacant)
      : view === 'vacant'
        ? roles.filter((role) => role.vacant)
        : roles.filter((role) => role.slug === view);
  if (!chosen.length) return '';
  const items = chosen
    .map((role) => {
      const who = role.vacant ? '<em>This role is open</em>' : escapeHtml(role.name ?? '');
      const bio = role.bio ? `<p>${escapeHtml(role.bio)}</p>` : '';
      return `<li><strong>${escapeHtml(role.role)}</strong> ${who}${bio}</li>`;
    })
    .join('');
  return `<ul>${items}</ul>`;
}

class RosterInjector {
  constructor(private readonly env: Env) {}

  async element(element: {
    getAttribute(name: string): string | null;
    setInnerContent(content: string, options: { html: boolean }): void;
  }) {
    const view = element.getAttribute('data-roster') ?? 'filled';
    try {
      const roles = await readRoster(this.env.DB);
      const html = rosterMarkup(roles, view);
      // An empty result keeps the authored fallback rather than blanking the section.
      if (html) element.setInnerContent(html, { html: true });
    } catch (error) {
      console.error(
        JSON.stringify({ event: 'roster_injection_failed', view, error: error instanceof Error ? error.message : 'Unknown error' }),
      );
    }
  }
}

export function injectRoster(response: Response, env: Env): Response {
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response;
  return new HTMLRewriter().on('[data-roster]', new RosterInjector(env)).transform(response);
}
