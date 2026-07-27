# Leadership roster admin — design

Date: 2026-07-27
Status: awaiting review

## Problem

The adult leadership roster has moved three times in one day: a `leadership` array in
`src/data/pack.ts`, then `docs/leadership.md`, then `src/data/leadership.md` rendered on `/about/`.
Every version requires a git commit, so a non-technical volunteer cannot change who holds a role.
The roster is also about to gain consumers: per-den pages that name the den's leader, and a
volunteer page that lists roles needing to be filled.

## Goal

A volunteer signs in to the admin panel, edits a role's name and bio, saves, and the public site
shows it immediately — with no deploy, no git, and no JavaScript required in the visitor's browser.

## Non-goals

- Adult email addresses. Pack policy publishes none, so the schema has no `email` column at all
  rather than a column that eventually gets filled.
- Photos. Names and short bios only.
- Per-den pages and the volunteer vacancy list. This spec makes the data available to them; the
  pages themselves are separate work.

## Architecture

Four pieces, each mirroring an existing pattern in this repo.

### 1. Schema — `migrations/0003_create_leadership.sql`

One `STRICT` table, following `calendar_events` conventions (text timestamps via
`strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`, `CHECK` constraints on anything enumerable).

| Column       | Type                 | Notes                                         |
| ------------ | -------------------- | --------------------------------------------- |
| `id`         | TEXT PRIMARY KEY     | UUID                                          |
| `slug`       | TEXT NOT NULL UNIQUE | Stable machine key, e.g. `webelos-den-leader` |
| `role`       | TEXT NOT NULL        | Editable display label                        |
| `name`       | TEXT                 | NULL or blank means vacant                    |
| `bio`        | TEXT                 | Max 600 chars, enforced in the worker         |
| `sort_order` | INTEGER NOT NULL     | Display order                                 |
| `created_at` | TEXT NOT NULL        | Default now                                   |
| `updated_at` | TEXT NOT NULL        | Default now, set on every write               |
| `updated_by` | TEXT NOT NULL        | Actor email from Cloudflare Access            |

`slug` is separate from `role` on purpose. Role labels are editable, and a future den page will
reference `webelos-den-leader`; renaming the label to "Webelos Den Leader (4th grade)" must not
break that page. The slug is generated from the role on creation and is not edited afterward.

No `leadership_audit_log` twin of `event_audit_log`. `updated_at` and `updated_by` answer "who
changed this" for a roster of eleven rows.

Seeded in the same migration, `sort_order` 10..110: Cubmaster, Committee Chair, Chartered
Organization Representative, Treasurer, Advancement Chair, then Lion, Tiger, Wolf, Bear, Webelos,
and Arrow of Light Den Leader. Known occupants are seeded too: Kerry Hatcher (Cubmaster), Will Roche
(Committee Chair), Rev. Caitlin Childers Brown (COR), Stephanie Hatcher (Webelos Den Leader).

`ranks` in `src/data/pack.ts` stays exactly as it is. It owns the rank grid on `/` and `/join/` —
marks, colors, grades. This table owns editable role labels. Stated explicitly because the `dens`
array was deleted earlier today for near-duplicating `ranks`; this is different data with a
different purpose.

### 2. API — `worker/leadership-routes.ts`

Mirrors `event-routes.ts`: a single `handleLeadershipRoute` taking injected dependencies
(`requireAccess`, `enforceSameOrigin`, `json`, `publicHeaders`, `adminHeaders`), wired in
`worker/index.ts` next to the `handleEventRoute` call, and a `LeadershipRouteError` handled by the
existing catch block.

| Route                              | Auth            | Purpose                               |
| ---------------------------------- | --------------- | ------------------------------------- |
| `GET /api/leadership`              | public          | All rows, each with computed `vacant` |
| `GET /api/admin/leadership`        | `requireAccess` | Same rows for the editor              |
| `POST /api/admin/leadership`       | `requireAccess` | Add a role                            |
| `PUT /api/admin/leadership/:id`    | `requireAccess` | Update role, name, bio, sort order    |
| `DELETE /api/admin/leadership/:id` | `requireAccess` | Remove a role added by mistake        |

`vacant` is computed, never stored: `name IS NULL OR trim(name) = ''`. POST and DELETE exist
because role labels are editable — a volunteer who adds "Assistan Cubmaster" needs to remove it.

Validation in the worker: `role` required and 1–120 chars, `bio` at most 600, `name` at most 120,
`slug` generated from `role` and rejected as a duplicate with a 409 like the existing
`calendar_events.slug` handler does.

### 3. Admin page — `worker/leadership-admin.ts`

`renderLeadershipRoster(email, env, headers)`, mirroring `renderCalendarAdmin`: one worker-rendered
HTML document with inline CSS and an inline script, served at `/leadership` and `/admin/leadership`
from the `requireAccess` block in `worker/index.ts:100-106`.

Simpler than the calendar editor: no create/archive/slug/visibility controls, no filter row, no
list/form split pane. A single list of rows in `sort_order`; each row shows the role label and
current holder, expands to edit role, name, and bio, and saves on its own. Plus an "Add role"
button and a per-row Remove with a confirm.

The `<nav>` is duplicated in `renderCalendarAdmin` and `renderAdminShell`, so both gain the third
link. `grep 'Parent inquiries'` finds the full caller set.

### 4. Public render — `HTMLRewriter` injection in the worker

Every request to `www.macon170.com` already passes through this worker and falls through to
`env.ASSETS.fetch(request)`, so the roster is injected server-side rather than fetched by the
browser.

Astro emits a placeholder:

```html
<div data-roster="filled">Pack leadership loads from the pack database.</div>
```

The worker rewrites only paths that carry placeholders. That list is explicit in code, starting as
`/about/` and `/volunteer/`, with `/dens/` and its children added when those pages exist. Every other
path returns `env.ASSETS.fetch(request)` untouched. For a listed path the worker guards on
`content-type: text/html` and pipes the asset response through
`new HTMLRewriter().on('[data-roster]', injector).transform(response)`. Element handlers may be
async, so the injector queries D1 and calls `element.setInnerContent(html, { html: true })`.
Confirmed against the current Cloudflare docs (HTMLRewriter streaming content, 2025-01-31).

The `data-roster` value selects what to render:

| Value    | Renders                               | Used by          |
| -------- | ------------------------------------- | ---------------- |
| `filled` | Rows with a name, grouped as today    | `/about/`        |
| `vacant` | Rows without a name, as "help needed" | `/volunteer/`    |
| a slug   | That single role                      | future den pages |

Consequences, accepted:

- **No client fetch.** This deletes the need for a `src/lib/leadership.ts` helper, a loading state,
  and an empty state. Visitors receive finished HTML, including visitors with JavaScript blocked and
  crawlers.
- **`astro dev` shows the placeholder text**, because it bypasses the worker. `bun run dev:worker`
  (already in `package.json`) exercises the real path. The placeholder's default text is written to
  read as informative rather than broken.
- **A D1 read on HTML requests for those paths.** Eleven rows from one indexed table. The query
  result is memoized per isolate; if that proves insufficient, the Cache API with a short TTL is the
  next step. Paths without placeholders are not rewritten at all.

`src/data/leadership.md` and its import in `src/pages/about.astro` are deleted. The `.roster` styles
in `about.astro` stay, since the injected markup uses the same list structure.

## Error handling

- D1 unavailable during injection: the injector leaves the placeholder's existing content in place
  and logs a structured error, matching the `request_failed` logging in `worker/index.ts`. A broken
  database degrades to a sentence, not a blank section or a 500.
- Duplicate slug on POST: 409 with a readable message, as `calendar_events.slug` already does.
- Validation failures: 400 through `LeadershipRouteError`.
- Unauthenticated admin access: existing `requireAccess` behavior, unchanged.

## Testing

- `worker/admin-scripts.unit.test.ts` — the repo's existing home for admin inline-script tests
  gains cases for the roster script: payload shape, per-row save, remove confirm.
- `worker/leadership-routes.test.ts` — vacancy computation including whitespace-only names, slug
  generation and duplicate rejection, bio length cap, auth rejection on each admin verb.
- Injection test — a `data-roster="filled"` fixture through the rewriter asserts the names land in
  the HTML and that a D1 failure preserves the fallback text.
- `bun run ci` (lint, check, format:check, test, test:e2e) must pass, as GitHub Actions requires it
  before deploy.

## Migration and rollout

1. Apply `0003` to the local D1, then to production via wrangler.
2. Ship worker routes and the admin page; verify editing at `admin.macon170.com/leadership`.
3. Switch `/about/` to the placeholder and delete the Markdown file in the same commit, so the
   roster is never rendered from two sources at once.

## Facts still unconfirmed — and why they no longer block

These were blockers while the roster lived in code. Once this ships they are corrected in the admin
UI in seconds, so the migration seeds the best current answer rather than waiting:

- Stephanie Hatcher is seeded as Webelos Den Leader, carried over from the current Markdown.
- Rev. Caitlin Childers Brown is seeded as Chartered Organization Representative. Whether she is the
  registered COR on the charter or the church's staff liaison is still unverified.
- Treasurer and Advancement Chair are seeded vacant, and surface on the volunteer page once it
  consumes `data-roster="vacant"`.

## Styling note

The injected markup reuses the `.roster` list structure already styled in `src/pages/about.astro`,
so `<ul>`/`<li>`/`<strong>` render as they do today. Bios are new markup with no existing style; they
render as a `<p>` inside the `<li>` and need one rule added alongside the others.
