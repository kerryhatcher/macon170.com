import { expect, test, type Page } from '@playwright/test';

const turnstileScript = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
const cmsSubmit = 'https://cms.macon170.com/api/forms/contact/submit';

async function stubTurnstile(page: Page) {
  await page.route(turnstileScript, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: '',
    }),
  );
}

test('keeps the branded form fields and submits directly to the CMS', async ({ page }) => {
  await stubTurnstile(page);
  await page.goto('/contact/');

  const form = page.locator('#contact-form');
  await expect(form).toHaveAttribute('action', cmsSubmit);
  await expect(form.locator('[name="parentName"]')).toBeVisible();
  await expect(form.locator('[name="email"]')).toHaveAttribute('type', 'email');
  await expect(form.locator('[name="phone"]')).toHaveAttribute('type', 'tel');
  await expect(form.locator('[name="childGrade"]')).toBeVisible();
  await expect(form.locator('[name="topic"]')).toBeVisible();
  await expect(form.locator('[name="message"]')).toHaveAttribute('maxlength', '4000');
  await expect(form.locator('[name="website"]')).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#message-safety')).toContainText('do not send a child’s full name');
});

test('shows the CMS success redirect without changing the form layout', async ({ page }) => {
  await stubTurnstile(page);
  await page.goto('/contact/?submitted=success#contact-form');
  await expect(page.locator('#submission-success')).toBeVisible();
  await expect(page.locator('#submission-error')).toBeHidden();
  await expect(page).toHaveURL(/\/contact\/#contact-form$/);
});

for (const [error, title] of [
  ['validation', 'Check the form and try again.'],
  ['rate_limit', 'Please wait a minute.'],
  ['security', 'The security check did not finish.'],
  ['temporary', 'The volunteer queue is temporarily unavailable.'],
] as const) {
  test(`shows a friendly ${error} redirect state`, async ({ page }) => {
    await stubTurnstile(page);
    await page.goto(`/contact/?error=${error}#contact-form`);
    await expect(page.locator('#submission-error')).toBeVisible();
    await expect(page.locator('#submission-error-title')).toHaveText(title);
    await expect(page.locator('#submission-success')).toBeHidden();
    await expect(page).toHaveURL(/\/contact\/#contact-form$/);
  });
}

test('keeps the complete contact form inside a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await stubTurnstile(page);
  await page.goto('/contact/');
  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    formRight: document.querySelector('#contact-form')?.getBoundingClientRect().right ?? Number.POSITIVE_INFINITY,
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.formRight).toBeLessThanOrEqual(metrics.viewportWidth);
});

test('expiry and automatic retry never masquerade as a widget load failure', async ({ page }) => {
  await stubTurnstile(page);
  await page.goto('/contact/');

  const submitButton = page.locator('#contact-submit');
  const status = page.locator('#turnstile-status');
  const notice = page.locator('#turnstile-notice');

  await page.evaluate(() => window.onTurnstileSuccess?.('fresh-token'));
  await expect(submitButton).toBeEnabled();
  await expect(status).toBeHidden();
  await expect(notice).toBeHidden();

  await page.evaluate(() => window.onTurnstileExpired?.());
  await expect(submitButton).toBeDisabled();
  await expect(status).toContainText('expired and is refreshing automatically');
  await expect(notice).toBeHidden();

  await page.evaluate(() => window.onTurnstileSuccess?.('refreshed-token'));
  await expect(submitButton).toBeEnabled();
  await expect(status).toBeHidden();
  await expect(notice).toBeHidden();

  const retryResult = await page.evaluate(() => window.onTurnstileError?.('network-error'));
  expect(retryResult).toBe(false);
  await expect(submitButton).toBeDisabled();
  await expect(status).toContainText('temporary problem and is retrying automatically');
  await expect(notice).toBeHidden();
});

test('persistent Turnstile failure names the fallback contact route', async ({ page }) => {
  await stubTurnstile(page);
  await page.goto('/contact/');
  await page.evaluate(() => window.onTurnstileError?.('persistent-error'));

  await expect(page.locator('#contact-submit')).toBeDisabled();
  await expect(page.locator('#turnstile-notice')).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('#turnstile-notice')).toContainText('Message Pack 170 on Facebook');
});
