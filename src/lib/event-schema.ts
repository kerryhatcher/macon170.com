import { pack } from '../data/pack';
import type { CalendarEvent } from './calendar-client';

export const SITE_ORIGIN = 'https://www.macon170.com';
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;

export function organizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: pack.name,
    alternateName: pack.shortName,
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/logo/pack170-logo-512.png`,
    description:
      'Volunteer-run Cub Scout pack for kindergarten through 5th grade, boys and girls, meeting monthly on Tuesdays at 6:30 PM in Macon, Georgia.',
    areaServed: {
      '@type': 'City',
      name: 'Macon',
      containedInPlace: { '@type': 'State', name: 'Georgia' },
    },
    // No `address`: the pack meets at a chartered organization's building it does not own.
    // `name` is the current brand (rebranded from "Boy Scouts of America" in 2024); that former
    // name is kept as `alternateName` since it is still the registered corporate name and
    // appears throughout older material, so search consumers can match both forms to one entity.
    parentOrganization: {
      '@type': 'Organization',
      name: 'Scouting America',
      alternateName: 'Boy Scouts of America',
    },
  };
}

const EVENT_STATUS: Record<string, string> = {
  scheduled: 'https://schema.org/EventScheduled',
  tentative: 'https://schema.org/EventScheduled',
  cancelled: 'https://schema.org/EventCancelled',
};

export function eventSchema(event: CalendarEvent): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.summary,
    startDate: event.startsAt,
    eventStatus: EVENT_STATUS[event.eventStatus] ?? EVENT_STATUS.scheduled,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${SITE_ORIGIN}/events/?event=${encodeURIComponent(event.slug)}`,
    organizer: { '@id': ORGANIZATION_ID },
  };

  // Absent beats null: a null value is a schema validation error, an omitted key is valid.
  if (event.endsAt) schema.endDate = event.endsAt;
  if (event.cost && /^free$/i.test(event.cost.trim())) schema.isAccessibleForFree = true;
  if (event.registrationUrl) schema.offers = { '@type': 'Offer', url: event.registrationUrl };
  if (event.locationName && event.address) {
    schema.location = { '@type': 'Place', name: event.locationName, address: event.address };
  }
  return schema;
}
