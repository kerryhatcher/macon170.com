import { expect, test } from '@playwright/test';

const ticketUrl = 'https://chehaw.org/visit/51-tickets';
const event = {
  id: '6c62096e-4144-49d0-a3c2-7d314e79aa71',
  revision: 11,
  slug: 'fall-campout',
  publicationState: 'published',
  eventStatus: 'scheduled',
  category: 'family',
  allDay: true,
  title: 'Fall Campout',
  summary: 'Family campout at Chehaw Park and Zoo.',
  description: `Zoo prices are $5 to $8. See ${ticketUrl}.\n<img src=x onerror=alert(1)>`,
  startsAt: '2026-10-24T16:00:00.000Z',
  endsAt: '2026-10-25T16:00:00.000Z',
  timezone: 'America/New_York',
  locationName: 'Chehaw Park and Zoo',
  address: null,
  audience: 'All scouts and families',
  whatToBring: 'Tent and sleeping gear',
  cost: '$40',
  registrationUrl: null,
  milestone: 'fall-camp',
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-10-08T12:00:00.000Z',
  publishedAt: '2026-08-02T12:00:00.000Z',
};

for (const width of [1280, 390]) {
  test(`event description renders safe, working links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('https://cms.macon170.com/api/calendar/v1/events**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: 'v1', event, events: [event] }) }),
    );
    await page.goto('/events/?event=fall-campout');
    await expect(page).toHaveTitle('Fall Campout | Cub Scout Pack 170');
    await expect(page.locator('.event-when__time')).toHaveText('Oct 24 – Oct 25, 2026');
    const description = page.locator('.event-lead');
    const link = description.getByRole('link', { name: ticketUrl, exact: true });
    await expect(link).toHaveAttribute('href', ticketUrl);
    await expect(description).toContainText('<img src=x onerror=alert(1)>');
    await expect(description.locator('img')).toHaveCount(0);
    await expect(description.locator('br')).toHaveCount(1);
    await link.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/event-links-${width}.png` });
    await page.goto('/calendar/');
    await expect(page.locator('[data-pm-row="fall-camp"] [data-pm-when]')).toHaveText('Oct 24 – Oct 25, 2026');
    await page.goto('/events/?event=fall-campout');
    await page.route(ticketUrl, (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Ticket destination</h1>' }));
    await link.click();
    await expect(page).toHaveURL(ticketUrl);
    await expect(page.getByRole('heading', { name: 'Ticket destination' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('timed events retain their hours', async ({ page }) => {
  await page.route('https://cms.macon170.com/api/calendar/v1/events**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ version: 'v1', event: { ...event, allDay: false } }),
    }),
  );
  await page.goto('/events/?event=fall-campout');
  await expect(page.locator('.event-when__time')).toHaveText('12:00 PM – Oct 25, 12:00 PM');
});
