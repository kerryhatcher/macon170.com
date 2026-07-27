import { expect, test } from '@playwright/test';

// End-to-end coverage for the exact failure a real parent + volunteer hit in
// production: a contact form submission that silently never showed up in the
// admin desk. The root cause was a client-side JavaScript SyntaxError in the
// volunteer desk's inline <script> - something only a real browser parsing and
// executing the page can catch. worker/admin-scripts.unit.test.ts and
// worker/submission-flow.integration.test.ts both exercise this at the Workers
// runtime layer, but neither one runs the shipped script in an actual JS engine.
// This spec does, and fails on any console/page error the same bug class would
// throw - not just on the one regex that already got fixed.
test('parent submission appears in the volunteer desk with no console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  // The real widget script requires solving a live Cloudflare challenge, which
  // headless automation cannot (and should not try to) do. Block it and inject
  // the dummy "always passes" response token directly, the same way
  // worker/index.test.ts already does at the Workers-runtime layer - this keeps
  // the test deterministic and offline while still exercising the real DOM, the
  // real form submission, and the real admin rendering path.
  // Fulfilling with a harmless empty script (rather than aborting) avoids a
  // synthetic "Failed to load resource" console error that would otherwise
  // pollute the very console-error assertion this test relies on.
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  );

  const parentName = `E2E Parent ${Date.now()}`;
  const message = 'Testing that submissions reach the volunteer desk.\nSecond line to check newline handling.';

  await page.goto('/contact');
  await page.fill('#parent-name', parentName);
  await page.fill('#email', 'e2e-parent@example.com');
  await page.selectOption('#topic', 'Planning a first visit');
  await page.fill('#message', message);

  await page.evaluate(() => {
    const form = document.querySelector('#contact-form') as HTMLFormElement;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'cf-turnstile-response';
    input.value = 'XXXX.DUMMY.TOKEN.XXXX';
    form.appendChild(input);
  });

  await page.click('#contact-form button[type="submit"]');
  // contact.astro strips the ?submitted=success query param via history.replaceState
  // right after reading it, so the settled URL only carries the #contact-form anchor.
  await expect(page).toHaveURL(/#contact-form$/);
  await expect(page.locator('#submission-success')).toBeVisible();

  await page.goto('/admin');
  await expect(page.locator('h1')).toHaveText('Volunteer desk');

  const row = page.locator('.row', { hasText: parentName });
  await expect(row).toBeVisible();
  await row.click();

  await expect(page.locator('#detail')).toContainText(parentName);
  await expect(page.locator('#detail')).toContainText('e2e-parent@example.com');
  await expect(page.locator('#detail')).toContainText('Second line to check newline handling.');

  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toEqual([]);
  expect(pageErrors, `Unexpected page errors: ${pageErrors.join('\n')}`).toEqual([]);
});
