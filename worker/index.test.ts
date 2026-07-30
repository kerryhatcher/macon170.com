import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

describe('public Worker routing after the contact migration', () => {
  it.each([
    ['GET', 'https://www.macon170.com/api'],
    ['POST', 'https://www.macon170.com/api/contact'],
    ['GET', 'https://www.macon170.com/api/admin/submissions'],
    ['PATCH', 'https://www.macon170.com/api/admin/submissions/11111111-1111-4111-8111-111111111111'],
    ['GET', 'https://www.macon170.com/api/events'],
    ['GET', 'https://www.macon170.com/api/calendar.ics'],
  ])('keeps unowned public-site API paths closed: %s %s', async (method, url) => {
    const response = await exports.default.fetch(url, { method });
    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      error: { code: 'not_found', message: 'Not found.' },
    });
  });

  it('continues serving public static assets', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/contact/');
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain('Contact Pack 170');
  });

  it('serves real pages with the security headers applied', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/contact/');

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Content-Security-Policy-Report-Only')).toContain("default-src 'self'");
  });
});
