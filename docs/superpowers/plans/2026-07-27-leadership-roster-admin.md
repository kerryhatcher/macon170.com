# Leadership Roster Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a volunteer edit the adult leadership roster in the admin panel and have the public site show it immediately, with no deploy and no JavaScript required in the visitor's browser.

**Architecture:** A `leadership_roles` D1 table seeded by migration. A worker route module (`leadership-routes.ts`) serves a public read endpoint and admin CRUD, mirroring `event-routes.ts`. A worker-rendered admin page (`leadership-admin.ts`) mirrors `calendar-admin.ts`. Public pages carry a `<div data-roster="...">` placeholder that the worker fills server-side with `HTMLRewriter` before returning the static asset.

**Tech Stack:** Cloudflare Workers, D1 (SQLite, STRICT tables), Astro 5 static output, TypeScript, Vitest via `@cloudflare/vitest-pool-workers`, Playwright for e2e.

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-07-27-leadership-roster-admin-design.md`.
- **No `email` column** anywhere in this feature. Pack policy publishes no adult email addresses.
- **Field limits:** `role` 1–120 chars, `name` max 120, `bio` max 600.
- **`vacant` is computed, never stored:** `name IS NULL OR trim(name) = ''`.
- **`slug` is generated once from `role` and never edited afterward.** Consumers reference it.
- **Timestamps:** text, via `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`, matching `calendar_events`.
- **Tables are `STRICT`.**
- **Do not touch `ranks` in `src/data/pack.ts`.** It owns the rank grid on `/` and `/join/`.
- **Commit messages must follow Conventional Commits** — a git hook rejects anything else. Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore. Imperative mood, no trailing period.
- **`bun run ci` must pass before this is done:** `lint`, `check`, `format:check`, `test`, `test:e2e`.
- **Run `bunx prettier --write` on every file you create or modify.** `format:check` is part of CI.
- **After code changes, run `graphify update .`** per `CLAUDE.md`.

## Deviation from the spec, already decided

The spec says the D1 query result is "memoized per isolate." **Do not implement memoization.** A cache means a volunteer saves an edit and still sees the old roster for the cache lifetime, which defeats the entire goal. Eleven rows from one indexed table per request is cheap. Revisit only if D1 latency is measured to be a problem.

## Test harness facts you need

- Tests live at `worker/**/*.test.ts` and run under `@cloudflare/vitest-pool-workers` against **real local D1**.
- Every D1 test file must start with:
  ```ts
  import { env, exports } from 'cloudflare:workers';
  import { applyD1Migrations } from 'cloudflare:test';
  import { beforeAll, describe, expect, it } from 'vitest';

  declare module 'cloudflare:workers' {
    interface ProvidedEnv extends Env {
      TEST_MIGRATIONS: D1Migration[];
    }
  }

  beforeAll(async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  });
  ```
- `wrangler.test.jsonc` sets `ENVIRONMENT: "development"`, and `requireAccess` (`worker/index.ts:312`) returns `{ email: 'local-volunteer@example.invalid' }` for `localhost`/`127.0.0.1` in development. **So fetch admin routes as `http://localhost/...` in tests and auth is bypassed.** Fetching `https://admin.macon170.com/...` in a test will 403.
- Call the worker with `exports.default.fetch(url, init)`.

## File Structure

| File                                             | Responsibility                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| `migrations/0003_create_leadership.sql` (create) | Table + seed rows                                                            |
| `worker/leadership-routes.ts` (create)           | Public read + admin CRUD, validation, `LeadershipRouteError`                 |
| `worker/roster-inject.ts` (create)               | `HTMLRewriter` injection: query D1, build markup, fill placeholder           |
| `worker/leadership-admin.ts` (create)            | Worker-rendered admin page (HTML + inline CSS + inline script)               |
| `worker/index.ts` (modify)                       | Wire the route module, the admin page, the injection, and the third nav link |
| `worker/leadership-routes.test.ts` (create)      | Route + validation + auth tests                                              |
| `worker/roster-inject.test.ts` (create)          | Injection and D1-failure-fallback tests                                      |
| `worker/admin-scripts.unit.test.ts` (modify)     | Add `/admin/leadership` to the existing inline-script parse check            |
| `src/pages/about.astro` (modify)                 | Replace Markdown import with placeholder; add bio style                      |
| `src/data/leadership.md` (delete)                | Superseded by D1                                                             |
| `docs/placeholders.md` (modify)                  | Record the change                                                            |

---

### Task 1: Schema and seed

**Files:**

- Create: `migrations/0003_create_leadership.sql`
- Test: `worker/leadership-routes.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: table `leadership_roles` with columns `id, slug, role, name, bio, sort_order, created_at, updated_at, updated_by`. Eleven seeded rows.

- [ ] **Step 1: Write the failing test**

Create `worker/leadership-routes.test.ts`:

```ts
import { env, exports } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:workers' {
  interface ProvidedEnv extends Env {
    TEST_MIGRATIONS: D1Migration[];
  }
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe('leadership_roles schema', () => {
  it('seeds eleven roles in display order', async () => {
    const result = await env.DB.prepare('SELECT slug, role, name FROM leadership_roles ORDER BY sort_order ASC').run<{
      slug: string;
      role: string;
      name: string | null;
    }>();
    expect(result.results).toHaveLength(11);
    expect(result.results[0]).toMatchObject({ slug: 'cubmaster', role: 'Cubmaster', name: 'Kerry Hatcher' });
    expect(result.results.map((row) => row.slug)).toContain('webelos-den-leader');
  });

  it('seeds known holders and leaves the rest vacant', async () => {
    const filled = await env.DB.prepare(
      "SELECT slug FROM leadership_roles WHERE name IS NOT NULL AND trim(name) <> '' ORDER BY sort_order",
    ).run<{
      slug: string;
    }>();
    expect(filled.results.map((row) => row.slug)).toEqual([
      'cubmaster',
      'committee-chair',
      'chartered-organization-representative',
      'webelos-den-leader',
    ]);
  });

  it('rejects a duplicate slug', async () => {
    await expect(
      env.DB.prepare(
        "INSERT INTO leadership_roles (id, slug, role, sort_order, updated_by) VALUES ('x', 'cubmaster', 'Dup', 999, 'test')",
      ).run(),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- worker/leadership-routes.test.ts`
Expected: FAIL — `no such table: leadership_roles`.

- [ ] **Step 3: Write the migration**

Create `migrations/0003_create_leadership.sql`:

```sql
CREATE TABLE leadership_roles (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  name TEXT,
  bio TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by TEXT NOT NULL
) STRICT;

CREATE INDEX idx_leadership_roles_order ON leadership_roles(sort_order);

-- Seeded from src/data/leadership.md as of 2026-07-27. Names are editable in the
-- admin panel afterward, so unverified entries are seeded rather than withheld.
INSERT INTO leadership_roles (id, slug, role, name, bio, sort_order, updated_by) VALUES
  ('0f1d2b4a-0001-4000-8000-000000000001', 'cubmaster', 'Cubmaster', 'Kerry Hatcher', NULL, 10, 'migration'),
  ('0f1d2b4a-0002-4000-8000-000000000002', 'committee-chair', 'Committee Chair', 'Will Roche', NULL, 20, 'migration'),
  ('0f1d2b4a-0003-4000-8000-000000000003', 'chartered-organization-representative', 'Chartered Organization Representative', 'Rev. Caitlin Childers Brown', 'Co-pastor at Highland Hills Baptist Church.', 30, 'migration'),
  ('0f1d2b4a-0004-4000-8000-000000000004', 'treasurer', 'Treasurer', NULL, NULL, 40, 'migration'),
  ('0f1d2b4a-0005-4000-8000-000000000005', 'advancement-chair', 'Advancement Chair', NULL, NULL, 50, 'migration'),
  ('0f1d2b4a-0006-4000-8000-000000000006', 'lion-den-leader', 'Lion Den Leader', NULL, NULL, 60, 'migration'),
  ('0f1d2b4a-0007-4000-8000-000000000007', 'tiger-den-leader', 'Tiger Den Leader', NULL, NULL, 70, 'migration'),
  ('0f1d2b4a-0008-4000-8000-000000000008', 'wolf-den-leader', 'Wolf Den Leader', NULL, NULL, 80, 'migration'),
  ('0f1d2b4a-0009-4000-8000-000000000009', 'bear-den-leader', 'Bear Den Leader', NULL, NULL, 90, 'migration'),
  ('0f1d2b4a-0010-4000-8000-000000000010', 'webelos-den-leader', 'Webelos Den Leader', 'Stephanie Hatcher', NULL, 100, 'migration'),
  ('0f1d2b4a-0011-4000-8000-000000000011', 'arrow-of-light-den-leader', 'Arrow of Light Den Leader', NULL, NULL, 110, 'migration');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- worker/leadership-routes.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
bunx prettier --write migrations/0003_create_leadership.sql worker/leadership-routes.test.ts
git add migrations/0003_create_leadership.sql worker/leadership-routes.test.ts
git commit -m "feat: add leadership_roles table with seeded roster"
```

---

### Task 2: Public read endpoint

**Files:**

- Create: `worker/leadership-routes.ts`
- Modify: `worker/index.ts` (import + wire next to the `handleEventRoute` call at `worker/index.ts:73-83`, and the catch block at `:110`)
- Test: `worker/leadership-routes.test.ts`

**Interfaces:**

- Consumes: table from Task 1. `context.json`, `context.publicHeaders`, `context.adminHeaders`, `context.requireAccess`, `context.enforceSameOrigin` — all already defined in `worker/index.ts`.
- Produces:
  - `export class LeadershipRouteError extends Error` with `status: number`.
  - `export async function handleLeadershipRoute(context: LeadershipRouteContext): Promise<Response | null>`
  - `export type LeadershipRow = { id: string; slug: string; role: string; name: string | null; bio: string | null; sort_order: number; updated_at: string; updated_by: string }`
  - `export async function readRoster(db: D1Database): Promise<Array<LeadershipRow & { vacant: boolean }>>` — used by Task 5.

- [ ] **Step 1: Write the failing test**

Append to `worker/leadership-routes.test.ts`:

```ts
describe('GET /api/leadership', () => {
  it('returns every role with a computed vacant flag', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/api/leadership');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; roles: Array<{ slug: string; vacant: boolean; name: string | null }> };
    expect(body.ok).toBe(true);
    expect(body.roles).toHaveLength(11);
    expect(body.roles.find((r) => r.slug === 'cubmaster')).toMatchObject({ name: 'Kerry Hatcher', vacant: false });
    expect(body.roles.find((r) => r.slug === 'treasurer')).toMatchObject({ name: null, vacant: true });
  });

  it('treats a whitespace-only name as vacant', async () => {
    await env.DB.prepare("UPDATE leadership_roles SET name = '   ' WHERE slug = 'lion-den-leader'").run();
    const response = await exports.default.fetch('https://www.macon170.com/api/leadership');
    const body = (await response.json()) as { roles: Array<{ slug: string; vacant: boolean }> };
    expect(body.roles.find((r) => r.slug === 'lion-den-leader')?.vacant).toBe(true);
    await env.DB.prepare("UPDATE leadership_roles SET name = NULL WHERE slug = 'lion-den-leader'").run();
  });

  it('never exposes an email field', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/api/leadership');
    expect(await response.text()).not.toContain('email');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- worker/leadership-routes.test.ts`
Expected: FAIL — the response is the static-asset 404, not JSON with `ok: true`.

- [ ] **Step 3: Create the route module with the public endpoint only**

Create `worker/leadership-routes.ts`:

```ts
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

export type PublicRole = LeadershipRow & { vacant: boolean };

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
  return result.results.map((row) => ({ ...row, vacant: !row.name || row.name.trim() === '' }));
}

export async function handleLeadershipRoute(context: LeadershipRouteContext): Promise<Response | null> {
  const { request, env, url } = context;

  if (url.pathname === '/api/leadership' && request.method === 'GET') {
    const roles = await readRoster(env.DB);
    return context.json({ ok: true, roles }, 200, context.publicHeaders(request));
  }

  return null;
}
```

- [ ] **Step 4: Wire it into the worker**

In `worker/index.ts`, add to the imports at the top:

```ts
import { LeadershipRouteError, handleLeadershipRoute } from './leadership-routes';
```

Immediately after the `if (eventResponse) return eventResponse;` line (`worker/index.ts:83`), add:

```ts
const leadershipResponse = await handleLeadershipRoute({
  request,
  env,
  url,
  requireAccess,
  enforceSameOrigin,
  json,
  publicHeaders,
  adminHeaders,
});
if (leadershipResponse) return leadershipResponse;
```

In the catch block, change the first condition (`worker/index.ts:110`) to include the new error type:

```ts
      if (error instanceof HttpError || error instanceof EventRouteError || error instanceof LeadershipRouteError) {
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test -- worker/leadership-routes.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
bunx prettier --write worker/leadership-routes.ts worker/index.ts worker/leadership-routes.test.ts
git add worker/leadership-routes.ts worker/index.ts worker/leadership-routes.test.ts
git commit -m "feat: add public leadership roster endpoint"
```

---

### Task 3: Admin CRUD endpoints

**Files:**

- Modify: `worker/leadership-routes.ts`
- Test: `worker/leadership-routes.test.ts`

**Interfaces:**

- Consumes: `LeadershipRouteError`, `readRoster`, `fields` from Task 2.
- Produces these routes, all requiring `requireAccess`:
  - `GET /api/admin/leadership` → `{ ok: true, roles: PublicRole[] }`
  - `POST /api/admin/leadership` body `{ role, name?, bio?, sortOrder? }` → `201 { ok: true, id, slug }`
  - `PUT /api/admin/leadership/:id` body `{ role, name?, bio?, sortOrder? }` → `200 { ok: true, id }`
  - `DELETE /api/admin/leadership/:id` → `200 { ok: true }`

  Note for later tasks: PUT accepts `role` but **ignores any slug in the body** — the slug is immutable after creation.

- [ ] **Step 1: Write the failing tests**

Append to `worker/leadership-routes.test.ts`:

```ts
const localAdmin = 'http://localhost/api/admin/leadership';
const jsonInit = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
  body: JSON.stringify(body),
});

describe('admin leadership routes', () => {
  it('updates a name and bio', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'treasurer'").first<{ id: string }>();
    const response = await exports.default.fetch(
      `${localAdmin}/${row!.id}`,
      jsonInit('PUT', { role: 'Treasurer', name: 'Dana Coin', bio: 'Keeps the books.' }),
    );
    expect(response.status).toBe(200);
    const updated = await env.DB.prepare("SELECT name, bio, updated_by FROM leadership_roles WHERE slug = 'treasurer'").first();
    expect(updated).toMatchObject({ name: 'Dana Coin', bio: 'Keeps the books.', updated_by: 'local-volunteer@example.invalid' });
  });

  it('clears a name back to vacant when given an empty string', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'treasurer'").first<{ id: string }>();
    await exports.default.fetch(`${localAdmin}/${row!.id}`, jsonInit('PUT', { role: 'Treasurer', name: '', bio: '' }));
    const updated = await env.DB.prepare("SELECT name, bio FROM leadership_roles WHERE slug = 'treasurer'").first();
    expect(updated).toMatchObject({ name: null, bio: null });
  });

  it('does not change the slug when the role label is renamed', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'advancement-chair'").first<{ id: string }>();
    await exports.default.fetch(`${localAdmin}/${row!.id}`, jsonInit('PUT', { role: 'Advancement Coordinator' }));
    const updated = await env.DB.prepare('SELECT slug, role FROM leadership_roles WHERE id = ?').bind(row!.id).first();
    expect(updated).toMatchObject({ slug: 'advancement-chair', role: 'Advancement Coordinator' });
  });

  it('creates a role and derives its slug', async () => {
    const response = await exports.default.fetch(localAdmin, jsonInit('POST', { role: 'Assistant Cubmaster', sortOrder: 15 }));
    expect(response.status).toBe(201);
    const body = (await response.json()) as { slug: string; id: string };
    expect(body.slug).toBe('assistant-cubmaster');
  });

  it('rejects a duplicate role slug with 409', async () => {
    const response = await exports.default.fetch(localAdmin, jsonInit('POST', { role: 'Assistant Cubmaster' }));
    expect(response.status).toBe(409);
  });

  it('deletes a role', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'assistant-cubmaster'").first<{ id: string }>();
    const response = await exports.default.fetch(`${localAdmin}/${row!.id}`, {
      method: 'DELETE',
      headers: { origin: 'https://admin.macon170.com' },
    });
    expect(response.status).toBe(200);
    const gone = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'assistant-cubmaster'").first();
    expect(gone).toBeNull();
  });

  it('rejects a bio longer than 600 characters', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'cubmaster'").first<{ id: string }>();
    const response = await exports.default.fetch(`${localAdmin}/${row!.id}`, jsonInit('PUT', { role: 'Cubmaster', bio: 'x'.repeat(601) }));
    expect(response.status).toBe(400);
  });

  it('rejects a missing role label', async () => {
    const response = await exports.default.fetch(localAdmin, jsonInit('POST', { name: 'Nobody' }));
    expect(response.status).toBe(400);
  });

  it('requires authentication from the public hostname', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/api/admin/leadership');
    expect(response.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- worker/leadership-routes.test.ts`
Expected: FAIL — admin paths return 404 from `handleLeadershipRoute` returning `null`.

- [ ] **Step 3: Implement the admin routes**

In `worker/leadership-routes.ts`, add this type near `LeadershipRow`:

```ts
type LeadershipInput = {
  role?: unknown;
  name?: unknown;
  bio?: unknown;
  sortOrder?: unknown;
};
```

Replace the `return null;` at the end of `handleLeadershipRoute` with:

```ts
  if (!url.pathname.startsWith('/api/admin/leadership')) return null;

  const identity = await context.requireAccess(request, env);
  const actor = identity.email ?? '';
  if (!actor) return context.json({ ok: false, error: 'Authenticated email required.' }, 403, context.adminHeaders(env));

  if (url.pathname === '/api/admin/leadership' && request.method === 'GET') {
    const roles = await readRoster(env.DB);
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
    await env.DB.prepare(
      `INSERT INTO leadership_roles (id, slug, role, name, bio, sort_order, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, slug, input.role, input.name, input.bio, input.sortOrder ?? 500, actor)
      .run();
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
    sortOrder: typeof input.sortOrder === 'number' && Number.isInteger(input.sortOrder) ? input.sortOrder : null,
  };
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- worker/leadership-routes.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 5: Commit**

```bash
bunx prettier --write worker/leadership-routes.ts worker/leadership-routes.test.ts
git add worker/leadership-routes.ts worker/leadership-routes.test.ts
git commit -m "feat: add admin CRUD for the leadership roster"
```

---

### Task 4: Server-side injection with HTMLRewriter

**Files:**

- Create: `worker/roster-inject.ts`
- Create: `worker/roster-inject.test.ts`
- Modify: `worker/index.ts` (the `return env.ASSETS.fetch(request)` line at `worker/index.ts:108`)

**Interfaces:**

- Consumes: `readRoster` and `PublicRole` from Task 2.
- Produces:
  - `export const ROSTER_PATHS: Set<string>` — paths eligible for rewriting.
  - `export function rosterMarkup(roles: PublicRole[], view: string): string`
  - `export function injectRoster(response: Response, env: Env): Response`

- [ ] **Step 1: Write the failing tests**

Create `worker/roster-inject.test.ts`:

```ts
import { env } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { injectRoster, rosterMarkup } from './roster-inject';

declare module 'cloudflare:workers' {
  interface ProvidedEnv extends Env {
    TEST_MIGRATIONS: D1Migration[];
  }
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

const page = (body: string) =>
  new Response(`<!doctype html><html><body>${body}</body></html>`, { headers: { 'content-type': 'text/html' } });

describe('rosterMarkup', () => {
  it('escapes HTML in names', () => {
    const html = rosterMarkup(
      [
        {
          id: '1',
          slug: 'a',
          role: 'Cubmaster',
          name: '<script>x</script>',
          bio: null,
          sort_order: 1,
          updated_at: '',
          updated_by: '',
          vacant: false,
        },
      ],
      'filled',
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders a vacancy note for the vacant view', () => {
    const html = rosterMarkup(
      [
        {
          id: '1',
          slug: 'treasurer',
          role: 'Treasurer',
          name: null,
          bio: null,
          sort_order: 1,
          updated_at: '',
          updated_by: '',
          vacant: true,
        },
      ],
      'vacant',
    );
    expect(html).toContain('Treasurer');
  });
});

describe('injectRoster', () => {
  it('fills the filled view with named leaders only', async () => {
    const response = injectRoster(page('<div data-roster="filled">fallback</div>'), env);
    const html = await response.text();
    expect(html).toContain('Kerry Hatcher');
    expect(html).not.toContain('fallback');
    expect(html).not.toContain('Treasurer');
  });

  it('fills the vacant view with unfilled roles only', async () => {
    const response = injectRoster(page('<div data-roster="vacant">fallback</div>'), env);
    const html = await response.text();
    expect(html).toContain('Treasurer');
    expect(html).not.toContain('Kerry Hatcher');
  });

  it('fills a single role when given a slug', async () => {
    const response = injectRoster(page('<div data-roster="webelos-den-leader">fallback</div>'), env);
    const html = await response.text();
    expect(html).toContain('Stephanie Hatcher');
    expect(html).not.toContain('Kerry Hatcher');
  });

  it('keeps the fallback text when the database query fails', async () => {
    const broken = {
      DB: {
        prepare: () => {
          throw new Error('D1 down');
        },
      },
    } as unknown as Env;
    const response = injectRoster(page('<div data-roster="filled">Pack leadership loads from the pack database.</div>'), broken);
    const html = await response.text();
    expect(html).toContain('Pack leadership loads from the pack database.');
  });

  it('passes non-HTML responses through untouched', async () => {
    const json = new Response('{"a":1}', { headers: { 'content-type': 'application/json' } });
    expect(await injectRoster(json, env).text()).toBe('{"a":1}');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test -- worker/roster-inject.test.ts`
Expected: FAIL — cannot resolve `./roster-inject`.

- [ ] **Step 3: Implement the injector**

Create `worker/roster-inject.ts`:

```ts
import { readRoster, type PublicRole } from './leadership-routes';

// Only these paths are piped through HTMLRewriter. Everything else is served as a
// plain static asset. Add den paths here when those pages exist.
export const ROSTER_PATHS = new Set(['/about', '/about/', '/volunteer', '/volunteer/']);

export function rosterMarkup(roles: PublicRole[], view: string): string {
  const chosen =
    view === 'filled'
      ? roles.filter((role) => !role.vacant)
      : view === 'vacant'
        ? roles.filter((role) => role.vacant)
        : roles.filter((role) => role.slug === view);
  if (!chosen.length) return '';
  const items = chosen
    .map((role) => {
      const who = role.vacant ? '<em>This role is open</em>' : escapeHtml(role.name ?? '');
      const bio = role.bio ? `<p>${escapeHtml(role.bio)}</p>` : '';
      return `<li><strong>${escapeHtml(role.role)}</strong> ${who}${bio}</li>`;
    })
    .join('');
  return `<ul>${items}</ul>`;
}

class RosterInjector {
  constructor(private readonly env: Env) {}

  async element(element: {
    getAttribute(name: string): string | null;
    setInnerContent(content: string, options: { html: boolean }): void;
  }) {
    const view = element.getAttribute('data-roster') ?? 'filled';
    try {
      const roles = await readRoster(this.env.DB);
      const html = rosterMarkup(roles, view);
      // An empty result keeps the authored fallback rather than blanking the section.
      if (html) element.setInnerContent(html, { html: true });
    } catch (error) {
      console.error(
        JSON.stringify({ event: 'roster_injection_failed', view, error: error instanceof Error ? error.message : 'Unknown error' }),
      );
    }
  }
}

export function injectRoster(response: Response, env: Env): Response {
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response;
  return new HTMLRewriter().on('[data-roster]', new RosterInjector(env)).transform(response);
}
```

Add at the bottom of the file:

```ts
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] ?? c);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- worker/roster-inject.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Wire injection into the asset fallthrough**

In `worker/index.ts`, add to the imports:

```ts
import { ROSTER_PATHS, injectRoster } from './roster-inject';
```

Replace `return env.ASSETS.fetch(request);` (`worker/index.ts:108`) with:

```ts
const assetResponse = await env.ASSETS.fetch(request);
if (ROSTER_PATHS.has(url.pathname)) return injectRoster(assetResponse, env);
return assetResponse;
```

- [ ] **Step 6: Run the full worker suite**

Run: `bun run test`
Expected: PASS, all files.

- [ ] **Step 7: Commit**

```bash
bunx prettier --write worker/roster-inject.ts worker/roster-inject.test.ts worker/index.ts
git add worker/roster-inject.ts worker/roster-inject.test.ts worker/index.ts
git commit -m "feat: inject the leadership roster into static pages server-side"
```

---

### Task 5: Admin editor page

**Files:**

- Create: `worker/leadership-admin.ts`
- Modify: `worker/index.ts` (the `requireAccess` page block at `worker/index.ts:100-106`, plus the `<nav>` in `renderAdminShell` at `:341`)
- Modify: `worker/calendar-admin.ts` (the `<nav>` at `worker/calendar-admin.ts:3`)
- Modify: `worker/admin-scripts.unit.test.ts`

**Interfaces:**

- Consumes: the admin endpoints from Task 3.
- Produces: `export function renderLeadershipAdmin(email: string, env: Env, headers: Record<string, string>): Response`

- [ ] **Step 1: Write the failing test**

Two assertions are needed. Without the first, the second passes spuriously: an unrouted
`/admin/leadership` currently falls through to `renderAdminShell`, whose script is already valid
JavaScript.

In `worker/admin-scripts.unit.test.ts`, add this test inside the existing `describe` block:

```ts
it('serves a leadership editor distinct from the volunteer desk', async () => {
  const response = await exports.default.fetch('http://localhost/admin/leadership');
  expect(response.status).toBe(200);
  const html = await response.text();
  expect(html).toContain('Leadership editor');
  expect(html).not.toContain('Read parent questions');
});
```

Then extend the `it.each` table so the new page is covered by the escape-sequence guard too:

```ts
  it.each([
    ['/admin', 'volunteer desk'],
    ['/admin/calendar', 'calendar editor'],
    ['/admin/leadership', 'leadership editor'],
  ])('renders syntactically valid JavaScript for %s (%s)', async (path) => {
```

- [ ] **Step 2: Run tests to verify the new one fails**

Run: `bun run test -- worker/admin-scripts.unit.test.ts`
Expected: FAIL on "serves a leadership editor distinct from the volunteer desk" — the response is
the volunteer desk, so `Leadership editor` is absent and `Read parent questions` is present.

- [ ] **Step 3: Create the admin page**

Create `worker/leadership-admin.ts`. Keep the CSS import-free by reusing the same class names the calendar editor uses, so copy its `css()` function verbatim into this file's `css()` — the two pages are independently rendered documents and the repo already duplicates this.

```ts
export function renderLeadershipAdmin(email: string, env: Env, headers: Record<string, string>): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Pack 170 leadership editor</title><style>${css()}</style></head><body>
<a class="skip" href="#main">Skip to leadership editor</a><header><a class="brand" href="/"><span>170</span><div><b>Pack 170</b><small>Volunteer desk</small></div></a><nav><a href="/">Parent inquiries</a><a href="/calendar">Calendar editor</a><a aria-current="page" href="/leadership">Leadership editor</a></nav><div class="identity"><small>Signed in</small><strong>${escapeHtml(email)}</strong></div></header>
<main id="main"><section class="intro"><div><p class="tab">Pack leadership</p><h1>Leadership editor</h1><p>Change who holds each role. Saved names appear on the website immediately. Leave a name blank to show the role as open.</p></div><button class="primary" id="add-role">Add role</button></section>
<div id="status" class="status" role="status">Loading roster…</div><section class="roster-list" id="roster-list"></section></main><script>${script(env.ADMIN_ORIGIN)}</script></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });
}
```

Then the inline script. **Write regex-free string handling** — the existing `admin-scripts.unit.test.ts` exists because escape sequences inside these template literals get consumed by the TypeScript parser before reaching the browser:

```ts
function script(adminOrigin: string): string {
  return `const ORIGIN=${JSON.stringify(adminOrigin)},API='/api/admin/leadership';let roles=[];const list=document.querySelector('#roster-list'),status=document.querySelector('#status');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
async function load(){status.textContent='Loading roster…';const r=await fetch(API);if(!r.ok){status.textContent='Unable to load the roster.';return;}roles=(await r.json()).roles;render();status.textContent=roles.length+(' role'+(roles.length===1?'':'s'));}
function render(){list.innerHTML=roles.map(role=>'<details class="role" data-id="'+esc(role.id)+'"><summary><b>'+esc(role.role)+'</b><span>'+(role.vacant?'Open':esc(role.name))+'</span></summary><div class="form-grid"><label class="wide">Role<input name="role" value="'+esc(role.role)+'" maxlength="120"></label><label class="wide">Name<input name="name" value="'+esc(role.name||'')+'" maxlength="120" placeholder="Leave blank if open"></label><label class="wide">Short bio<textarea name="bio" rows="3" maxlength="600">'+esc(role.bio||'')+'</textarea></label></div><div class="actions"><button type="button" class="secondary" data-remove>Remove role</button><button type="button" class="primary" data-save>Save</button></div></details>').join('');
list.querySelectorAll('[data-save]').forEach(b=>b.addEventListener('click',()=>save(b.closest('.role'))));
list.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>remove(b.closest('.role'))));}
function values(row){return{role:row.querySelector('[name=role]').value,name:row.querySelector('[name=name]').value,bio:row.querySelector('[name=bio]').value};}
async function save(row){status.textContent='Saving…';const r=await fetch(API+'/'+row.dataset.id,{method:'PUT',headers:{'content-type':'application/json','origin':ORIGIN},body:JSON.stringify(values(row))});const body=await r.json();status.textContent=r.ok?'Saved.':(body.error||'Unable to save.');if(r.ok)await load();}
async function remove(row){if(!confirm('Remove this role from the roster? This does not remove a person from the pack.'))return;const r=await fetch(API+'/'+row.dataset.id,{method:'DELETE',headers:{'origin':ORIGIN}});status.textContent=r.ok?'Role removed.':'Unable to remove that role.';if(r.ok)await load();}
document.querySelector('#add-role').addEventListener('click',async()=>{const role=prompt('What is the new role called?');if(!role)return;const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json','origin':ORIGIN},body:JSON.stringify({role})});const body=await r.json();status.textContent=r.ok?'Role added.':(body.error||'Unable to add that role.');if(r.ok)await load();});
load();`;
}
```

Copy `css()` and `escapeHtml()` from `worker/calendar-admin.ts`, then append these rules to the end of the `css()` template string before the closing backtick:

```
.roster-list{display:grid;gap:.6rem}.role{background:var(--page);border:1px solid var(--rule);border-radius:8px}.role summary{display:flex;justify-content:space-between;gap:1rem;padding:1rem;cursor:pointer;font-weight:700}.role .form-grid{padding:0 1rem}.role .actions{display:flex;justify-content:flex-end;gap:.6rem;padding:1rem}
```

- [ ] **Step 4: Route to the new page**

In `worker/index.ts`, add the import:

```ts
import { renderLeadershipAdmin } from './leadership-admin';
```

Inside the admin page block, after the existing calendar branch (`worker/index.ts:102-104`), add:

```ts
if (url.pathname === '/leadership' || url.pathname === '/admin/leadership') {
  return renderLeadershipAdmin(identity.email ?? 'Authorized volunteer', env, adminHeaders(env));
}
```

- [ ] **Step 5: Add the third nav link to the other two shells**

In `worker/calendar-admin.ts:3`, change the `<nav>` to:

```html
<nav>
  <a href="/">Parent inquiries</a><a aria-current="page" href="/calendar">Calendar editor</a><a href="/leadership">Leadership editor</a>
</nav>
```

In `worker/index.ts` inside `renderAdminShell`, change the `<nav class="admin-nav">` to:

```html
<nav class="admin-nav">
  <a aria-current="page" href="/">Parent inquiries</a><a href="/calendar">Calendar editor</a><a href="/leadership">Leadership editor</a>
</nav>
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `bun run test -- worker/admin-scripts.unit.test.ts`
Expected: PASS — the leadership page's inline script parses as valid JavaScript.

- [ ] **Step 7: Commit**

```bash
bunx prettier --write worker/leadership-admin.ts worker/index.ts worker/calendar-admin.ts worker/admin-scripts.unit.test.ts
git add worker/leadership-admin.ts worker/index.ts worker/calendar-admin.ts worker/admin-scripts.unit.test.ts
git commit -m "feat: add leadership editor page to the admin panel"
```

---

### Task 6: Switch the public page over and delete the Markdown

**Files:**

- Modify: `src/pages/about.astro`
- Delete: `src/data/leadership.md`
- Modify: `docs/placeholders.md`

**Interfaces:**

- Consumes: `ROSTER_PATHS` and the injector from Task 4. `/about/` is already in that set.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the Markdown import with a placeholder**

In `src/pages/about.astro`, delete these two lines from the frontmatter:

```ts
// Leadership content lives entirely in Markdown — headings, sections, and prose included — so pack
// editors control it without touching code. Do not mirror any of it back into this file.
import { Content as Roster } from '../data/leadership.md';
```

Replace the roster section body:

```astro
<span class="chapter-tab">Pack leadership</span>
<div class="roster"><Roster /></div>
```

with:

```astro
<span class="chapter-tab">Pack leadership</span>
<h2>Who leads Pack 170</h2>
<p class="lead">Pack 170 is run by registered adult volunteers who are Youth Protection trained and background-checked.</p>
{
  /* Filled in server-side by the worker from D1 (worker/roster-inject.ts). The text below is
          the fallback a visitor sees only if the database is unreachable, or in `astro dev`, which
          bypasses the worker — use `bun run dev:worker` to see the real roster locally. */
}
<div class="roster" data-roster="filled">
  <p>The current roster loads from the pack database. Ask a pack adult if it does not appear.</p>
</div>
<p class="roster-note">
  Reaching a leader goes through <a href="/contact/">the contact form</a>, the pack does not publish adult email addresses.
</p>
```

- [ ] **Step 2: Add styles for bios and the note**

In the `<style>` block of `src/pages/about.astro`, add after the existing `.roster :global(strong)` rule:

```css
.roster :global(li p) {
  margin: 0.4rem 0 0;
  font-weight: 400;
}
.roster :global(em) {
  color: var(--muted, #59636b);
}
.roster-note {
  margin-top: 2rem;
  max-width: 65ch;
}
```

- [ ] **Step 3: Delete the Markdown source**

```bash
rm src/data/leadership.md
```

- [ ] **Step 4: Verify the build and the injected output**

Run: `bun run build`
Expected: succeeds, 10 pages. Then confirm the placeholder is in the built HTML:

Run: `grep -o 'data-roster="filled"' dist/about/index.html`
Expected: one match.

Run: `bun run test`
Expected: PASS, all worker tests.

- [ ] **Step 5: Update the placeholder audit**

In `docs/placeholders.md`, replace the `~~leadership: []~~` row's text with:

```
Resolved 2026-07-27 — the roster now lives in D1 (`leadership_roles`), is edited at `admin.macon170.com/leadership`, and is injected into `/about/` server-side by the worker. No file to edit and no deploy needed.
```

- [ ] **Step 6: Commit**

```bash
bunx prettier --write src/pages/about.astro docs/placeholders.md
git add -A src/pages/about.astro src/data/leadership.md docs/placeholders.md
git commit -m "feat: render the about page roster from the pack database"
```

---

### Task 7: Full verification

**Files:** none created; this task proves the feature.

- [ ] **Step 1: Run the whole CI battery**

Run: `bun run ci`
Expected: lint, check, format:check, test, and test:e2e all pass. Fix anything that fails before continuing.

- [ ] **Step 2: Exercise the real worker path locally**

Run: `bun run dev:worker`

Then in a second shell:

```bash
curl -s http://localhost:8787/api/leadership | head -c 300
curl -s http://localhost:8787/about/ | grep -o 'Kerry Hatcher'
```

Expected: JSON with eleven roles, and `Kerry Hatcher` present in the `/about/` HTML — proving injection works without any browser JavaScript.

- [ ] **Step 3: Confirm the no-JS promise**

Run: `curl -s http://localhost:8787/about/ | grep -c '<script'`

Expected: whatever Astro already emits, but the roster names must be present in the HTML from Step 2 regardless. The roster requires no client script.

- [ ] **Step 4: Update the knowledge graph**

Run: `graphify update .`

- [ ] **Step 5: Apply the migration to production**

```bash
bunx wrangler d1 migrations list macon170-submissions
bunx wrangler d1 migrations apply macon170-submissions --remote
```

Expected: `0003_create_leadership.sql` applied. **Confirm with the user before running the `--remote` command** — it writes to the production database.

- [ ] **Step 6: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: refresh knowledge graph after roster admin"
```

---

## Self-review notes

- **Spec coverage:** schema (Task 1), public endpoint (Task 2), admin CRUD (Task 3), injection with fallback (Task 4), admin page and nav (Task 5), page switchover and Markdown deletion (Task 6), CI and rollout (Task 7). The volunteer-page `data-roster="vacant"` consumer is intentionally not built — the spec lists it as a non-goal — but `/volunteer/` is already in `ROSTER_PATHS` and `rosterMarkup` handles the `vacant` view, so that page is a one-line change later.
- **Deviation:** memoization dropped, with reasoning documented above.
- **Naming consistency:** `readRoster`, `rosterMarkup`, `injectRoster`, `ROSTER_PATHS`, `renderLeadershipAdmin`, `handleLeadershipRoute`, `LeadershipRouteError`, `PublicRole`, `LeadershipRow` are used identically in every task that references them.
