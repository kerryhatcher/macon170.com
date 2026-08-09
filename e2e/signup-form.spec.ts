import { expect, test, type Page } from '@playwright/test';

const turnstileScript = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
const apiBase = 'https://cms.macon170.com/api/signups/v1';
const slug = 'lego-derby-food';

const baseForm = {
  slug,
  formType: 'items' as const,
  title: 'Lego Derby snacks',
  instructions: '',
  closed: false,
  closesAt: null,
  event: { slug: 'lego-derby', title: 'Lego Derby', startsAt: '2026-09-12T22:00:00.000Z' },
  slots: [
    { id: 'buns', label: 'Buns', notes: '8-packs', quantityNeeded: 3, quantityClaimed: 1, quantityRemaining: 2 },
    { id: 'drinks', label: 'Drinks', notes: null, quantityNeeded: 2, quantityClaimed: 2, quantityRemaining: 0 },
  ],
};

async function stubTurnstile(page: Page) {
  await page.route(turnstileScript, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.onTurnstileSuccess("test-token");',
    }),
  );
}

async function stubForm(page: Page, form: Record<string, unknown> = baseForm) {
  await page.route(`${apiBase}/forms/${slug}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: 'v1', form }) }),
  );
}

test('renders the form, its counts, and no personal data', async ({ page }) => {
  await stubTurnstile(page);
  await stubForm(page);
  await page.goto(`/signups/?form=${slug}`);

  await expect(page.locator('#signup-title')).toHaveText('Lego Derby snacks');
  await expect(page.locator('#signup-summary')).toContainText('Lego Derby');
  await expect(page.locator('#signup-summary')).toContainText('September 12, 2026');
  await expect(page.locator('[data-slot="drinks"] input')).toHaveAttribute('max', '0');
  await expect(page.locator('[data-slot="buns"] input')).toHaveAttribute('max', '2');

  // No family-identifying data ships in the static HTML before a family fills anything in.
  await expect(page.locator('#family-name')).toHaveValue('');
  await expect(page.locator('#email')).toHaveValue('');
});

test('submits JSON with the honeypot and Turnstile token, then says check your email', async ({ page }) => {
  await stubTurnstile(page);
  await stubForm(page);
  let posted: unknown;
  await page.route(`${apiBase}/forms/${slug}/responses`, (route) => {
    posted = JSON.parse(route.request().postData() ?? '{}');
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: 'v1' }) });
  });
  await page.goto(`/signups/?form=${slug}`);

  await page.fill('#family-name', 'The Hatchers');
  await page.fill('#email', 'family@example.com');
  await page.fill('[data-slot="buns"] input', '2');
  await expect(page.locator('#signup-submit')).toBeEnabled();
  await page.click('#signup-submit');

  await expect(page.locator('#signup-success')).toBeVisible();
  await expect(page.locator('#signup-success')).toContainText(/check your email/i);

  expect(posted).toMatchObject({
    familyName: 'The Hatchers',
    email: 'family@example.com',
    claims: [{ slotId: 'buns', quantity: 2 }],
    website: '',
    'cf-turnstile-response': 'test-token',
  });
});

test('re-renders refreshed counts instead of erroring when a slot fills first', async ({ page }) => {
  await stubTurnstile(page);
  await stubForm(page);
  const refreshedForm = {
    ...baseForm,
    slots: [
      { id: 'buns', label: 'Buns', notes: '8-packs', quantityNeeded: 3, quantityClaimed: 3, quantityRemaining: 0 },
      { id: 'drinks', label: 'Drinks', notes: null, quantityNeeded: 2, quantityClaimed: 2, quantityRemaining: 0 },
    ],
  };
  await page.route(`${apiBase}/forms/${slug}/responses`, (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        version: 'v1',
        error: { code: 'slot_full', message: 'Someone else claimed that first.' },
        form: refreshedForm,
      }),
    }),
  );
  await page.goto(`/signups/?form=${slug}`);

  await page.fill('#family-name', 'The Hatchers');
  await page.fill('#email', 'family@example.com');
  await page.fill('[data-slot="buns"] input', '2');
  await page.click('#signup-submit');

  await expect(page.locator('#signup-error')).toBeVisible();
  await expect(page.locator('[data-slot="buns"]')).toContainText('All 3 claimed');
  await expect(page.locator('[data-slot="buns"] input')).toHaveValue('0');
  await expect(page.locator('#signup-submit')).toBeEnabled();
});

test('says not found for a missing form AND for a missing query parameter', async ({ page }) => {
  await stubTurnstile(page);
  await page.route(`${apiBase}/forms/does-not-exist`, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ version: 'v1', error: { code: 'not_found', message: 'Not found.' } }),
    }),
  );
  await page.goto('/signups/?form=does-not-exist');
  await expect(page.locator('#signup-detail')).toContainText('Signup not found');

  await page.goto('/signups/');
  await expect(page.locator('#signup-detail')).toContainText('Signup not found');
});

test('shows a read-only notice for a closed form', async ({ page }) => {
  await stubTurnstile(page);
  await stubForm(page, { ...baseForm, closed: true });
  await page.goto(`/signups/?form=${slug}`);

  await expect(page.locator('#signup-closed')).toBeVisible();
  await expect(page.locator('#signup-form')).toBeHidden();
});
