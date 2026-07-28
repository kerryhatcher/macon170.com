# Associate homepage milestones with calendar events

Date: 2026-07-28
Status: approved, not yet implemented

## Problem

The homepage "pack year" strip renders a hardcoded list (`annualProgram` in `src/data/pack.ts`) and
then guesses which published calendar event belongs to each row by matching keywords against the
event title, fenced to plausible months (`src/pages/index.astro:186-227`). That guessing is both
fragile and beside the point: a pack editor already knows which event is the Pinewood Derby when
they enter it.

The keyword list is also a second place facts live. On 2026-07-28 three separate corrections landed
in `annualProgram` alone — a summer camp the pack does not hold, a popcorn fundraiser it does not
sell, and a missing August Lego Pinewood Derby. Every one of those was a hand edit to TypeScript
that a pack editor could not have made.

## Approach

Keep the static milestone list as the shape of the program year. Let a calendar event _claim_ a
milestone through an explicit dropdown, giving a direct relationship between one milestone and one
event. A milestone with no event associated to it stays "to be added".

This replaces inference with a declaration. The list still says what the year looks like; the
calendar says when each part of it happens.

## Data model

### Milestone list — `src/data/pack.ts`

Each `annualProgram` entry gains a stable `key` and loses `match`:

```ts
export const annualProgram = [
  { key: 'lego-derby', season: 'August', title: 'Lego Pinewood Derby', state: 'Date to be added' },
  { key: 'fall-camp', season: 'Fall', title: 'Fall camp', state: 'Dates to be added' },
  { key: 'pinewood-derby', season: 'Late January', title: 'Pinewood Derby', state: 'Date to be added' },
  { key: 'blue-gold', season: 'February', title: 'Blue & Gold Banquet', state: 'Date to be added' },
] as const;
```

Keys are stable identifiers stored in the database, so renaming a `title` is safe but changing a
`key` orphans any event holding the old value. That constraint belongs in a comment above the array.

Deleting the `match` objects removes the keywords and month fences entirely. The comment block
explaining why "Lego Pinewood Derby & Cookout" must not fill the late-January Derby row goes with
them — the dropdown makes the distinction by construction.

### Schema — `migrations/0003_add_event_milestone.sql`

```sql
ALTER TABLE calendar_events ADD COLUMN milestone TEXT;
```

Nullable, no default. Deliberately no constraints:

- **No CHECK on allowed keys.** SQLite cannot add a CHECK constraint via `ALTER TABLE`, and the
  worker already has the authoritative key list in hand for validation.
- **No unique index.** Milestones recur every program year, so two Lego Derbies a year apart both
  legitimately carry `lego-derby`. Uniqueness would need a program-year column to scope it, which is
  more schema than the strip needs. Ambiguity is resolved by "soonest wins" instead (below).

No index on the column. The public query already reads at most 200 rows and the strip groups them in
JavaScript.

## Components

### Worker — `worker/event-routes.ts`

`wrangler.jsonc:4` points `main` at `worker/index.ts` and the same worker serves the site's static
assets, so the worker and the site are one bundle and the worker can import the milestone list
directly. There is no duplicated list to drift.

- Import the keys from `src/data/pack.ts`.
- Add `milestone` to `publicFields` and `adminFields`, and to the INSERT and UPDATE column lists.
- Validate in the existing input-parsing function: absent, `null`, or empty string → `null`; a value
  in the key list → that value; anything else → 400, matching how the other enum-ish fields
  (`category`, `status`, `visibility`) already fail.

`tsconfig.worker.json` `include` gains `src/data/pack.ts` so the worker typecheck sees it.

### Admin UI — `worker/calendar-admin.ts`

The admin page is a single self-contained HTML string. Three edits:

1. One `<label>Milestone<select name="milestone">` in the `.form-grid`, with a blank first option
   ("Not a milestone") and one option per key, generated from the imported list so the dropdown can
   never disagree with the array.
2. `milestone: 'milestone'` in the `edit()` field map, so opening an event shows its current value.
3. `milestone: value('milestone')` in `payload()`.

### Homepage — `src/pages/index.astro`

Delete `matchFor()` and the two comments about month fencing (~15 lines). In its place, build a
lookup from the fetched events — for each milestone key, the event with the earliest `starts_at`
among those carrying that key — and fill the matching row. Rows with no event keep the `state`
placeholder text they render server-side.

The existing summary line ("N of M milestones have a published date…") keeps working; it counts
filled rows, which is now an exact count rather than a guess.

## Data flow

```
pack editor picks "Pinewood Derby" in the admin dropdown
  → PUT /api/admin/events/:id  { milestone: 'pinewood-derby', ... }
  → worker validates the key against annualProgram, writes calendar_events.milestone
  → GET /api/events returns milestone alongside title/starts_at
  → homepage script keys the event to the 'pinewood-derby' row and prints its date
```

## Error handling and edge cases

- **Unknown milestone key on write** → 400 with the same error shape as other invalid fields. An
  unknown key means a stale admin page or a hand-rolled API call; failing loudly beats writing a
  value nothing will ever render.
- **Two events claiming one milestone** → the soonest by `starts_at` fills the row. Legitimate for
  year-over-year recurrence; if an editor double-flags by accident the strip shows the nearer one,
  which is the more useful of the two anyway.
- **A milestone's event passes** → `/api/events` only returns events whose `ends_at`/`starts_at` is
  in the future, so the row reverts to its "Date to be added" placeholder until next year's event is
  entered. Accepted deliberately: keeping the date would mean a second API view for past flagged
  events, and the strip's job is to say what is coming.
- **Cancelled or draft events** → unchanged behavior. The public endpoint already filters to
  `visibility = 'published'`; a cancelled-but-published event fills the row and carries its own
  `status`, exactly as it does today.
- **A milestone key removed from `annualProgram`** → orphaned rows keep a value no row reads. Harmless
  and invisible; no cleanup migration.

## Testing

Extend the existing worker tests rather than adding a file:

- POST an event with a valid `milestone`, then read `/api/events` and assert the key round-trips.
- POST with `milestone: 'nope'` → 400.
- POST with `milestone` absent → stored as `null`, and the field is present-and-null in the public
  response.
- Update an event to clear its milestone (`''` → `null`).

All 21 existing tests must stay green, and `bun run build && bun run test` must pass.

`src/pages/index.astro` is the only consumer of `annualProgram`; `src/pages/activities.astro` merely
mentions it in a comment. `docs/placeholders.md` describes the array's placeholder `state` strings and
needs a line noting that a row now fills from an associated event rather than a keyword match.

## Out of scope

- Seeding D1 with the real dates from `docs/calendar.md`. That is data entry through the admin UI,
  not code, and is what makes the strip light up.
- A past-milestone API view (see edge cases).
- Any change to `/activities/`, which describes milestones in prose and does not consume `match`.
