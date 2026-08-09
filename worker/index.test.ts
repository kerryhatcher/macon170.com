import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

describe('public Worker routing after the contact migration', () => {
  it('keeps the apex redirect on the production public hostname', async () => {
    const response = await exports.default.fetch('https://macon170.com/contact/?from=apex', { redirect: 'manual' });
    expect(response.status).toBe(308);
    expect(response.headers.get('Location')).toBe('https://www.macon170.com/contact/?from=apex');
  });

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
});

describe('the magic-link signup edit page', () => {
  // The token rides in this page's query string, so the response must not sit in a shared cache,
  // be indexed, or hand the token to an outbound link through the Referer header.
  it.each(['https://www.macon170.com/signups/edit/?token=secret-token', 'https://www.macon170.com/signups/edit?token=secret-token'])(
    'never leaks the token through a referrer, a cache, or a crawler: %s',
    async (url) => {
      const response = await exports.default.fetch(url);
      expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    },
  );

  it('serves the edit page itself, not a 404', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/signups/edit/?token=secret-token');
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain('Your signup');
  });

  it('leaves the ordinary signup page cacheable and indexable', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/signups/?form=lego-derby-food');
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Robots-Tag')).toBeNull();
  });

  // A path that merely starts with the same characters must not pick up the exemption or the
  // headers, so /signups/editorial/ stays an ordinary page.
  it('does not treat a lookalike path as the edit page', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/signups/editorial/');
    expect(response.headers.get('X-Robots-Tag')).toBeNull();
  });
});
