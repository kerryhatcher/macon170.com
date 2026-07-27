export type LeadershipRow = {
  id: string;
  slug: string;
  role: string;
  name: string | null;
  bio: string | null;
  sort_order: number;
  updated_at: string;
  updated_by: string;
};

// updated_by carries a verified Cloudflare Access email — never expose it on the
// public shape. It's only ever returned via the authenticated admin GET.
export type PublicRole = Omit<LeadershipRow, 'updated_by'> & { vacant: boolean };
type AdminRole = LeadershipRow & { vacant: boolean };

type LeadershipInput = {
  role?: unknown;
  name?: unknown;
  bio?: unknown;
  sortOrder?: unknown;
};

type LeadershipRouteContext = {
  request: Request;
  env: Env;
  url: URL;
  requireAccess: (request: Request, env: Env) => Promise<{ email?: string }>;
  enforceSameOrigin: (request: Request, origin: string) => void;
  json: (data: unknown, status?: number, headers?: HeadersInit) => Response;
  publicHeaders: (request: Request) => Record<string, string>;
  adminHeaders: (env: Env) => Record<string, string>;
};

const fields = 'id, slug, role, name, bio, sort_order, updated_at, updated_by';

export class LeadershipRouteError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Shared by the public endpoint and the HTMLRewriter injection so both agree on
// what "vacant" means.
export async function readRoster(db: D1Database): Promise<PublicRole[]> {
  const result = await db.prepare(`SELECT ${fields} FROM leadership_roles ORDER BY sort_order ASC`).run<LeadershipRow>();
  return result.results.map(({ updated_by, ...row }) => ({
    ...row,
    vacant: !row.name || row.name.trim() === '',
  }));
}

// Admin-only counterpart to readRoster: same rows, but keeps updated_by so the
// admin panel can show who last touched a role.
async function readAdminRoster(db: D1Database): Promise<AdminRole[]> {
  const result = await db.prepare(`SELECT ${fields} FROM leadership_roles ORDER BY sort_order ASC`).run<LeadershipRow>();
  return result.results.map((row) => ({ ...row, vacant: !row.name || row.name.trim() === '' }));
}

export async function handleLeadershipRoute(context: LeadershipRouteContext): Promise<Response | null> {
  const { request, env, url } = context;

  if (url.pathname === '/api/leadership' && request.method === 'GET') {
    const roles = await readRoster(env.DB);
    return context.json({ ok: true, roles }, 200, context.publicHeaders(request));
  }

  if (!url.pathname.startsWith('/api/admin/leadership')) return null;

  const identity = await context.requireAccess(request, env);
  const actor = identity.email ?? '';
  if (!actor) return context.json({ ok: false, error: 'Authenticated email required.' }, 403, context.adminHeaders(env));

  if (url.pathname === '/api/admin/leadership' && request.method === 'GET') {
    const roles = await readAdminRoster(env.DB);
    return context.json({ ok: true, roles }, 200, context.adminHeaders(env));
  }

  if (url.pathname === '/api/admin/leadership' && request.method === 'POST') {
    context.enforceSameOrigin(request, env.ADMIN_ORIGIN);
    requireJsonRequest(request);
    const input = parseLeadershipInput(await readJson(request));
    const slug = slugValue(input.role);
    const existing = await env.DB.prepare('SELECT id FROM leadership_roles WHERE slug = ?').bind(slug).first();
    if (existing) throw new LeadershipRouteError(409, 'Another role already uses that name.');
    const id = crypto.randomUUID();
    try {
      await env.DB.prepare(`INSERT INTO leadership_roles (id, slug, role, name, bio, sort_order, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, slug, input.role, input.name, input.bio, input.sortOrder ?? 500, actor)
        .run();
    } catch (error) {
      // The pre-check above narrows the window but doesn't close it — two concurrent
      // POSTs for the same role can both pass the SELECT. Surface the same 409 the
      // pre-check gives instead of letting the UNIQUE violation fall through as a 500.
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed: leadership_roles.slug')) {
        throw new LeadershipRouteError(409, 'Another role already uses that name.');
      }
      throw error;
    }
    return context.json({ ok: true, id, slug }, 201, context.adminHeaders(env));
  }

  const match = url.pathname.match(/^\/api\/admin\/leadership\/([0-9a-f-]{36})$/i);
  if (!match) return context.json({ ok: false, error: 'Not found.' }, 404, context.adminHeaders(env));
  const id = match[1];

  if (request.method === 'PUT') {
    context.enforceSameOrigin(request, env.ADMIN_ORIGIN);
    requireJsonRequest(request);
    const row = await env.DB.prepare('SELECT id FROM leadership_roles WHERE id = ?').bind(id).first();
    if (!row) return context.json({ ok: false, error: 'Role not found.' }, 404, context.adminHeaders(env));
    const input = parseLeadershipInput(await readJson(request));
    // slug is deliberately not updated: den pages and other consumers reference it.
    // PUT is a full replace of role/name/bio, not a partial patch: the only client is
    // the admin form (Task 5), which always submits all three fields, so an omitted
    // name/bio here is intentionally treated as "clear it" rather than "leave it".
    await env.DB.prepare(
      `UPDATE leadership_roles SET role = ?, name = ?, bio = ?, sort_order = COALESCE(?, sort_order),
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_by = ? WHERE id = ?`,
    )
      .bind(input.role, input.name, input.bio, input.sortOrder, actor, id)
      .run();
    return context.json({ ok: true, id }, 200, context.adminHeaders(env));
  }

  if (request.method === 'DELETE') {
    context.enforceSameOrigin(request, env.ADMIN_ORIGIN);
    const result = await env.DB.prepare('DELETE FROM leadership_roles WHERE id = ?').bind(id).run();
    if (!result.meta.changes) return context.json({ ok: false, error: 'Role not found.' }, 404, context.adminHeaders(env));
    return context.json({ ok: true }, 200, context.adminHeaders(env));
  }

  return context.json({ ok: false, error: 'Method not allowed.' }, 405, context.adminHeaders(env));
}

function requireJsonRequest(request: Request): void {
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    throw new LeadershipRouteError(415, 'Roster changes must be sent as JSON.');
  }
}

async function readJson(request: Request): Promise<LeadershipInput> {
  if (!request.body) throw new LeadershipRouteError(400, 'The roster request was empty.');
  const text = await request.text();
  if (text.length > 8_000) throw new LeadershipRouteError(413, 'Roster request is too large.');
  try {
    return JSON.parse(text) as LeadershipInput;
  } catch {
    throw new LeadershipRouteError(400, 'Roster request contains invalid JSON.');
  }
}

function parseLeadershipInput(input: LeadershipInput) {
  if (typeof input.role !== 'string' || !input.role.trim()) throw new LeadershipRouteError(400, 'A role name is required.');
  const role = input.role.trim();
  if (role.length > 120) throw new LeadershipRouteError(400, 'That role name is too long.');
  return {
    role,
    name: optionalText(input.name, 120, 'name'),
    bio: optionalText(input.bio, 600, 'bio'),
    sortOrder: parseSortOrder(input.sortOrder),
  };
}

function parseSortOrder(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new LeadershipRouteError(400, 'Sort order must be a whole number.');
  }
  return value;
}

function optionalText(value: unknown, maximum: number, label: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const result = value.trim();
  if (result.length > maximum) throw new LeadershipRouteError(400, `That ${label} is too long.`);
  return result;
}

function slugValue(role: string): string {
  const slug = role
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  if (slug.length < 2) throw new LeadershipRouteError(400, 'Enter a valid role name.');
  return slug;
}
