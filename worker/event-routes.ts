import { annualProgram } from '../src/data/pack';

type EventVisibility = 'draft' | 'published' | 'archived';
type EventStatus = 'scheduled' | 'tentative' | 'cancelled';
type EventCategory = 'pack' | 'den' | 'family';

type EventRow = {
  id: string;
  slug: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  archived_at: string | null;
  visibility: EventVisibility;
  status: EventStatus;
  category: EventCategory;
  title: string;
  summary: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  location_name: string | null;
  address: string | null;
  audience: string;
  what_to_bring: string | null;
  cost: string | null;
  registration_url: string | null;
  milestone: string | null;
  created_by: string;
  updated_by: string;
};

type CalendarEventRow = EventRow & {
  sequence: number;
};

type EventInput = {
  title?: unknown;
  slug?: unknown;
  summary?: unknown;
  description?: unknown;
  category?: unknown;
  status?: unknown;
  visibility?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  timezone?: unknown;
  locationName?: unknown;
  address?: unknown;
  audience?: unknown;
  whatToBring?: unknown;
  cost?: unknown;
  registrationUrl?: unknown;
  milestone?: unknown;
};

type EventRouteContext = {
  request: Request;
  env: Env;
  url: URL;
  requireAccess: (request: Request, env: Env) => Promise<{ email?: string }>;
  enforceSameOrigin: (request: Request, origin: string) => void;
  json: (data: unknown, status?: number, headers?: HeadersInit) => Response;
  publicHeaders: (request: Request) => Record<string, string>;
  adminHeaders: (env: Env) => Record<string, string>;
};

const categories = new Set<EventCategory>(['pack', 'den', 'family']);
const statuses = new Set<EventStatus>(['scheduled', 'tentative', 'cancelled']);
const visibilities = new Set<EventVisibility>(['draft', 'published', 'archived']);
// The admin dropdown and this validator read the same array, so they can never disagree.
const milestoneKeys = new Set<string>(annualProgram.map((entry) => entry.key));
const adminFields = `id, slug, created_at, updated_at, published_at, archived_at, visibility,
  status, category, title, summary, description, starts_at, ends_at, timezone,
  location_name, address, audience, what_to_bring, cost, registration_url, milestone,
  created_by, updated_by`;
const calendarFields = `calendar_events.id, slug, created_at, updated_at, status, category, title, summary,
  description, starts_at, ends_at, timezone, location_name, address, audience,
  what_to_bring, cost, registration_url, milestone,
  (SELECT COUNT(*) FROM event_audit_log WHERE event_id = calendar_events.id) AS sequence`;

export class EventRouteError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function handleEventRoute(context: EventRouteContext): Promise<Response | null> {
  const { request, env, url } = context;

  if (url.pathname === '/api/events' && request.method === 'GET') {
    const events = await readPublishedEvents(env);
    const now = new Date().toISOString();
    return context.json(
      {
        ok: true,
        events: events
          .filter((event) => (event.ends_at ?? event.starts_at) >= now)
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
          .slice(0, 200)
          .map(publicEvent),
      },
      200,
      context.publicHeaders(request),
    );
  }

  if (url.pathname === '/api/calendar.ics' && (request.method === 'GET' || request.method === 'HEAD')) {
    const events = await readPublishedEvents(env);
    const calendar = renderCalendar(events.sort((a, b) => b.starts_at.localeCompare(a.starts_at)).slice(0, 500), env.PUBLIC_SITE_ORIGIN);
    const etag = `"${await sha256(calendar)}"`;
    const headers = {
      ...context.publicHeaders(request),
      'cache-control': 'public, no-cache, must-revalidate',
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': 'inline; filename="pack-170-calendar.ics"',
      etag,
    };
    if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
    return new Response(request.method === 'HEAD' ? null : calendar, { status: 200, headers });
  }

  const publicMatch = url.pathname.match(/^\/api\/events\/([a-z0-9-]{2,80})$/);
  if (publicMatch && request.method === 'GET') {
    const event = (await readPublishedEvents(env)).find(
      (candidate) => candidate.slug === publicMatch[1] && (candidate.ends_at ?? candidate.starts_at) >= new Date().toISOString(),
    );
    if (!event) return context.json({ ok: false, error: 'Event not found.' }, 404, context.publicHeaders(request));
    return context.json({ ok: true, event: publicEvent(event) }, 200, context.publicHeaders(request));
  }

  if (!url.pathname.startsWith('/api/admin/events')) return null;

  const authHeader = (request.headers.get('authorization') ?? '').trim();
  const apiKey = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : null;
  const isApiKeyAuth = typeof apiKey === 'string' && apiKey.length > 0 && apiKey === env.CALENDAR_API_KEY;
  let actor: string;
  if (isApiKeyAuth) {
    actor = 'api-key';
  } else {
    const identity = await context.requireAccess(request, env);
    actor = identity.email ?? '';
    if (!actor) return context.json({ ok: false, error: 'Authenticated email required.' }, 403, context.adminHeaders(env));
  }

  if (url.pathname === '/api/admin/events' && request.method === 'GET') {
    const rawVisibility = url.searchParams.get('visibility');
    const visibility = rawVisibility && visibilities.has(rawVisibility as EventVisibility) ? rawVisibility : null;
    const statement = env.DB.prepare(`
      SELECT ${adminFields} FROM calendar_events
      ${visibility ? 'WHERE visibility = ?' : ''}
      ORDER BY starts_at ASC LIMIT 300
    `);
    const result = visibility ? await statement.bind(visibility).run<EventRow>() : await statement.run<EventRow>();
    return context.json({ ok: true, events: result.results }, 200, context.adminHeaders(env));
  }

  if (url.pathname === '/api/admin/events' && request.method === 'POST') {
    if (!isApiKeyAuth) context.enforceSameOrigin(request, env.ADMIN_ORIGIN);
    requireJsonRequest(request);
    const input = parseEventInput(await readJson(request), 'create');
    const id = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare(
        `
        INSERT INTO calendar_events (
          id, slug, visibility, status, category, title, summary, description,
          starts_at, ends_at, timezone, location_name, address, audience,
          what_to_bring, cost, registration_url, milestone, published_at, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).bind(
        id,
        input.slug,
        'draft',
        input.status,
        input.category,
        input.title,
        input.summary,
        input.description,
        input.startsAt,
        input.endsAt,
        input.timezone,
        input.locationName,
        input.address,
        input.audience,
        input.whatToBring,
        input.cost,
        input.registrationUrl,
        input.milestone,
        null,
        actor,
        actor,
      ),
      env.DB.prepare("INSERT INTO event_audit_log (event_id, actor_email, action, detail) VALUES (?, ?, 'created', ?)").bind(
        id,
        actor,
        'draft',
      ),
    ]);
    return context.json({ ok: true, id, slug: input.slug }, 201, context.adminHeaders(env));
  }

  const eventMatch = url.pathname.match(/^\/api\/admin\/events\/([0-9a-f-]{36})$/i);
  if (!eventMatch) return context.json({ ok: false, error: 'Not found.' }, 404, context.adminHeaders(env));
  const id = eventMatch[1];

  if (request.method === 'GET') {
    const event = await env.DB.prepare(`SELECT ${adminFields} FROM calendar_events WHERE id = ?`).bind(id).first<EventRow>();
    if (!event) return context.json({ ok: false, error: 'Event not found.' }, 404, context.adminHeaders(env));
    const audit = await env.DB.prepare(
      'SELECT created_at, actor_email, action, detail FROM event_audit_log WHERE event_id = ? ORDER BY created_at DESC LIMIT 30',
    )
      .bind(id)
      .run();
    return context.json({ ok: true, event, audit: audit.results }, 200, context.adminHeaders(env));
  }

  if (request.method === 'PUT') {
    if (!isApiKeyAuth) context.enforceSameOrigin(request, env.ADMIN_ORIGIN);
    requireJsonRequest(request);
    const existing = await env.DB.prepare('SELECT visibility FROM calendar_events WHERE id = ?')
      .bind(id)
      .first<{ visibility: EventVisibility }>();
    if (!existing) return context.json({ ok: false, error: 'Event not found.' }, 404, context.adminHeaders(env));
    const input = parseEventInput(await readJson(request), 'update');
    const now = new Date().toISOString();
    const action =
      input.visibility === 'archived' && existing.visibility !== 'archived'
        ? 'archived'
        : input.visibility === 'published' && existing.visibility !== 'published'
          ? 'published'
          : existing.visibility === 'archived' && input.visibility !== 'archived'
            ? 'restored'
            : 'updated';
    await env.DB.batch([
      env.DB.prepare(
        `
        UPDATE calendar_events SET slug = ?, visibility = ?, status = ?, category = ?,
          title = ?, summary = ?, description = ?, starts_at = ?, ends_at = ?, timezone = ?,
          location_name = ?, address = ?, audience = ?, what_to_bring = ?, cost = ?,
          registration_url = ?, milestone = ?,
          published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END,
          archived_at = CASE WHEN ? = 'archived' THEN ? ELSE NULL END,
          updated_at = ?, updated_by = ? WHERE id = ?
      `,
      ).bind(
        input.slug,
        input.visibility,
        input.status,
        input.category,
        input.title,
        input.summary,
        input.description,
        input.startsAt,
        input.endsAt,
        input.timezone,
        input.locationName,
        input.address,
        input.audience,
        input.whatToBring,
        input.cost,
        input.registrationUrl,
        input.milestone,
        input.visibility,
        now,
        input.visibility,
        now,
        now,
        actor,
        id,
      ),
      env.DB.prepare('INSERT INTO event_audit_log (event_id, actor_email, action, detail) VALUES (?, ?, ?, ?)').bind(
        id,
        actor,
        action,
        `${existing.visibility} -> ${input.visibility}`,
      ),
    ]);
    return context.json({ ok: true, id, slug: input.slug }, 200, context.adminHeaders(env));
  }

  return context.json({ ok: false, error: 'Method not allowed.' }, 405, context.adminHeaders(env));
}

function publicEvent(
  event: CalendarEventRow,
): Omit<EventRow, 'id' | 'created_at' | 'updated_at' | 'published_at' | 'archived_at' | 'visibility' | 'created_by' | 'updated_by'> {
  return {
    slug: event.slug,
    status: event.status,
    category: event.category,
    title: event.title,
    summary: event.summary,
    description: event.description,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    timezone: event.timezone,
    location_name: event.location_name,
    address: event.address,
    audience: event.audience,
    what_to_bring: event.what_to_bring,
    cost: event.cost,
    registration_url: event.registration_url,
    milestone: event.milestone,
  };
}

type CalendarAdapterEnv = Env & { CALENDAR_READ_SOURCE?: string; CALENDAR_CMS_ORIGIN?: string };

async function readPublishedEvents(env: CalendarAdapterEnv): Promise<CalendarEventRow[]> {
  const source = env.CALENDAR_READ_SOURCE ?? 'legacy';
  if (source === 'cms') return readCmsProjection(env);
  const legacy = await env.DB.prepare(
    `SELECT ${calendarFields} FROM calendar_events WHERE visibility = 'published' ORDER BY starts_at DESC LIMIT 500`,
  ).run<CalendarEventRow>();
  if (source === 'shadow') {
    try {
      const cms = await readCmsProjection(env);
      const legacyFingerprint = legacy.results.map((event) => `${event.slug}:${event.id}:${event.sequence}`).join('|');
      const cmsFingerprint = cms.map((event) => `${event.slug}:${event.id}:${event.sequence}`).join('|');
      if (legacyFingerprint !== cmsFingerprint)
        console.error(JSON.stringify({ event: 'calendar_shadow_mismatch', legacy: legacy.results.length, cms: cms.length }));
    } catch (error) {
      console.error(
        JSON.stringify({ event: 'calendar_shadow_read_failed', error: error instanceof Error ? error.message : 'Unknown error' }),
      );
    }
  }
  return legacy.results;
}

async function readCmsProjection(env: CalendarAdapterEnv): Promise<CalendarEventRow[]> {
  if (!env.CALENDAR_CMS_ORIGIN) throw new EventRouteError(502, 'The Pack 170 calendar is temporarily unavailable.');
  let response: Response;
  try {
    response = await fetch(`${env.CALENDAR_CMS_ORIGIN.replace(/\/$/, '')}/api/calendar-projection/v1`, {
      headers: { accept: 'application/json' },
    });
  } catch (error) {
    console.error(
      JSON.stringify({ event: 'calendar_adapter_fetch_failed', error: error instanceof Error ? error.message : 'Unknown error' }),
    );
    throw new EventRouteError(502, 'The Pack 170 calendar is temporarily unavailable.');
  }
  if (!response.ok) {
    console.error(JSON.stringify({ event: 'calendar_adapter_bad_status', status: response.status }));
    throw new EventRouteError(502, 'The Pack 170 calendar is temporarily unavailable.');
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new EventRouteError(502, 'The Pack 170 calendar is temporarily unavailable.');
  }
  if (
    !body ||
    typeof body !== 'object' ||
    (body as { version?: unknown }).version !== 'v1' ||
    !Array.isArray((body as { events?: unknown }).events)
  ) {
    console.error(JSON.stringify({ event: 'calendar_adapter_invalid_projection' }));
    throw new EventRouteError(502, 'The Pack 170 calendar is temporarily unavailable.');
  }
  try {
    return (body as { events: unknown[] }).events.map(validateCmsEvent);
  } catch (error) {
    console.error(
      JSON.stringify({ event: 'calendar_adapter_invalid_event', error: error instanceof Error ? error.message : 'Unknown error' }),
    );
    throw new EventRouteError(502, 'The Pack 170 calendar is temporarily unavailable.');
  }
}

function validateCmsEvent(value: unknown): CalendarEventRow {
  if (!value || typeof value !== 'object') throw new Error('Event is not an object');
  const event = value as Record<string, unknown>;
  const requiredText = (key: string) => {
    if (typeof event[key] !== 'string' || !event[key]) throw new Error(`Missing ${key}`);
    return event[key] as string;
  };
  const optionalText = (key: string) => (event[key] === null || event[key] === undefined ? null : requiredText(key));
  const id = requiredText('legacy_event_id');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid legacy_event_id');
  const sequence = event.adapter_revision;
  if (!Number.isInteger(sequence) || (sequence as number) < 0) throw new Error('Invalid adapter_revision');
  const status = requiredText('status');
  const category = requiredText('category');
  const timezone = requiredText('timezone');
  if (!statuses.has(status as EventStatus) || !categories.has(category as EventCategory) || timezone !== 'America/New_York')
    throw new Error('Invalid calendar enum');
  const startsAt = new Date(requiredText('starts_at')).toISOString();
  const ends = optionalText('ends_at');
  const endsAt = ends ? new Date(ends).toISOString() : null;
  if (Number.isNaN(Date.parse(startsAt)) || (endsAt && endsAt < startsAt)) throw new Error('Invalid event times');
  return {
    id,
    slug: requiredText('slug'),
    created_at: new Date(requiredText('created_at')).toISOString(),
    updated_at: new Date(requiredText('updated_at')).toISOString(),
    published_at: optionalText('published_at'),
    archived_at: null,
    visibility: 'published',
    status: status as EventStatus,
    category: category as EventCategory,
    title: requiredText('title'),
    summary: requiredText('summary'),
    description: requiredText('description'),
    starts_at: startsAt,
    ends_at: endsAt,
    timezone: 'America/New_York',
    location_name: optionalText('location_name'),
    address: optionalText('address'),
    audience: requiredText('audience'),
    what_to_bring: optionalText('what_to_bring'),
    cost: optionalText('cost'),
    registration_url: optionalText('registration_url'),
    milestone: optionalText('milestone'),
    created_by: 'cms-adapter',
    updated_by: 'cms-adapter',
    sequence: sequence as number,
  };
}

function requireJsonRequest(request: Request): void {
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    throw new EventRouteError(415, 'Event changes must be sent as JSON.');
  }
}

async function readJson(request: Request): Promise<EventInput> {
  if (!request.body) throw new EventRouteError(400, 'The event request was empty.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 30_000) {
      await reader.cancel('Event body exceeded limit');
      throw new EventRouteError(413, 'Event request is too large.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as EventInput;
  } catch {
    throw new EventRouteError(400, 'Event request contains invalid JSON.');
  }
}

function parseEventInput(input: EventInput, mode: 'create' | 'update') {
  const title = text(input.title, 'Title', 3, 160);
  const slug = slugValue(input.slug, title);
  const summary = text(input.summary, 'Summary', 10, 500);
  const description = text(input.description, 'Description', 10, 8_000);
  const audience = text(input.audience, 'Audience', 2, 300);
  const startsAt = isoDate(input.startsAt, 'Start date and time');
  const endsAt = optionalIsoDate(input.endsAt, 'End date and time');
  if (endsAt && endsAt < startsAt) throw new EventRouteError(400, 'End date must be after the start date.');
  if (input.timezone !== undefined && input.timezone !== 'America/New_York')
    throw new EventRouteError(400, 'Pack 170 events use America/New_York.');
  const category = enumValue(input.category, categories, 'category');
  const status = enumValue(input.status, statuses, 'status');
  const visibility = mode === 'create' ? 'draft' : enumValue(input.visibility, visibilities, 'visibility');
  const registrationUrl = optionalUrl(input.registrationUrl);
  return {
    title,
    slug,
    summary,
    description,
    audience,
    startsAt,
    endsAt,
    category,
    status,
    visibility,
    timezone: 'America/New_York',
    locationName: optionalText(input.locationName, 200),
    address: optionalText(input.address, 300),
    whatToBring: optionalText(input.whatToBring, 2_000),
    cost: optionalText(input.cost, 500),
    registrationUrl,
    milestone: milestoneValue(input.milestone),
  };
}

function text(value: unknown, label: string, minimum: number, maximum: number): string {
  if (typeof value !== 'string') throw new EventRouteError(400, `${label} is required.`);
  const result = value.trim();
  if (result.length < minimum) throw new EventRouteError(400, `${label} is required.`);
  if (result.length > maximum) throw new EventRouteError(400, `${label} is too long.`);
  return result;
}
function optionalText(value: unknown, maximum: number): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const result = value.trim();
  if (result.length > maximum) throw new EventRouteError(400, 'An optional event field is too long.');
  return result;
}
function enumValue<T extends string>(value: unknown, allowed: Set<T>, label: string): T {
  if (typeof value !== 'string' || !allowed.has(value as T)) throw new EventRouteError(400, `Choose a valid ${label}.`);
  return value as T;
}
function isoDate(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim() || Number.isNaN(Date.parse(value)))
    throw new EventRouteError(400, `${label} is required.`);
  return new Date(value).toISOString();
}
function optionalIsoDate(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === '') return null;
  return isoDate(value, label);
}
function slugValue(value: unknown, title: string): string {
  const source = typeof value === 'string' && value.trim() ? value : title;
  const slug = source
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  if (slug.length < 2) throw new EventRouteError(400, 'Enter a valid event slug.');
  return slug;
}
function optionalUrl(value: unknown): string | null {
  const raw = optionalText(value, 2_000);
  if (!raw) return null;
  const url = new URL(raw);
  if (!['https:', 'http:'].includes(url.protocol)) throw new EventRouteError(400, 'Registration link must use HTTP or HTTPS.');
  return url.toString();
}
function milestoneValue(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const key = value.trim();
  if (!milestoneKeys.has(key)) throw new EventRouteError(400, 'Choose a valid milestone.');
  return key;
}

function renderCalendar(events: CalendarEventRow[], publicOrigin: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cub Scout Pack 170//Pack Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pack 170 Calendar',
    'X-WR-CALDESC:Published events for Cub Scout Pack 170 in Macon\\, Georgia.',
    'X-WR-TIMEZONE:America/New_York',
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
  ];

  for (const event of events) {
    const description = [
      event.description,
      `Audience: ${event.audience}`,
      event.what_to_bring ? `What to bring: ${event.what_to_bring}` : null,
      event.cost ? `Cost: ${event.cost}` : null,
      event.registration_url ? `Registration: ${event.registration_url}` : null,
    ]
      .filter((value): value is string => Boolean(value))
      .join('\n\n');
    const location = [event.location_name, event.address].filter(Boolean).join(', ');
    const eventUrl = `${publicOrigin.replace(/\/$/, '')}/events/?event=${encodeURIComponent(event.slug)}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@macon170.com`,
      `DTSTAMP:${icsDate(event.updated_at)}`,
      `CREATED:${icsDate(event.created_at)}`,
      `LAST-MODIFIED:${icsDate(event.updated_at)}`,
      `SEQUENCE:${event.sequence}`,
      `DTSTART:${icsDate(event.starts_at)}`,
    );
    if (event.ends_at) lines.push(`DTEND:${icsDate(event.ends_at)}`);
    lines.push(
      `SUMMARY:${escapeIcsText(event.title)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      ...(location ? [`LOCATION:${escapeIcsText(location)}`] : []),
      `URL:${eventUrl}`,
      `STATUS:${event.status === 'cancelled' ? 'CANCELLED' : event.status === 'tentative' ? 'TENTATIVE' : 'CONFIRMED'}`,
      `CATEGORIES:${escapeIcsText(event.category)}`,
      'TRANSP:OPAQUE',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}

function icsDate(value: string): string {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const folded: string[] = [];
  let current = '';
  for (const character of line) {
    if (encoder.encode(current + character).byteLength > 75) {
      folded.push(current);
      current = ` ${character}`;
    } else {
      current += character;
    }
  }
  folded.push(current);
  return folded.join('\r\n');
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
