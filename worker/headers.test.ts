import { describe, expect, it } from 'vitest';
import { withSiteHeaders } from './headers';

const htmlResponse = () => new Response('<!doctype html><html></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
const cssResponse = () => new Response('body{}', { headers: { 'content-type': 'text/css' } });
const request = (path: string) => new Request(`https://www.macon170.com${path}`);

describe('withSiteHeaders', () => {
  it('sets every security header on HTML responses', () => {
    const result = withSiteHeaders(request('/'), htmlResponse());

    expect(result.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
    expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(result.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(result.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('ships the policy in report-only mode so a violation cannot break the site', () => {
    const result = withSiteHeaders(request('/'), htmlResponse());

    expect(result.headers.get('Content-Security-Policy-Report-Only')).toContain("default-src 'self'");
    expect(result.headers.get('Content-Security-Policy')).toBeNull();
  });

  it('allows the third-party origins the site actually depends on', () => {
    const policy = withSiteHeaders(request('/contact/'), htmlResponse()).headers.get('Content-Security-Policy-Report-Only') ?? '';

    // Turnstile loads from challenges.cloudflare.com and renders in an iframe.
    expect(policy).toContain("script-src 'self' https://challenges.cloudflare.com");
    expect(policy).toContain('frame-src https://challenges.cloudflare.com');
    // The calendar and leadership roster are fetched from the CMS at runtime.
    expect(policy).toContain("connect-src 'self' https://cms.macon170.com");
    // The contact form posts directly to the CMS, so form-action must permit it.
    expect(policy).toContain("form-action 'self' https://cms.macon170.com");
  });

  it('leaves non-HTML responses without security headers', () => {
    const result = withSiteHeaders(request('/_astro/index.css'), cssResponse());

    expect(result.headers.get('Content-Security-Policy-Report-Only')).toBeNull();
    expect(result.headers.get('X-Frame-Options')).toBeNull();
  });

  it('preserves the original status and body', async () => {
    const result = withSiteHeaders(request('/'), new Response('page', { status: 404, headers: { 'content-type': 'text/html' } }));

    expect(result.status).toBe(404);
    await expect(result.text()).resolves.toBe('page');
  });

  it('caches content-hashed bundles immutably for a year', () => {
    const result = withSiteHeaders(request('/_astro/index.CvL8xK2p.css'), cssResponse());

    expect(result.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
  });

  it('caches stable-named public assets for a week without marking them immutable', () => {
    // These filenames are not content-hashed, so `immutable` would pin a stale logo in every
    // browser cache for a year with no way to bust it.
    for (const path of ['/logo/pack170-logo-512.png', '/favicon.svg', '/apple-touch-icon.png']) {
      const result = withSiteHeaders(request(path), new Response('', { headers: { 'content-type': 'image/png' } }));
      expect(result.headers.get('Cache-Control'), path).toBe('public, max-age=604800');
    }
  });

  it('leaves HTML caching alone so content edits go live on the next request', () => {
    const original = new Response('<!doctype html>', {
      headers: { 'content-type': 'text/html', 'cache-control': 'public, max-age=0, must-revalidate' },
    });
    const result = withSiteHeaders(request('/about/'), original);

    expect(result.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
  });
});
