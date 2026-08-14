import { expect, test, type Page } from '@playwright/test';

const apiBase = 'https://cms.macon170.com/api/signups/v1';
const token = 'tok-1234567890abcdefghij';

const baseForm = {
  slug: 'lego-derby-food',
  formType: 'items' as const,
  title: 'Lego Derby snacks',
  instructions: '',
  closed: false,
  closesAt: null,
  event: { slug: 'lego-derby', title: 'Lego Derby', startsAt: '2026-09-12T22:00:00.000Z' },
  slots: [{ id: 'buns', label: 'Buns', notes: null, quantityNeeded: 3, quantityClaimed: 1, quantityRemaining: 2 }],
};

const baseResponse = {
  id: 'r1',
  formSlug: 'lego-derby-food',
  formTitle: 'Lego Derby snacks',
  formType: 'items' as const,
  email: 'parent@example.com',
  familyName: 'Hatcher',
  phone: '478-555-0123',
  attending: true,
  adults: 2,
  children: 1,
  dietaryNotes: 'no peanuts',
  status: 'confirmed' as const,
  claims: [{ slotId: 'buns', label: 'Buns', quantity: 1 }],
};

async function stubResponse(page: Page, response: Record<string, unknown> = baseResponse) {
  await page.route(`${apiBase}/responses/${token}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: 'v1', response }) });
    }
    return route.fallback();
  });
}

async function stubForm(page: Page, form: Record<string, unknown> = baseForm) {
  await page.route(`${apiBase}/forms/lego-derby-food`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: 'v1', form }) }),
  );
}

test('loads the family own response and pre-fills its claim', async ({ page }) => {
  await stubResponse(page);
  await stubForm(page);
  await page.goto(`/signups/edit/?token=${token}`);

  await expect(page.locator('#edit-family-name')).toHaveValue('Hatcher');
  await expect(page.getByLabel('Your Name')).toHaveAttribute('required', '');
  await expect(page.getByLabel('Phone number')).toHaveAttribute('type', 'tel');
  await expect(page.getByLabel('Phone number')).toHaveAttribute('required', '');
  await expect(page.locator('#edit-phone')).toHaveValue('478-555-0123');
  await expect(page.locator('#edit-dietary-notes')).toHaveValue('no peanuts');
  await expect(page.locator('[data-slot="buns"] input')).toHaveValue('1');
  await expect(page.locator('[data-slot="buns"] input')).toHaveAttribute('max', '3');
});

test('asks not to be indexed and sends no referrer', async ({ page }) => {
  await stubResponse(page);
  await stubForm(page);
  const navigation = await page.goto(`/signups/edit/?token=${token}`);

  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

  // The response headers are the half a crawler or shared cache actually obeys, and only the real
  // Worker sets them — the unit test in worker/index.test.ts cannot prove they survive the asset
  // fetch and reach a browser.
  const headers = navigation?.headers() ?? {};
  expect(headers['referrer-policy']).toBe('no-referrer');
  expect(headers['x-robots-tag']).toBe('noindex, nofollow');
  expect(headers['cache-control']).toBe('no-store');
});

test('never leaks the token into the title or a link', async ({ page }) => {
  await stubResponse(page);
  await stubForm(page);
  await page.goto(`/signups/edit/?token=${token}`);
  await expect(page.locator('#edit-family-name')).toHaveValue('Hatcher');

  expect(await page.title()).not.toContain(token);
  const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
  for (const href of hrefs) expect(href).not.toContain(token);
});

test('PATCHes a changed claim and confirms in place', async ({ page }) => {
  await stubResponse(page);
  await stubForm(page);
  let patched: unknown;
  await page.route(`${apiBase}/responses/${token}`, (route) => {
    if (route.request().method() !== 'PATCH') return route.fallback();
    patched = JSON.parse(route.request().postData() ?? '{}');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        version: 'v1',
        response: { ...baseResponse, claims: [{ slotId: 'buns', label: 'Buns', quantity: 3 }] },
      }),
    });
  });
  await page.goto(`/signups/edit/?token=${token}`);
  await expect(page.locator('#edit-family-name')).toHaveValue('Hatcher');

  await page.fill('[data-slot="buns"] input', '3');
  await page.click('#edit-save');

  await expect(page.locator('#edit-saved')).toBeVisible();
  expect(patched).toMatchObject({ claims: [{ slotId: 'buns', quantity: 3 }] });
  expect(patched).toMatchObject({ phone: '478-555-0123' });
  expect(patched).not.toHaveProperty('email');
});

test('loads a legacy response with an empty required phone field', async ({ page }) => {
  await stubResponse(page, { ...baseResponse, phone: null });
  await stubForm(page);
  await page.goto(`/signups/edit/?token=${token}`);

  await expect(page.locator('#edit-phone')).toHaveValue('');
  await expect(page.locator('#edit-phone')).toHaveAttribute('required', '');
});

test('withdraws only after an explicit in-page confirmation', async ({ page }) => {
  await stubResponse(page);
  await stubForm(page);
  let withdrawn = false;
  await page.route(`${apiBase}/responses/${token}`, (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    withdrawn = true;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: 'v1', status: 'withdrawn' }) });
  });
  await page.goto(`/signups/edit/?token=${token}`);
  await expect(page.locator('#edit-family-name')).toHaveValue('Hatcher');

  await expect(page.locator('#withdraw-confirm')).toBeHidden();
  await page.click('#edit-withdraw');
  // The panel precedes the trigger in DOM order, so opening it must move focus in or a keyboard
  // user tabs straight past the confirmation.
  await expect(page.locator('#withdraw-confirm-yes')).toBeFocused();
  await page.click('#withdraw-confirm-cancel');
  await expect(page.locator('#edit-withdraw')).toBeFocused();
  await page.click('#edit-withdraw');
  await expect(page.locator('#withdraw-confirm')).toBeVisible();
  expect(withdrawn).toBe(false);

  await page.click('#withdraw-confirm-yes');
  await expect(page.locator('#edit-withdrawn')).toBeVisible();
  await expect(page.locator('#edit-form')).toBeHidden();
  expect(withdrawn).toBe(true);
});

test('shows one generic message for a missing token and for a rejected token', async ({ page }) => {
  await page.goto('/signups/edit/');
  await expect(page.locator('#edit-detail')).toContainText('no longer valid');

  await page.route(`${apiBase}/responses/${token}`, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ version: 'v1', error: { code: 'not_found', message: 'Not found.' } }),
    }),
  );
  await page.goto(`/signups/edit/?token=${token}`);
  await expect(page.locator('#edit-detail')).toContainText('no longer valid');
});
