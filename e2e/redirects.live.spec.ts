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
