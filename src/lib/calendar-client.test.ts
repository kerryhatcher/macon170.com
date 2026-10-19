import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalendarClientError, getCalendarEvent, getCalendarEvents } from './calendar-client';

const event = {
  id: '6c62096e-4144-49d0-a3c2-7d314e79aa71',
  revision: 2,
  allDay: false,
  slug: 'pack-meeting',
  publicationState: 'published',
  eventStatus: 'scheduled',
  category: 'pack',
  title: 'Pack Meeting',
  summary: 'The whole pack meets.',
  description: 'Published family logistics.',
  startsAt: '2027-01-12T23:30:00.000Z',
  endsAt: '2027-01-13T00:30:00.000Z',
  timezone: 'America/New_York',
  locationName: 'Highland Hills Baptist Church',
  address: '1370 Briarcliff Rd, Macon, GA 31211',
  audience: 'All Pack 170 families',
  whatToBring: null,
  cost: null,
  registrationUrl: 'https://example.com/register',
  paymentUrl: null,
  milestone: null,
  createdAt: '2026-08-01T12:00:00.000Z',
  updatedAt: '2026-08-02T12:00:00.000Z',
  publishedAt: '2026-08-02T12:00:00.000Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('calendar client', () => {
  it('accepts all-day events and defaults older CMS responses to timed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ version: 'v1', event: { ...event, allDay: true } })));
    expect((await getCalendarEvent('pack-meeting')).allDay).toBe(true);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ version: 'v1', event: { ...event, allDay: undefined } })));
    expect((await getCalendarEvent('pack-meeting')).allDay).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ version: 'v1', event: { ...event, allDay: 'true' } })));
    await expect(getCalendarEvent('pack-meeting')).rejects.toThrow('invalid allDay');
  });
  it('returns the canonical camelCase event list without translating fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ version: 'v1', events: [event] })));
    await expect(getCalendarEvents()).resolves.toEqual([event]);
  });

  it('returns a canonical event detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ version: 'v1', event })));
    await expect(getCalendarEvent('pack-meeting')).resolves.toEqual(event);
  });

  it('rejects malformed CMS data instead of leaking it into the page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ version: 'v1', events: [{ ...event, startsAt: 'not-a-date' }] })));
    await expect(getCalendarEvents()).rejects.toThrow('invalid startsAt');
  });

  it('distinguishes a missing event from CMS unavailability', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: { code: 'not_found' } }, { status: 404 })));
    const error = await getCalendarEvent('missing').catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(CalendarClientError);
    expect((error as CalendarClientError).status).toBe(404);
  });

  it('rejects unsafe registration URLs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ version: 'v1', events: [{ ...event, registrationUrl: 'javascript:alert(1)' }] })),
    );
    await expect(getCalendarEvents()).rejects.toThrow('invalid registrationUrl');
  });

  it('returns the payment URL and accepts null', async () => {
    const paymentUrl = 'https://buy.stripe.com/9B68wOdMpef0c9rfKpdjO00';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ version: 'v1', event: { ...event, paymentUrl } })));
    expect((await getCalendarEvent('pack-meeting')).paymentUrl).toBe(paymentUrl);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ version: 'v1', event })));
    expect((await getCalendarEvent('pack-meeting')).paymentUrl).toBeNull();
  });

  it('treats a missing paymentUrl as null so an older CMS response still loads', async () => {
    const withoutPayment: Partial<typeof event> = { ...event };
    delete withoutPayment.paymentUrl;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ version: 'v1', events: [withoutPayment] })));
    expect((await getCalendarEvents())[0].paymentUrl).toBeNull();
  });

  it('rejects unsafe or malformed payment URLs', async () => {
    for (const paymentUrl of ['javascript:alert(1)', 'not a url', 'http://buy.stripe.com/x', 42]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ version: 'v1', events: [{ ...event, paymentUrl }] })));
      await expect(getCalendarEvents()).rejects.toThrow('invalid paymentUrl');
    }
  });

  it('times out a CMS request that does not complete', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      }),
    );

    const assertion = expect(getCalendarEvents()).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(8_000);
    await assertion;
  });
});
