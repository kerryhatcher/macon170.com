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
  created_by: string;
  updated_by: string;
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
};

type EventRouteContext = {
  request: Request;
  env: Env;
  url: URL;
  requireAccess: (request: Request, env: Env) => Promise<{ email?: string }>;
  enforceSameOrigin: (request: Request, origin: string) => void;
  json: (data: unknown, status?: number, headers?: HeadersInit) => Response;
  publicHeaders: () => Record<string, string>;
  adminHeaders: (env: Env) => Record<string, string>;
};

const categories = new Set<EventCategory>(['pack', 'den', 'family']);
const statuses = new Set<EventStatus>(['scheduled', 'tentative', 'cancelled']);
const visibilities = new Set<EventVisibility>(['draft', 'published', 'archived']);
const adminFields = `id, slug, created_at, updated_at, published_at, archived_at, visibility,
  status, category, title, summary, description, starts_at, ends_at, timezone,
  location_name, address, audience, what_to_bring, cost, registration_url,
  created_by, updated_by`;
const publicFields = `slug, status, category, title, summary, description, starts_at, ends_at,
  timezone, location_name, address, audience, what_to_bring, cost, registration_url`;

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
    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      `
      SELECT ${publicFields} FROM calendar_events
      WHERE visibility = 'published' AND COALESCE(ends_at, starts_at) >= ?
      ORDER BY starts_at ASC LIMIT 200
    `,
    )
      .bind(now)
      .run<EventRow>();
    return context.json({ ok: true, events: result.results }, 200, context.publicHeaders());
  }

  const publicMatch = url.pathname.match(/^\/api\/events\/([a-z0-9-]{2,80})$/);
  if (publicMatch && request.method === 'GET') {
    const event = await env.DB.prepare(
      `SELECT ${publicFields} FROM calendar_events WHERE slug = ? AND visibility = 'published' AND COALESCE(ends_at, starts_at) >= ?`,
    )
      .bind(publicMatch[1], new Date().toISOString())
      .first<EventRow>();
    if (!event) return context.json({ ok: false, error: 'Event not found.' }, 404, context.publicHeaders());
    return context.json({ ok: true, event }, 200, context.publicHeaders());
  }

  if (!url.pathname.startsWith('/api/admin/events')) return null;
  const identity = await context.requireAccess(request, env);
  const actor = identity.email;
  if (!actor) return context.json({ ok: false, error: 'Authenticated email required.' }, 403, context.adminHeaders(env));

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
    context.enforceSameOrigin(request, env.ADMIN_ORIGIN);
    requireJsonRequest(request);
    const input = parseEventInput(await readJson(request), 'create');
    const id = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare(
        `
        INSERT INTO calendar_events (
          id, slug, visibility, status, category, title, summary, description,
          starts_at, ends_at, timezone, location_name, address, audience,
          what_to_bring, cost, registration_url, published_at, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    context.enforceSameOrigin(request, env.ADMIN_ORIGIN);
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
          registration_url = ?, published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END,
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
