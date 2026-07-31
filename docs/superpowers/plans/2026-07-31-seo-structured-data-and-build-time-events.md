# SEO Structured Data and Build-Time Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put Pack 170's real event dates into crawlable HTML and add `Organization`, `Event`, and `BreadcrumbList` JSON-LD, closing Critical #2 and High #4 from the 2026-07-30 SEO audit.

**Architecture:** The site is `output: 'static'` and all event data lives in `cms.macon170.com`, fetched at runtime in the browser today — so crawlers see placeholder text. This plan moves the fetch to build time (following the `src/pages/about.astro:35` precedent: `fetch` with a 5s timeout and a graceful fallback), renders the timeline server-side, and emits JSON-LD from the same data. The client script is demoted from sole renderer to a freshness refresh. Row markup moves into `src/lib/calendar-render.ts` so the server and client produce identical HTML from one source.

**Tech Stack:** Astro 5 (static output), Cloudflare Workers + Workers Assets, Bun, Vitest via `@cloudflare/vitest-pool-workers` (runs in workerd, not Node), Playwright.

## Global Constraints

- Package manager is **bun**. Never `npm` or `yarn`.
- **Conventional Commits v1.0.0**: `<type>(<scope>): <subject>`, imperative, lowercase start, **no trailing period**.
- Multi-line commit messages go in a file passed with `git commit -F <path>`. Do **not** use `$(cat <<'EOF' ...)` — the validator hook reads the literal shell text as the subject and rejects it.
- Stage **explicit paths** (`git add <path>`). Never `git add -A` / `git add .`.
- **Never switch branches.** No `git checkout`, `git switch`, `git stash`, `git reset --hard`, `git rebase`, `git merge`. A `PreToolUse` hook enforces this.
- Every commit must pass `bun run build && bun run test`.
- `bun run check`, `bun run lint`, `bun run format:check` must pass. Run `bunx prettier --write` on files you touch only.
- Vitest collects `worker/**/*.test.ts` and `src/**/*.test.ts` only, and runs in **workerd** — no `node:fs`. Assert built output by fetching through the Worker's `ASSETS` binding.
- Site origin is `https://www.macon170.com`.
- **A build must never fail because the CMS is unreachable.** Every build-time fetch gets `AbortSignal.timeout(5_000)` inside `try/catch`, degrading to the existing placeholder.

## Live CMS facts (verified 2026-07-31)

`GET https://cms.macon170.com/api/calendar/v1/events` → 200, `{ version: "v1", events: [...] }`, **11 published events**, all `eventStatus: "scheduled"`, spanning 2026-08-23 → 2027-02-09. 9 of 11 carry `address`, 10 carry `endsAt`. Milestones present: `lego-derby`, `pinewood-derby`.

`src/lib/calendar-client.ts` already exports `getCalendarEvents(): Promise<CalendarEvent[]>` with full runtime validation, and `CALENDAR_API_BASE` resolves to the production URL when `import.meta.env.DEV` is false — which is the case during `astro build`. **Call it directly from frontmatter; do not write a second fetch layer.**

## File Structure

| File                                                       | Responsibility                                                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/lib/event-schema.ts`                                  | **Create.** Pure functions mapping pack data and `CalendarEvent` to JSON-LD objects. No I/O, no DOM.      |
| `src/lib/event-schema.test.ts`                             | **Create.** Unit tests for the mappers.                                                                   |
| `src/lib/calendar-render.ts`                               | **Create.** Timeline row markup shared by the server render and the client refresh.                       |
| `src/layouts/BaseLayout.astro`                             | **Modify.** Site-wide `Organization` JSON-LD + a `jsonLd` prop for page-specific schema.                  |
| `src/pages/calendar/index.astro`                           | **Modify.** Build-time fetch, server-rendered timeline, `Event` JSON-LD; client script becomes a refresh. |
| `src/components/PackStrip.astro`                           | **Modify.** Accept the next event as a prop resolved at build time.                                       |
| `src/pages/dens/index.astro`, `src/pages/dens/[den].astro` | **Modify.** `BreadcrumbList` JSON-LD.                                                                     |
| `worker/seo-artifacts.test.ts`                             | **Modify.** Assert served JSON-LD and real dates in HTML.                                                 |
| `docs/CLOUDFLARE-DEPLOYMENT.md`                            | **Modify.** Document the CMS deploy hook and nightly rebuild.                                             |

## Decisions

**JSON-LD reaches `<head>` via a typed `jsonLd` prop, not a named slot.** `BaseLayout` currently has one default slot inside `<main>`. A `jsonLd?: Record<string, unknown> | Record<string, unknown>[]` prop is typed, testable, and cannot inject arbitrary head markup. `Organization` is emitted unconditionally by the layout; pages pass their own schema through the prop.

**Row markup moves to `src/lib/calendar-render.ts`.** Today `milestoneRow()`, `eventRow()`, and `render()` live inside the client `<script>` at `src/pages/calendar/index.astro:126`. Astro client scripts can import from `src/lib/`, so both sides import one implementation. Duplicating the markup would let server and client output drift silently.

**The client script keeps running.** It refreshes the timeline after load so a stale build still self-corrects in the browser. It no longer owns first paint.

## Out of scope

- Enforcing CSP (Phase 5), critical-CSS inlining (Phase 5), Open Graph tags and title/description work (Phase 4).
- Actually creating the CMS deploy hook — it lives in the CMS repository and Cloudflare dashboard. This plan documents what is required; Task 6 records it.

---

### Task 1: Organization JSON-LD and the `jsonLd` prop

**Files:** Create `src/lib/event-schema.ts`, `src/lib/event-schema.test.ts`. Modify `src/layouts/BaseLayout.astro`, `worker/seo-artifacts.test.ts`.

**Interfaces:**

- Consumes: `pack` from `src/data/pack.ts`.
- Produces: `organizationSchema(): Record<string, unknown>` and the `BaseLayout` prop `jsonLd?: Record<string, unknown> | Record<string, unknown>[]`. Tasks 3 and 5 pass their schema through that prop.

- [ ] **Step 1: Write the failing test**

Create `src/lib/event-schema.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { organizationSchema } from './event-schema';

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

  it('names the national organization as parent', () => {
    expect(organizationSchema().parentOrganization).toEqual({
      '@type': 'Organization',
      name: 'Boy Scouts of America',
    });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bunx vitest run src/lib/event-schema.test.ts`
Expected: FAIL — cannot resolve `./event-schema`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/event-schema.ts`:

```typescript
import { pack } from '../data/pack';

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
    parentOrganization: { '@type': 'Organization', name: 'Boy Scouts of America' },
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bunx vitest run src/lib/event-schema.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Emit it from the layout**

In `src/layouts/BaseLayout.astro`, add to the frontmatter imports:

```
import { organizationSchema } from '../lib/event-schema';
```

Change the props block to:

```
type Props = {
  title: string;
  description: string;
  showStrip?: boolean;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};
const { title, description, showStrip = true, noindex = false, jsonLd } = Astro.props;
const pageSchemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
const schemas = [organizationSchema(), ...pageSchemas];
```

Then immediately before `</head>`, add:

```
{schemas.map((schema) => <script type="application/ld+json" set:html={JSON.stringify(schema)} />)}
```

`set:html` is required — Astro would otherwise HTML-escape the JSON and browsers/parsers would reject it.

- [ ] **Step 6: Assert it through the Worker**

Append to `worker/seo-artifacts.test.ts`:

```typescript
describe('structured data', () => {
  async function jsonLdBlocks(path: string): Promise<Record<string, unknown>[]> {
    const html = await (await exports.default.fetch(`${ORIGIN}${path}`)).text();
    return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  }

  it('publishes Organization schema on every page', async () => {
    for (const path of ['/', '/about/', '/calendar/', '/dens/lion/']) {
      const org = (await jsonLdBlocks(path)).find((s) => s['@type'] === 'Organization');
      expect(org, `${path} should carry Organization schema`).toBeDefined();
      expect(org?.['@id']).toBe(`${ORIGIN}/#organization`);
    }
  });

  it('emits JSON-LD that parses as valid JSON, not HTML-escaped text', async () => {
    // A missing set:html directive produces &quot; entities that break every consumer.
    const html = await (await exports.default.fetch(`${ORIGIN}/`)).text();
    expect(html).not.toContain('&quot;@context&quot;');
  });
});
```

- [ ] **Step 7: Run the full suite**

Run: `bun run build && bun run test && bun run check && bun run lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
cat > /tmp/msg-p3-task1.txt <<'MSG'
feat(seo): add Organization JSON-LD site-wide

The site carried no structured data at all, which the 2026-07-30 audit
raised as a Critical finding: search engines had nothing machine-readable
identifying what this organisation is or where it serves.

Adds a typed jsonLd prop to BaseLayout rather than a named head slot, so
pages pass structured data through a checked interface instead of
injecting arbitrary head markup. Tasks for Event and BreadcrumbList
schema use the same prop.

The Organization block deliberately carries no street address. The pack
meets in a chartered organisation's building it does not own, and
claiming that address would assert a business location that does not
exist.
MSG
git add src/lib/event-schema.ts src/lib/event-schema.test.ts src/layouts/BaseLayout.astro worker/seo-artifacts.test.ts
git commit -F /tmp/msg-p3-task1.txt
```

---

### Task 2: Extract shared timeline rendering

Pure refactor, no behaviour change. This exists so Task 3 can server-render the exact markup the client already produces.

**Files:** Create `src/lib/calendar-render.ts`, `src/lib/calendar-render.test.ts`. Modify `src/pages/calendar/index.astro`.

**Interfaces:**

- Consumes: `buildTimeline`, `monthKey`, `monthLabel`, `type SpineEvent` from `src/lib/pack-year.ts`; `annualProgram` from `src/data/pack.ts`.
- Produces: `renderTimelineRows(milestones, events, now?): string` returning the full `<li>` list, and `milestoneProgressNote(milestones, events): string`. Task 3 calls both from frontmatter.

- [ ] **Step 1: Write the failing test**

Create `src/lib/calendar-render.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { renderTimelineRows, milestoneProgressNote } from './calendar-render';
import type { SpineEvent } from './pack-year';

const milestones = [
  { key: 'lego-derby', season: 'August', title: 'Lego Pinewood Derby', state: 'Date to be added', sortMonth: 8 },
] as const;

const event: SpineEvent = {
  slug: 'lego-pinewood-derby-cookout',
  title: 'Lego Pinewood Derby & Cookout',
  startsAt: '2026-08-23T20:00:00.000Z',
  category: 'pack',
  eventStatus: 'scheduled',
  locationName: 'Highland Hills Church',
  milestone: 'lego-derby',
};

describe('renderTimelineRows', () => {
  it('renders a real date once an event claims a milestone', () => {
    const html = renderTimelineRows(milestones, [event]);

    expect(html).toContain('Lego Pinewood Derby &amp; Cookout');
    expect(html).toContain('Highland Hills Church');
    expect(html).not.toContain('Date to be added');
  });

  it('keeps the honest placeholder when no event claims the milestone', () => {
    const html = renderTimelineRows(milestones, []);

    expect(html).toContain('Date to be added');
    expect(html).toContain('August');
  });

  it('escapes event text so CMS content cannot inject markup', () => {
    const hostile = { ...event, title: '<img src=x onerror=alert(1)>' };
    const html = renderTimelineRows(milestones, [hostile]);

    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });
});

describe('milestoneProgressNote', () => {
  it('counts how many milestones have a published date', () => {
    expect(milestoneProgressNote(milestones, [event])).toContain('1 of 1');
  });

  it('says so plainly when nothing is scheduled', () => {
    expect(milestoneProgressNote(milestones, [])).toContain('No milestone dates are published yet');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bunx vitest run src/lib/calendar-render.test.ts`
Expected: FAIL — cannot resolve `./calendar-render`.

- [ ] **Step 3: Move the rendering functions**

Create `src/lib/calendar-render.ts` by moving `escapeHtml`, `dayLabel`, `timeLabel`, `milestoneRow`, and `eventRow` **verbatim** out of the `<script>` block in `src/pages/calendar/index.astro` (they currently start around line 138). Do not rewrite their markup — byte-identical output is the point of this task. Wrap them with:

```typescript
import { buildTimeline, monthKey, monthLabel, milestoneProgress, type Milestone, type SpineEvent } from './pack-year';

// ... moved helpers here, unchanged ...

export function renderTimelineRows(milestones: readonly Milestone[], events: SpineEvent[], now: Date = new Date()): string {
  const entries = buildTimeline(milestones, events, now);
  let month = '';
  const rows: string[] = [];
  for (const entry of entries) {
    const key = monthKey(entry.at);
    if (key !== month) {
      month = key;
      rows.push(`<li class="timeline__month"><h3>${escapeHtml(monthLabel(entry.at))}</h3></li>`);
    }
    rows.push(entry.kind === 'milestone' ? milestoneRow(entry) : eventRow(entry.event));
  }
  return rows.join('');
}

export function milestoneProgressNote(milestones: readonly Milestone[], events: SpineEvent[]): string {
  const progress = milestoneProgress(milestones, events);
  return progress.confirmed
    ? `${progress.confirmed} of ${progress.total} milestones have a published date. The other ${progress.total - progress.confirmed} are still being scheduled by pack volunteers.`
    : 'No milestone dates are published yet. Pack volunteers are still scheduling the year.';
}
```

- [ ] **Step 4: Rewire the client script to import them**

In `src/pages/calendar/index.astro`, replace the moved function bodies in the `<script>` with an import, and reduce `render()` to:

```typescript
import { renderTimelineRows, milestoneProgressNote } from '../../lib/calendar-render';

function render(events: SpineEvent[]) {
  if (!timeline) return;
  timeline.innerHTML = renderTimelineRows(annualProgram, events);
  if (note) note.textContent = milestoneProgressNote(annualProgram, events);
  const count = events.length;
  if (status)
    status.textContent = count
      ? `${count} published date${count === 1 ? '' : 's'} on the calendar, color-coded by who each one is for.`
      : '';
}
```

- [ ] **Step 5: Run tests and confirm no behaviour change**

Run: `bun run build && bun run test && bun run check && bun run lint`
Expected: PASS. The page still renders client-side exactly as before — only the code's location changed.

- [ ] **Step 6: Commit**

```bash
cat > /tmp/msg-p3-task2.txt <<'MSG'
refactor(calendar): extract timeline rendering into a shared module

The row markup lived inside the page's client script, so server-side
rendering would have meant a second copy that could drift from it
silently.

Pure move: the markup is byte-identical and behaviour is unchanged. The
next commit renders these same rows at build time.
MSG
git add src/lib/calendar-render.ts src/lib/calendar-render.test.ts src/pages/calendar/index.astro
git commit -F /tmp/msg-p3-task2.txt
```

---

### Task 3: Server-render the calendar and emit Event JSON-LD

**Files:** Modify `src/lib/event-schema.ts`, `src/lib/event-schema.test.ts`, `src/pages/calendar/index.astro`, `worker/seo-artifacts.test.ts`.

**Interfaces:**

- Consumes: `getCalendarEvents()` from `src/lib/calendar-client.ts`; `renderTimelineRows`/`milestoneProgressNote` from Task 2; the `jsonLd` prop from Task 1.
- Produces: `eventSchema(event: CalendarEvent): Record<string, unknown>`.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/event-schema.test.ts`:

```typescript
import { eventSchema } from './event-schema';
import type { CalendarEvent } from './calendar-client';

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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bunx vitest run src/lib/event-schema.test.ts`
Expected: FAIL — `eventSchema` is not exported.

- [ ] **Step 3: Implement the mapper**

Append to `src/lib/event-schema.ts`:

```typescript
import type { CalendarEvent } from './calendar-client';

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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `bunx vitest run src/lib/event-schema.test.ts`
Expected: PASS, 11 tests total.

- [ ] **Step 5: Fetch and render at build time**

In `src/pages/calendar/index.astro` frontmatter, add below the existing imports:

```
import { getCalendarEvents, type CalendarEvent } from '../../lib/calendar-client';
import { renderTimelineRows, milestoneProgressNote } from '../../lib/calendar-render';
import { eventSchema } from '../../lib/event-schema';

let events: CalendarEvent[] = [];
try {
  events = await getCalendarEvents();
} catch {
  // A CMS outage must not fail the build. The client script refreshes this in the browser,
  // and the milestone spine below still renders the shape of the year.
}
const timelineRows = renderTimelineRows(annualProgram, events);
const progressNote = milestoneProgressNote(annualProgram, events);
const eventSchemas = events.map(eventSchema);
```

Pass the schema to the layout by changing the opening tag to:

```
<BaseLayout
  title="Pack calendar"
  description="See what is next for Cub Scout Pack 170 and plan around the whole program year."
  jsonLd={eventSchemas}
>
```

Then seed the server-rendered markup: set the `#timeline` element's inner HTML with `set:html={timelineRows}`, and the `[data-pm-note]` element's text to `{progressNote}`.

- [ ] **Step 6: Assert real dates and Event schema are served**

Append to the `describe('structured data', ...)` block in `worker/seo-artifacts.test.ts`:

```typescript
it('serves Event schema for the published calendar', async () => {
  const events = (await jsonLdBlocks('/calendar/')).filter((s) => s['@type'] === 'Event');

  expect(events.length).toBeGreaterThan(0);
  for (const event of events) {
    expect(event.startDate, 'every Event needs a startDate').toBeTruthy();
    expect(event.organizer).toEqual({ '@id': `${ORIGIN}/#organization` });
    expect(event.endDate ?? 'absent').not.toBeNull();
  }
});

it('puts real event dates in the calendar HTML, not just in JavaScript', async () => {
  const html = await (await exports.default.fetch(`${ORIGIN}/calendar/`)).text();

  // The whole point of the build-time fetch: a crawler that runs no JS still sees the dates.
  expect(html).toContain('timeline__row');
  expect(html).not.toContain('No milestone dates are published yet');
});
```

- [ ] **Step 7: Run the full suite**

Run: `bun run build && bun run test && bun run check && bun run lint && bun run test:e2e`
Expected: PASS. If the build logs a CMS fetch failure, the fallback worked but the assertions in Step 6 will fail — that is correct, and means the CMS was unreachable, not that the code is wrong. Re-run once reachable.

- [ ] **Step 8: Commit**

```bash
cat > /tmp/msg-p3-task3.txt <<'MSG'
feat(calendar): render published events at build time with Event schema

The calendar fetched its events in the browser, so every crawler saw an
empty timeline and the placeholder note. Eleven published events were
invisible to search entirely.

Astro now fetches the feed during the build and renders the timeline
server-side, then emits schema.org Event JSON-LD from the same data. The
client script still refreshes after load, so a stale build self-corrects
in the browser; it is no longer responsible for first paint.

A CMS outage cannot fail the build: the fetch is wrapped and degrades to
the milestone spine the page already showed.
MSG
git add src/lib/event-schema.ts src/lib/event-schema.test.ts src/pages/calendar/index.astro worker/seo-artifacts.test.ts
git commit -F /tmp/msg-p3-task3.txt
```

---

### Task 4: Put the real next date in the site-wide strip

`src/components/PackStrip.astro:14` hardcodes "The next date is being added", and its client script replaces it after load. Because `BaseLayout.astro:54` renders the strip on every page with `showStrip` defaulting to true, that placeholder is what crawlers see site-wide — **and every page fires its own calendar fetch**.

**Files:** Modify `src/components/PackStrip.astro`, `src/layouts/BaseLayout.astro`, `worker/seo-artifacts.test.ts`.

**Interfaces:**

- Consumes: `getCalendarEvents()`.
- Produces: `PackStrip` gains `nextEvent?: CalendarEvent | null`.

- [ ] **Step 1: Write the failing test**

Append to the `describe('structured data', ...)` block in `worker/seo-artifacts.test.ts`:

```typescript
it('names the real next event in server-rendered HTML on every page', async () => {
  for (const path of ['/', '/join/', '/about/']) {
    const html = await (await exports.default.fetch(`${ORIGIN}${path}`)).text();
    expect(html, `${path} should not ship the placeholder`).not.toContain('The next date is being added');
    expect(html, `${path} should link the next event`).toContain('/events/?event=');
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun run build && bunx vitest run worker/seo-artifacts.test.ts`
Expected: FAIL — the placeholder is present.

- [ ] **Step 3: Resolve the next event once, in the layout**

In `src/layouts/BaseLayout.astro` frontmatter, add:

```
import { getCalendarEvents, type CalendarEvent } from '../lib/calendar-client';

let nextEvent: CalendarEvent | null = null;
if (showStrip) {
  try {
    nextEvent = (await getCalendarEvents())[0] ?? null;
  } catch {
    // The strip keeps its honest fallback copy and the client script tries again.
  }
}
```

Pass it down: `<PackStrip nextEvent={nextEvent} />`.

- [ ] **Step 4: Render it in the strip**

In `src/components/PackStrip.astro`, add to the frontmatter:

```
import type { CalendarEvent } from '../lib/calendar-client';

type Props = { nextEvent?: CalendarEvent | null };
const { nextEvent = null } = Astro.props;
const compactTitle = (title: string) => (title.length > 44 ? `${title.slice(0, 41).trimEnd()}…` : title);
const nextLabel = nextEvent ? compactTitle(nextEvent.title) : 'The next date is being added';
const nextHref = nextEvent ? `/events/?event=${encodeURIComponent(nextEvent.slug)}` : '/calendar/';
const nextAria = nextEvent ? `Open details for ${nextEvent.title}` : 'Open the Pack calendar';
```

Then replace the anchor's hardcoded text, `href`, and `aria-label` with `{nextLabel}`, `{nextHref}`, and `{nextAria}`. Keep the client `<script>` exactly as it is — it still refreshes a stale build.

- [ ] **Step 5: Run it to verify it passes**

Run: `bun run build && bun run test && bun run check && bun run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cat > /tmp/msg-p3-task4.txt <<'MSG'
feat(strip): show the real next event date in server-rendered HTML

The strip hardcoded "The next date is being added" and swapped it in the
browser. Because BaseLayout renders the strip on every page, that
placeholder was what crawlers read site-wide, on the exact question a
family searching for the pack most wants answered.

The layout now resolves the next event once at build time and passes it
down as a prop, so every page ships a real date and a link to the event.
The client script still refreshes it, and the placeholder remains the
fallback when the CMS is unreachable.
MSG
git add src/layouts/BaseLayout.astro src/components/PackStrip.astro worker/seo-artifacts.test.ts
git commit -F /tmp/msg-p3-task4.txt
```

---

### Task 5: BreadcrumbList on the den hierarchy

**Files:** Modify `src/lib/event-schema.ts`, `src/lib/event-schema.test.ts`, `src/pages/dens/index.astro`, `src/pages/dens/[den].astro`, `worker/seo-artifacts.test.ts`.

**Interfaces:**

- Produces: `breadcrumbSchema(trail: Array<{ name: string; path: string }>): Record<string, unknown>`.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/event-schema.test.ts`:

```typescript
import { breadcrumbSchema } from './event-schema';

describe('breadcrumbSchema', () => {
  it('numbers positions from one in trail order', () => {
    const schema = breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Dens', path: '/dens/' },
      { name: 'Lion', path: '/dens/lion/' },
    ]);

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.macon170.com/' },
      { '@type': 'ListItem', position: 2, name: 'Dens', item: 'https://www.macon170.com/dens/' },
      { '@type': 'ListItem', position: 3, name: 'Lion', item: 'https://www.macon170.com/dens/lion/' },
    ]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bunx vitest run src/lib/event-schema.test.ts`
Expected: FAIL — `breadcrumbSchema` is not exported.

- [ ] **Step 3: Implement it**

Append to `src/lib/event-schema.ts`:

```typescript
export function breadcrumbSchema(trail: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: `${SITE_ORIGIN}${step.path}`,
    })),
  };
}
```

- [ ] **Step 4: Wire it into both den pages**

In `src/pages/dens/index.astro`, import `breadcrumbSchema` and pass:

```
jsonLd={breadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Dens', path: '/dens/' },
])}
```

In `src/pages/dens/[den].astro`, import `breadcrumbSchema` and `denSlug` (already imported) and pass:

```
jsonLd={breadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Dens', path: '/dens/' },
  { name: `${rank.name} den`, path: `/dens/${denSlug(rank.name)}/` },
])}
```

- [ ] **Step 5: Assert it through the Worker**

Append to the `describe('structured data', ...)` block in `worker/seo-artifacts.test.ts`:

```typescript
it('publishes a three-step breadcrumb on every den page', async () => {
  for (const den of ['lion', 'tiger', 'wolf', 'bear', 'webelos', 'arrow-of-light']) {
    const crumb = (await jsonLdBlocks(`/dens/${den}/`)).find((s) => s['@type'] === 'BreadcrumbList');
    expect(crumb, `${den} should carry a breadcrumb`).toBeDefined();
    const items = crumb?.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(3);
    expect(items[2].item).toBe(`${ORIGIN}/dens/${den}/`);
  }
});
```

- [ ] **Step 6: Run the full suite**

Run: `bun run build && bun run test && bun run check && bun run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cat > /tmp/msg-p3-task5.txt <<'MSG'
feat(dens): add BreadcrumbList schema to the den hierarchy

The six den pages sit two levels deep with no machine-readable path back
to the section or the site root, so search results showed no hierarchy
for them.

Positions are derived from trail order rather than hardcoded, so a page
cannot ship a breadcrumb numbered out of sequence.
MSG
git add src/lib/event-schema.ts src/lib/event-schema.test.ts src/pages/dens/index.astro 'src/pages/dens/[den].astro' worker/seo-artifacts.test.ts
git commit -F /tmp/msg-p3-task5.txt
```

---

### Task 6: Document the freshness dependency

Build-time data goes stale between deploys. This records what keeps it fresh — the mechanism itself lives outside this repository.

**Files:** Modify `docs/CLOUDFLARE-DEPLOYMENT.md`, `docs/superpowers/specs/2026-07-30-seo-audit-remediation-design.md`.

- [ ] **Step 1: Document the rebuild dependency**

Add a "Calendar freshness" section to `docs/CLOUDFLARE-DEPLOYMENT.md` covering: that `/calendar/` and the site-wide strip are rendered from a build-time fetch of `https://cms.macon170.com/api/calendar/v1/events`; that publishing or editing an event in the CMS therefore does **not** change the site until a rebuild; that the CMS should call a Cloudflare deploy hook on event publish; and that a scheduled nightly rebuild is the safety net so a broken webhook degrades to at-most-24-hour staleness rather than indefinite. Note that the client-side refresh means a visitor's browser still sees current data even when the build is stale — it is crawlers that see the stale copy, which is exactly the audience this work targets.

- [ ] **Step 2: Tick Phase 3 in the spec**

In `docs/superpowers/specs/2026-07-30-seo-audit-remediation-design.md`, mark the Phase 3 acceptance criteria met, except the Rich Results Test item, which needs a deployed URL. Record that one as pending deploy alongside the Phase 1b/2 post-deploy commands.

- [ ] **Step 3: Run the full battery**

Run: `just ci`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cat > /tmp/msg-p3-task6.txt <<'MSG'
docs(seo): record the calendar's build-time freshness dependency

The calendar and the site-wide strip now render from a fetch that runs
during the build, so publishing an event in the CMS does not reach
crawlers until the site rebuilds.

Documents the deploy hook the CMS should call on publish, and the
nightly rebuild that keeps a broken hook to at most a day of staleness
instead of indefinite. Both live outside this repository, which is why
they are written down rather than implemented here.
MSG
git add docs/CLOUDFLARE-DEPLOYMENT.md docs/superpowers/specs/2026-07-30-seo-audit-remediation-design.md
git commit -F /tmp/msg-p3-task6.txt
```
