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
});
