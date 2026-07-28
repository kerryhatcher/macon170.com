import { expect, test } from '@playwright/test';

test.skip(!process.env.LIVE_BASE_URL, 'Runs only as a post-deploy production check.');

test('production contact form recovers cleanly from expiry and retry callbacks', async ({ page }) => {
  await page.goto('/contact/');

  const widget = page.locator('.cf-turnstile');
  const submitButton = page.locator('#contact-submit');
  const status = page.locator('#turnstile-status');
  const notice = page.locator('#turnstile-notice');

  await expect(widget).toHaveAttribute('data-refresh-expired', 'auto');
  await expect(widget).toHaveAttribute('data-retry', 'auto');

  await page.evaluate(() => window.onTurnstileSuccess?.('live-check-token'));
  await expect(submitButton).toBeEnabled();
  await expect(status).toBeHidden();
  await expect(notice).toBeHidden();

  await page.evaluate(() => window.onTurnstileExpired?.());
  await expect(submitButton).toBeDisabled();
  await expect(status).toContainText('expired and is refreshing automatically');
  await expect(notice).toBeHidden();

  await page.evaluate(() => window.onTurnstileSuccess?.('live-check-refreshed-token'));
  await expect(submitButton).toBeEnabled();
  await expect(status).toBeHidden();
  await expect(notice).toBeHidden();

  const retryResult = await page.evaluate(() => window.onTurnstileError?.('live-check-transient-error'));
  expect(retryResult).toBe(false);
  await expect(submitButton).toBeDisabled();
  await expect(status).toContainText('temporary problem and is retrying automatically');
  await expect(notice).toBeHidden();

  await page.evaluate(() => window.onTurnstileSuccess?.('live-check-retry-token'));
  await expect(submitButton).toBeEnabled();
  await expect(status).toBeHidden();
  await expect(notice).toBeHidden();
});
