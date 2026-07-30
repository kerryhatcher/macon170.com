import { expect, test } from '@playwright/test';

test.skip(!process.env.LIVE_BASE_URL, 'Runs only as a post-deploy production check.');

test('production contact form recovers cleanly from expiry and retry callbacks', async ({ page }) => {
  await page.addInitScript(() => {
    const assignments: Array<(token?: string) => void> = [];
    let callback: ((token?: string) => void) | undefined;
    Object.defineProperty(window, 'onTurnstileSuccess', {
      configurable: true,
      get: () => callback,
      set: (value) => {
        callback = value;
        assignments.push(value);
      },
    });
    (
      window as Window & {
        __pack170ObservedTurnstileSuccessAssignments?: Array<(token?: string) => void>;
      }
    ).__pack170ObservedTurnstileSuccessAssignments = assignments;
  });
  await page.goto('/contact/');

  const widget = page.locator('.cf-turnstile');
  const submitButton = page.locator('#contact-submit');
  const status = page.locator('#turnstile-status');
  const notice = page.locator('#turnstile-notice');

  await expect(widget).toHaveAttribute('data-refresh-expired', 'auto');
  await expect(widget).toHaveAttribute('data-retry', 'auto');
  const successCallbackAssignments = await page.evaluate(
    () =>
      (
        window as Window & {
          __pack170ObservedTurnstileSuccessAssignments?: Array<(token?: string) => void>;
        }
      ).__pack170ObservedTurnstileSuccessAssignments?.length,
  );
  expect(successCallbackAssignments).toBe(1);

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
