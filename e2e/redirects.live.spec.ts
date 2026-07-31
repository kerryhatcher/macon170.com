import { expect, request, test } from '@playwright/test';

// These assertions cover Cloudflare Redirect Rules, which are zone configuration with no
// representation in this repository. They cannot pass against the local wrangler server.
// The rules themselves are documented in docs/CLOUDFLARE-DEPLOYMENT.md.
test.skip(!process.env.LIVE_BASE_URL, 'Redirect rules are Cloudflare edge config, present only on the deployed site.');

test('canonicalises scheme and host in a single hop', async () => {
  const context = await request.newContext();
  const response = await context.get('http://macon170.com/join', { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers()['location']).toBe('https://www.macon170.com/join');
  await context.dispose();
});

test('upgrades insecure www requests', async () => {
  const context = await request.newContext();
  const response = await context.get('http://www.macon170.com/', { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers()['location']).toBe('https://www.macon170.com/');
  await context.dispose();
});

test('redirects extensionless paths to their trailing-slash form permanently', async () => {
  const context = await request.newContext();
  const response = await context.get('https://www.macon170.com/join', { maxRedirects: 0 });

  // 307 would signal this canonical URL shape is temporary and withhold link equity.
  expect(response.status()).toBe(308);
  expect(response.headers()['location']).toBe('https://www.macon170.com/join/');
  await context.dispose();
});

test('leaves static assets untouched by the trailing-slash rule', async () => {
  const context = await request.newContext();

  for (const asset of ['/favicon.svg', '/apple-touch-icon.png', '/site.webmanifest']) {
    const response = await context.get(`https://www.macon170.com${asset}`, { maxRedirects: 0 });
    expect(response.status(), `${asset} must not redirect`).toBe(200);
  }
  await context.dispose();
});

test('preserves the query string exactly once across the full chain', async () => {
  const context = await request.newContext();
  const response = await context.get('http://macon170.com/join?utm_source=plan&a=1');

  expect(response.url()).toBe('https://www.macon170.com/join/?utm_source=plan&a=1');
  expect(response.status()).toBe(200);
  await context.dispose();
});

// Regression guard for a real outage on 2026-07-30. Redirect Rules are scoped to the whole
// macon170.com ZONE, not to one hostname, so a rule written as "redirect anything that is not
// www" swept up cms.macon170.com and pointed the CMS at the public site. That broke the contact
// form, the calendar feed, and the leadership roster for about an hour, and nothing in this
// repository would have noticed. Any future edit to the canonicalisation rules must keep these
// passing.
test('never redirects the CMS subdomain', async () => {
  const context = await request.newContext();

  for (const url of [
    'https://cms.macon170.com/',
    'https://cms.macon170.com/api/calendar/v1/events',
    'https://cms.macon170.com/api/forms/contact/submit',
    'https://cms.macon170.com/api/collections/leadership-roster/content',
  ]) {
    const response = await context.get(url, { maxRedirects: 0 });

    // The CMS legitimately redirects on its own: `/` sends you to /auth/login, and the contact
    // endpoint 303s back to https://www.macon170.com/contact/?error=... because that is the
    // branded-form flow. So "any redirect to www" is the wrong assertion.
    //
    // The outage had an exact signature: a canonicalisation rule rewrites the host while
    // PRESERVING the path, so the CMS's own path reappeared under www. That is what must never
    // happen, and it is what this asserts.
    expect(response.headers()['location'] ?? '', `${url} must not be host-rewritten onto the public site`).not.toBe(
      `https://www.macon170.com${new URL(url).pathname}`,
    );
  }
  await context.dispose();
});

test('serves the calendar feed the public site depends on', async () => {
  const context = await request.newContext();
  const response = await context.get('https://cms.macon170.com/api/calendar/v1/events', {
    headers: { accept: 'application/json' },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(200);
  expect((await response.json()).version).toBe('v1');
  await context.dispose();
});
