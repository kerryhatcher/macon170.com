import { describe, expect, it } from 'vitest';
import { organizationSchema, eventSchema } from './event-schema';
import type { CalendarEvent } from './calendar-client';

describe('organizationSchema', () => {
  it('identifies the pack with a stable @id other schemas can reference', () => {
    const schema = organizationSchema();

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Organization');
    expect(schema['@id']).toBe('https://www.macon170.com/#organization');
    expect(schema.name).toBe('Cub Scout Pack 170');
    expect(schema.url).toBe('https://www.macon170.com');
  });

  it('points logo at a real crawlable square image', () => {
    // Google requires a logo of at least 112x112. pack170-logo-512.png is 512x512.
    expect(organizationSchema().logo).toBe('https://www.macon170.com/logo/pack170-logo-512.png');
  });

  it('claims a service area without claiming a street address', () => {
    const schema = organizationSchema();

    expect(schema.areaServed).toEqual({
      '@type': 'City',
      name: 'Macon',
      containedInPlace: { '@type': 'State', name: 'Georgia' },
    });
    // The pack meets at a church it does not own. Attributing that street address to the
    // organization would assert a business location that does not exist.
    expect(schema.address).toBeUndefined();
  });

  it('names the parent by its current brand while keeping the legal name discoverable', () => {
    expect(organizationSchema().parentOrganization).toEqual({
      '@type': 'Organization',
      name: 'Scouting America',
      alternateName: 'Boy Scouts of America',
    });
  });
});

const sample = {
  id: '08e4d873-e979-4d05-89c2-09d890bb73de',
  revision: 5,
  slug: 'lego-pinewood-derby-cookout',
  publicationState: 'published',
  eventStatus: 'scheduled',
  category: 'pack',
  title: 'Lego Pinewood Derby & Cookout',
  summary: 'Free event for families interested in joining Scouts.',
  description: 'New and returning families are invited to build LEGO race cars.',
  startsAt: '2026-08-23T20:00:00.000Z',
  endsAt: '2026-08-23T22:00:00.000Z',
  timezone: 'America/New_York',
  locationName: 'Highland Hills Church',
  address: '1370 Briarcliff Rd, Macon, GA 31211',
  audience: 'All scouts and families',
  whatToBring: null,
  cost: 'Free',
  registrationUrl: null,
  milestone: 'lego-derby',
  createdAt: '2026-07-27T14:13:25.084Z',
  updatedAt: '2026-07-28T20:41:33.000Z',
  publishedAt: '2026-07-27T14:14:26.684Z',
} as CalendarEvent;

describe('eventSchema', () => {
  it('maps the CMS event onto schema.org Event', () => {
    const schema = eventSchema(sample);

    expect(schema['@type']).toBe('Event');
    expect(schema.name).toBe('Lego Pinewood Derby & Cookout');
    expect(schema.startDate).toBe('2026-08-23T20:00:00.000Z');
    expect(schema.endDate).toBe('2026-08-23T22:00:00.000Z');
    expect(schema.eventStatus).toBe('https://schema.org/EventScheduled');
    expect(schema.eventAttendanceMode).toBe('https://schema.org/OfflineEventAttendanceMode');
  });

  it('links the event to the pack organization by @id rather than restating it', () => {
    expect(eventSchema(sample).organizer).toEqual({ '@id': 'https://www.macon170.com/#organization' });
  });

  it('gives each event a canonical url a crawler can follow', () => {
    expect(eventSchema(sample).url).toBe('https://www.macon170.com/events/?event=lego-pinewood-derby-cookout');
  });

  it('marks a free event as free', () => {
    expect(eventSchema(sample).isAccessibleForFree).toBe(true);
  });

  it('omits endDate rather than emitting null when the CMS has none', () => {
    // A null endDate is a schema validation error; an absent one is valid.
    expect(eventSchema({ ...sample, endsAt: null }).endDate).toBeUndefined();
  });

  it('omits location entirely when the CMS has no address', () => {
    const schema = eventSchema({ ...sample, address: null, locationName: null });
    expect(schema.location).toBeUndefined();
  });

  it('maps a cancelled event to the cancelled schema status', () => {
    expect(eventSchema({ ...sample, eventStatus: 'cancelled' }).eventStatus).toBe('https://schema.org/EventCancelled');
  });
});
