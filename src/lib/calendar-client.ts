export type CalendarEventStatus = 'scheduled' | 'tentative' | 'cancelled';
export type CalendarEventCategory = 'pack' | 'den' | 'family';
export type CalendarMilestone = 'lego-derby' | 'fall-camp' | 'pinewood-derby' | 'blue-gold';

export type CalendarEvent = {
  id: string;
  revision: number;
  slug: string;
  publicationState: 'published';
  eventStatus: CalendarEventStatus;
  category: CalendarEventCategory;
  title: string;
  summary: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  timezone: 'America/New_York';
  locationName: string | null;
  address: string | null;
  audience: string;
  whatToBring: string | null;
  cost: string | null;
  registrationUrl: string | null;
  milestone: CalendarMilestone | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

import { CALENDAR_API_BASE, CALENDAR_SUBSCRIPTION_URL } from './cms-origin';

export { CALENDAR_API_BASE, CALENDAR_SUBSCRIPTION_URL };

const statuses = new Set<CalendarEventStatus>(['scheduled', 'tentative', 'cancelled']);
const categories = new Set<CalendarEventCategory>(['pack', 'den', 'family']);
const milestones = new Set<CalendarMilestone>(['lego-derby', 'fall-camp', 'pinewood-derby', 'blue-gold']);

export class CalendarClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const body = await calendarRequest(`${CALENDAR_API_BASE}/events`);
  if (!isRecord(body) || body.version !== 'v1' || !Array.isArray(body.events)) {
    throw new CalendarClientError('The calendar returned an invalid event list.');
  }
  return body.events.map(validateCalendarEvent);
}

export async function getCalendarEvent(slug: string): Promise<CalendarEvent> {
  const body = await calendarRequest(`${CALENDAR_API_BASE}/events/${encodeURIComponent(slug)}`);
  if (!isRecord(body) || body.version !== 'v1') {
    throw new CalendarClientError('The calendar returned an invalid event.');
  }
  return validateCalendarEvent(body.event);
}

async function calendarRequest(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) {
      throw new CalendarClientError(response.status === 404 ? 'Event not found.' : 'The calendar is unavailable.', response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof CalendarClientError) throw error;
    throw new CalendarClientError(
      error instanceof DOMException && error.name === 'AbortError' ? 'The calendar request timed out.' : 'The calendar is unavailable.',
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function validateCalendarEvent(value: unknown): CalendarEvent {
  if (!isRecord(value)) throw new CalendarClientError('The calendar returned an invalid event.');

  const id = requiredString(value, 'id');
  const revision = value.revision;
  const slug = requiredString(value, 'slug');
  const eventStatus = requiredString(value, 'eventStatus');
  const category = requiredString(value, 'category');
  const milestone = nullableString(value, 'milestone');
  const startsAt = requiredInstant(value, 'startsAt');
  const endsAt = nullableInstant(value, 'endsAt');
  const createdAt = requiredInstant(value, 'createdAt');
  const updatedAt = requiredInstant(value, 'updatedAt');
  const publishedAt = requiredInstant(value, 'publishedAt');

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    throw new CalendarClientError('The calendar returned an invalid event ID.');
  if (!Number.isInteger(revision) || (revision as number) < 0)
    throw new CalendarClientError('The calendar returned an invalid event revision.');
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) throw new CalendarClientError('The calendar returned an invalid event slug.');
  if (value.publicationState !== 'published' || value.timezone !== 'America/New_York')
    throw new CalendarClientError('The calendar returned an invalid publication state.');
  if (!statuses.has(eventStatus as CalendarEventStatus) || !categories.has(category as CalendarEventCategory))
    throw new CalendarClientError('The calendar returned an invalid event classification.');
  if (milestone !== null && !milestones.has(milestone as CalendarMilestone))
    throw new CalendarClientError('The calendar returned an invalid milestone.');
  if (endsAt !== null && endsAt < startsAt) throw new CalendarClientError('The calendar returned invalid event times.');

  return {
    id,
    revision: revision as number,
    slug,
    publicationState: 'published',
    eventStatus: eventStatus as CalendarEventStatus,
    category: category as CalendarEventCategory,
    title: requiredString(value, 'title'),
    summary: requiredString(value, 'summary'),
    description: requiredString(value, 'description'),
    startsAt,
    endsAt,
    timezone: 'America/New_York',
    locationName: nullableString(value, 'locationName'),
    address: nullableString(value, 'address'),
    audience: requiredString(value, 'audience'),
    whatToBring: nullableString(value, 'whatToBring'),
    cost: nullableString(value, 'cost'),
    registrationUrl: nullableWebUrl(value, 'registrationUrl'),
    milestone: milestone as CalendarMilestone | null,
    createdAt,
    updatedAt,
    publishedAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: Record<string, unknown>, key: string): string {
  const item = value[key];
  if (typeof item !== 'string' || item.length === 0) throw new CalendarClientError(`The calendar returned an invalid ${key}.`);
  return item;
}

function nullableString(value: Record<string, unknown>, key: string): string | null {
  return value[key] === null ? null : requiredString(value, key);
}

function requiredInstant(value: Record<string, unknown>, key: string): string {
  const item = requiredString(value, key);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(item) || Number.isNaN(Date.parse(item)))
    throw new CalendarClientError(`The calendar returned an invalid ${key}.`);
  return item;
}

function nullableInstant(value: Record<string, unknown>, key: string): string | null {
  return value[key] === null ? null : requiredInstant(value, key);
}

function nullableWebUrl(value: Record<string, unknown>, key: string): string | null {
  const item = nullableString(value, key);
  if (item === null) return null;
  try {
    const url = new URL(item);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('unsupported protocol');
    return item;
  } catch {
    throw new CalendarClientError(`The calendar returned an invalid ${key}.`);
  }
}
