# Milestone-to-Event Association Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a calendar event claim one of the homepage's four pack-year milestones through an explicit dropdown, replacing the keyword-and-month guessing that currently pairs events to milestone rows.

**Architecture:** `annualProgram` in `src/data/pack.ts` stays the canonical milestone list and gains a stable `key` per entry. A new nullable `calendar_events.milestone` column stores that key. The worker — which serves both the site assets and the API from one bundle, so it can import the list directly — validates the key on write and returns it on read. The homepage strip keys events to rows instead of guessing.

**Tech Stack:** Astro (static pages + inline vanilla JS), Cloudflare Workers, D1 (SQLite, STRICT tables), vitest with `@cloudflare/vitest-pool-workers`, bun as the task runner.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-28-milestone-event-association-design.md`.
- Never switch branches in this working directory (`CLAUDE.md`). Commit on the current branch.
- Stage explicit paths (`git add <path>`). Never `git add -A` or `git add .` — other sessions have in-progress files here.
- Conventional Commits v1.0.0. Imperative, lowercase subject, no trailing period. Multi-line messages go through `git commit -F <file>`, never a `$(cat <<EOF)` substitution.
- Every commit must pass `bun run build && bun run test` on its own. The suite is 21 tests before this work and must never go red.
- Milestone keys are stable database values. `title` may be reworded freely; changing a `key` orphans stored rows.
- Timezone stays `America/New_York`; the worker already rejects anything else.

---

### Task 1: Milestone keys, the column, and worker plumbing

**Files:**

- Modify: `src/data/pack.ts:90-111` (the `annualProgram` array and its comment block)
- Create: `migrations/0003_add_event_milestone.sql`
- Modify: `worker/event-routes.ts` (types at `:5-48`, field lists at `:64-69`, INSERT at `:139-176`, UPDATE at `:211-253`, `parseEventInput` at `:293-326`, helpers at the file's end)
- Modify: `tsconfig.worker.json` (the `include` array)
- Test: `worker/index.test.ts` (inside the existing `describe('calendar events')` block, which starts at `:60`)

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces:
  - `annualProgram`: `readonly { key: string; season: string; title: string; state: string }[]` exported from `src/data/pack.ts`. Keys, in strip order: `'lego-derby'`, `'fall-camp'`, `'pinewood-derby'`, `'blue-gold'`. The `match` property no longer exists.
  - `calendar_events.milestone`: `TEXT` nullable.
  - `/api/events` and `/api/admin/events` responses include `milestone: string | null` on every event object.
  - POST/PUT `/api/admin/events` accept an optional `milestone` string in the JSON body.

- [ ] **Step 1: Rewrite the milestone list with stable keys**

In `src/data/pack.ts`, replace the whole `annualProgram` block (the comment at `:90-94` through the closing `] as const;`) with this. Note the comment no longer mentions keywords or month fences — those are gone — and now warns about key stability:

```ts
// The annual rhythm is known fact (see PRODUCT.md Operating Context) and is NOT the calendar:
// these are recurring milestones, while D1 holds specific dated events. A calendar event claims a
// milestone by storing its `key` in calendar_events.milestone, set from a dropdown in the admin UI.
// A milestone with no event associated to it keeps its `state` placeholder on the homepage.
//
// `key` is a stored database value: rewording a `title` is safe, but changing a `key` orphans every
// event that holds the old one. Add a migration if a key ever has to change.
export const annualProgram = [
  // The year opens with the Lego Pinewood Derby & Cookout — a free August event families are asked
  // to invite anyone interested in Scouting to, so it is the pack's Join Scouting Night in practice
  // (docs/calendar.md:4, Cubmaster 2026-07-28). There is no separate Join Scouting Night milestone.
  { key: 'lego-derby', season: 'August', title: 'Lego Pinewood Derby', state: 'Date to be added' },
  { key: 'fall-camp', season: 'Fall', title: 'Fall camp', state: 'Dates to be added' },
  { key: 'pinewood-derby', season: 'Late January', title: 'Pinewood Derby', state: 'Date to be added' },
  // The crossover is not a separate milestone: Pack 170 holds it at the Blue & Gold Banquet, and the
  // pack calls it the Arrow of Light Ceremony (both confirmed by the Cubmaster, 2026-07-28). This
  // matches Scouting America's guidance — see docs/research/cub-scouting.md:70. The strip has room
  // for one short title, so the ceremony is named on /activities/ instead.
  { key: 'blue-gold', season: 'February', title: 'Blue & Gold Banquet', state: 'Date to be added' },
] as const;
```

- [ ] **Step 2: Write the migration**

Create `migrations/0003_add_event_milestone.sql`:

```sql
-- A calendar event may claim one homepage milestone by storing its key from
-- src/data/pack.ts `annualProgram`. Nullable: most events are not milestones.
--
-- No CHECK constraint on the allowed keys: SQLite cannot add one through ALTER TABLE, and the
-- worker validates against the same array it builds the admin dropdown from.
--
-- No UNIQUE index either: milestones recur every program year, so two Lego Derbies twelve months
-- apart both legitimately carry 'lego-derby'. The homepage resolves the pair by taking the soonest.
ALTER TABLE calendar_events ADD COLUMN milestone TEXT;
```

- [ ] **Step 3: Let the worker typecheck see the shared list**

In `tsconfig.worker.json`, change the `include` array so the imported data file is typechecked:

```json
  "include": ["worker/**/*.ts", "worker-configuration.d.ts", "src/data/pack.ts"],
```

- [ ] **Step 4: Write the failing tests**

Add these three tests inside the existing `describe('calendar events')` block in `worker/index.test.ts`, after the `'archives rather than deleting an event'` test at `:128`. `eventPayload` at `:61` is already in scope; each test uses its own slug so it does not collide with the shared database that `beforeAll` migrates once:

```ts
  it('round-trips a milestone key through the public API', async () => {
    const created = await exports.default.fetch('http://localhost/api/admin/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, slug: 'lego-derby-cookout', milestone: 'lego-derby' }),
    });
    expect(created.status).toBe(201);
    const { id } = await created.json<{ id: string }>();

    const published = await exports.default.fetch(`http://localhost/api/admin/events/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, slug: 'lego-derby-cookout', milestone: 'lego-derby', visibility: 'published' }),
    });
    expect(published.status).toBe(200);

    const list = await exports.default.fetch('https://www.macon170.com/api/events');
    const body = await list.json<{ events: Array<{ slug: string; milestone: string | null }> }>();
    const event = body.events.find((candidate) => candidate.slug === 'lego-derby-cookout');
    expect(event?.milestone).toBe('lego-derby');
  });

  it('rejects a milestone key that is not in the program', async () => {
    const response = await exports.default.fetch('http://localhost/api/admin/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, slug: 'not-a-milestone', milestone: 'summer-camp' }),
    });
    expect(response.status).toBe(400);
  });

  it('treats an absent or cleared milestone as null', async () => {
    const created = await exports.default.fetch('http://localhost/api/admin/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, slug: 'ordinary-pack-meeting' }),
    });
    expect(created.status).toBe(201);
    const { id } = await created.json<{ id: string }>();
    const stored = await env.DB.prepare('SELECT milestone FROM calendar_events WHERE id = ?')
      .bind(id)
      .first<{ milestone: string | null }>();
    expect(stored?.milestone).toBeNull();

    const cleared = await exports.default.fetch(`http://localhost/api/admin/events/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, slug: 'ordinary-pack-meeting', milestone: '', visibility: 'draft' }),
    });
    expect(cleared.status).toBe(200);
    const after = await env.DB.prepare('SELECT milestone FROM calendar_events WHERE id = ?')
      .bind(id)
      .first<{ milestone: string | null }>();
    expect(after?.milestone).toBeNull();
  });
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `bun run test`
Expected: the three new tests FAIL. The round-trip test fails because `milestone` is absent from the response (`expect(undefined).toBe('lego-derby')`); the rejection test fails with 201 instead of 400; the null test fails because `SELECT milestone` errors on a column that does not exist.

- [ ] **Step 6: Add the milestone type fields and the shared key set**

In `worker/event-routes.ts`, add the import at the top of the file, above the type declarations:

```ts
import { annualProgram } from '../src/data/pack';
```

Add to `EventRow` (after `registration_url: string | null;` at `:26`):

```ts
  milestone: string | null;
```

Add to `EventInput` (after `registrationUrl?: unknown;` at `:47`):

```ts
  milestone?: unknown;
```

Next to the other allow-lists at `:61-63`, add:

```ts
// The admin dropdown and this validator read the same array, so they can never disagree.
const milestoneKeys = new Set<string>(annualProgram.map((entry) => entry.key));
```

- [ ] **Step 7: Add the column to both field lists**

In `worker/event-routes.ts:64-69`, append `milestone` to each list:

```ts
const adminFields = `id, slug, created_at, updated_at, published_at, archived_at, visibility,
  status, category, title, summary, description, starts_at, ends_at, timezone,
  location_name, address, audience, what_to_bring, cost, registration_url, milestone,
  created_by, updated_by`;
const publicFields = `slug, status, category, title, summary, description, starts_at, ends_at,
  timezone, location_name, address, audience, what_to_bring, cost, registration_url, milestone`;
```

- [ ] **Step 8: Validate the key during input parsing**

In `parseEventInput` (`:293`), add `milestone` to the returned object — put it immediately after `registrationUrl,` at `:324`:

```ts
    registrationUrl,
    milestone: milestoneValue(input.milestone),
```

Add this helper beside the other validators at the end of the file, after `optionalUrl` (`:365-371`):

```ts
function milestoneValue(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const key = value.trim();
  if (!milestoneKeys.has(key)) throw new EventRouteError(400, 'Choose a valid milestone.');
  return key;
}
```

- [ ] **Step 9: Write the column on create**

In the POST handler's INSERT (`:139-176`), add `milestone` to the column list after `registration_url` and one more `?` to `VALUES`. The column list becomes:

```sql
        INSERT INTO calendar_events (
          id, slug, visibility, status, category, title, summary, description,
          starts_at, ends_at, timezone, location_name, address, audience,
          what_to_bring, cost, registration_url, milestone, published_at, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

Then in the `.bind(...)` call, insert the new value between `input.registrationUrl,` and the `null,` that fills `published_at`:

```ts
        input.registrationUrl,
        input.milestone,
        null,
        actor,
        actor,
```

Bind order is positional — a value in the wrong slot writes the wrong column without erroring, so double-check that `null` still lines up with `published_at`.

- [ ] **Step 10: Write the column on update**

In the PUT handler's UPDATE (`:211-253`), add `milestone = ?` to the SET list right after `registration_url = ?`:

```sql
          location_name = ?, address = ?, audience = ?, what_to_bring = ?, cost = ?,
          registration_url = ?, milestone = ?,
          published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END,
```

And in that statement's `.bind(...)`, insert the value between `input.registrationUrl,` and the `input.visibility,` that feeds the `published_at` CASE:

```ts
        input.registrationUrl,
        input.milestone,
        input.visibility,
        now,
```

- [ ] **Step 11: Run the tests to verify they pass**

Run: `bun run build && bun run test`
Expected: PASS, 24 tests. If the round-trip test reports a milestone of `null` while the rejection test passes, a bind value is in the wrong slot — recount the placeholders in Step 9 and Step 10.

- [ ] **Step 12: Commit**

```bash
git add src/data/pack.ts migrations/0003_add_event_milestone.sql worker/event-routes.ts tsconfig.worker.json worker/index.test.ts
```

Write the message to a file and commit with `-F`:

```bash
printf '%s\n' 'feat(events): let a calendar event claim a pack-year milestone' '' 'Adds a nullable calendar_events.milestone column holding a key from the' 'annualProgram list, validated in the worker against that same array so the' 'stored value and the homepage strip cannot disagree. Replaces nothing yet - the' 'admin dropdown and the strip follow.' > /tmp/milestone-commit-1
git commit -F /tmp/milestone-commit-1
```

---

### Task 2: Milestone dropdown in the admin editor

**Files:**

- Modify: `worker/calendar-admin.ts` (the page HTML at `:6`, the `edit()` field map at `:15`, `payload()` at `:16`)
- Test: `worker/index.test.ts` (the `describe('volunteer desk')` block, which starts at `:145`)

**Interfaces:**

- Consumes: `annualProgram` (`{ key, season, title, state }[]`) from `src/data/pack.ts`, and the POST/PUT `milestone` body field validated in Task 1.
- Produces: nothing later tasks depend on.

Note this file is deliberately written as dense single-line template literals holding the whole admin page. Match that style — do not reformat the surrounding lines, or the diff becomes unreviewable.

- [ ] **Step 1: Write the failing test**

Add this to the `describe('volunteer desk')` block in `worker/index.test.ts`, after the `'serves the calendar editor in local authenticated mode'` test that ends at `:157`. It fetches the same page that test does — `http://localhost/admin/calendar`, no headers, which the worker serves in local authenticated mode:

```ts
  it('offers every pack-year milestone in the editor dropdown', async () => {
    const response = await exports.default.fetch('http://localhost/admin/calendar');
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('<select name="milestone">');
    expect(html).toContain('<option value="">Not a milestone</option>');
    expect(html).toContain('<option value="lego-derby">Lego Pinewood Derby</option>');
    expect(html).toContain('<option value="blue-gold">Blue &amp; Gold Banquet</option>');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test`
Expected: FAIL — the page contains no `<select name="milestone">`.

- [ ] **Step 3: Build the option list from the shared array**

In `worker/calendar-admin.ts`, add the import at the top of the file:

```ts
import { annualProgram } from '../src/data/pack';
```

Above the function that returns the page HTML, add:

```ts
// Generated from annualProgram so the dropdown can never offer a key the worker would reject.
// `&` in "Blue & Gold Banquet" must be escaped — these titles land straight in HTML.
const milestoneOptions = [
  '<option value="">Not a milestone</option>',
  ...annualProgram.map((entry) => `<option value="${entry.key}">${entry.title.replace(/&/g, '&amp;')}</option>`),
].join('');
```

- [ ] **Step 4: Add the field to the form grid**

In the page HTML at `:6`, find the Status label and insert a Milestone label immediately after it, before the `<label>Starts` field. The existing text reads:

```html
<label>Status<select name="status"><option value="scheduled">Scheduled</option><option value="tentative">Tentative</option><option value="cancelled">Cancelled</option></select></label><label>Starts<input name="startsAt" type="datetime-local" required></label>
```

Change it to:

```html
<label>Status<select name="status"><option value="scheduled">Scheduled</option><option value="tentative">Tentative</option><option value="cancelled">Cancelled</option></select></label><label>Milestone<select name="milestone">${milestoneOptions}</select></label><label>Starts<input name="startsAt" type="datetime-local" required></label>
```

The surrounding string is already a template literal, so `${milestoneOptions}` interpolates as-is.

- [ ] **Step 5: Load and save the field in the editor script**

In `edit()` at `:15`, the field map is an object literal passed to `Object.entries`. Add `milestone:'milestone'` to it, right after `timezone:'timezone'`:

```js
timezone:'timezone',milestone:'milestone'
```

An empty stored value selects the blank option, because the loop assigns `e[key]||''`.

In `payload()` at `:16`, add the field after `timezone:value('timezone')`:

```js
timezone:value('timezone'),milestone:value('milestone')
```

`value(n)` already maps an empty form field to `null`, which Task 1's validator stores as `null`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `bun run build && bun run test`
Expected: PASS, 25 tests.

- [ ] **Step 7: Commit**

```bash
git add worker/calendar-admin.ts worker/index.test.ts
printf '%s\n' 'feat(admin): add a milestone dropdown to the event editor' '' 'Options are generated from annualProgram, so a pack editor can only pick a key' 'the API will accept. Setting the pack year is now data entry, not a TypeScript' 'edit.' > /tmp/milestone-commit-2
git commit -F /tmp/milestone-commit-2
```

---

### Task 3: Key the homepage strip to associated events

**Files:**

- Modify: `src/pages/index.astro:146-156` (the strip markup) and `:182-227` (the inline script)
- Modify: `docs/placeholders.md` (the `src/data/pack.ts` annual program section, near `:62`)

**Interfaces:**

- Consumes: `annualProgram` entries with `key` (Task 1), and `milestone: string | null` on each object in the `/api/events` response (Task 1).
- Produces: nothing.

There is no automated coverage of this strip — no e2e spec or unit test references `pm-strip`, `pm-row`, or the note. Verification is the build plus the browser check in Step 5.

- [ ] **Step 1: Key the rendered rows by milestone key**

In `src/pages/index.astro`, the row currently identifies itself by title (`:149`). Change that one attribute to the key, so the script never depends on display copy:

```astro
            <li class="pm-cell" data-pm-row={item.key}>
```

Leave the rest of the `<li>` — `{item.season}`, `{item.title}`, `{item.state}` — untouched.

- [ ] **Step 2: Replace the keyword matcher with a milestone lookup**

In the inline script, delete `matchFor` and its two-line comment entirely (`:188-198`) and put this in its place:

```js
    // An event claims a milestone by carrying its key (calendar_events.milestone). Milestones recur
    // every year, so two events can share a key; the soonest one owns the row.
    function soonestByMilestone(events) {
      const byKey = {};
      events.forEach(function (event) {
        const key = event.milestone;
        if (!key) return;
        if (!byKey[key] || Date.parse(event.starts_at) < Date.parse(byKey[key].starts_at)) byKey[key] = event;
      });
      return byKey;
    }
```

- [ ] **Step 3: Point `paint` at the lookup**

Inside `paint` (`:200`), replace the first two lines of the body so the lookup is built once instead of scanning the event list per milestone, and select rows by key:

```js
    function paint(events) {
      let confirmed = 0;
      const byKey = soonestByMilestone(events);
      pmProgram.forEach(function (milestone) {
        const hit = byKey[milestone.key] || null;
        if (hit) confirmed += 1;
        root.querySelectorAll('[data-pm-row="' + CSS.escape(milestone.key) + '"]').forEach(function (cell) {
```

Everything from `const when = cell.querySelector('[data-pm-when]');` onward — including the `data-confirmed` toggle, the `fmt(hit.starts_at)` fill, the `milestone.state` fallback, and the whole `[data-pm-note]` summary block — stays exactly as it is. The note's counts are now exact rather than inferred.

- [ ] **Step 4: Run the build and tests**

Run: `bun run build && bun run test`
Expected: build succeeds with 0 errors; PASS, 25 tests. A build error naming `match` means a leftover reference to the deleted property.

- [ ] **Step 5: Verify in the browser**

Run: `bun run dev`, open the homepage, and confirm the pack-year strip shows all four rows with their placeholder text ("Date to be added" / "Dates to be added") and the note reads "No milestone dates are published yet." — local D1 has no published milestone events, so placeholders are the correct output. Check the browser console is free of errors from the strip script.

To see a filled row, POST an event with `"milestone": "lego-derby"` and `"visibility": "published"` and a `startsAt` in the future to the local admin API, then reload: that row should show a formatted date and pick up the `data-confirmed` attribute.

- [ ] **Step 6: Update the placeholder inventory**

In `docs/placeholders.md`, the section describing `src/data/pack.ts`'s annual program says the entries' `state` strings are placeholders. Add a sentence recording how a row now fills:

```markdown
A row fills from a calendar event whose `milestone` column holds that entry's `key`, set from the
Milestone dropdown in the calendar editor (spec:
`docs/superpowers/specs/2026-07-28-milestone-event-association-design.md`). Keyword-and-month
matching is gone. A milestone with no event associated to it keeps the placeholder, and because
`/api/events` only returns events that have not ended, a row reverts to its placeholder once its
event passes.
```

Also fix the stale line range in that section's heading if it no longer matches `annualProgram`'s
location in `src/data/pack.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro docs/placeholders.md
printf '%s\n' 'feat(pages): fill the pack-year strip from associated events' '' 'The strip now keys each row to an event that claims its milestone instead of' 'guessing from title keywords fenced to plausible months. Deletes matchFor and the' 'guardrails it needed; the note counts are now exact.' > /tmp/milestone-commit-3
git commit -F /tmp/milestone-commit-3
```

---

## Not in this plan

- Entering the real dates from `docs/calendar.md` into D1. That is data entry through the admin UI and is what makes the strip light up.
- A past-milestone API view. The spec accepts that a row reverts to its placeholder after its event passes.
- Any change to `/activities/`, which only mentions `annualProgram` in a comment.
