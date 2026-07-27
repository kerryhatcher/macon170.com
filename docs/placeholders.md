# Placeholder content audit

Every visitor-facing placeholder, editor callout, and "not supplied yet" fallback on the site,
as of 2026-07-27. Found by reading all pages, components, and `src/data/pack.ts`.

## Root cause

Almost everything below is a fallback rendered because a field in `src/data/pack.ts` is `null`
or an empty array. Fill those in and the placeholders disappear — do not patch the pages.

| `src/data/pack.ts`           | Value       | Placeholders it causes                                                                                                                                                                                                                                                                                                                                |
| ---------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~`meeting.room`~~           | **removed** | Resolved 2026-07-27 — the room varies per meeting, so it is not static pack data. Put it in the calendar event's `location_name` (e.g. "Highland Hills Baptist Church — Fellowship Hall").                                                                                                                                                            |
| `links.facebook` (L46)       | `null`      | resources: "Pack link pending"                                                                                                                                                                                                                                                                                                                        |
| `links.scoutbook` (L47)      | `null`      | resources: "Scoutbook destination has not been supplied yet"                                                                                                                                                                                                                                                                                          |
| ~~`links.payment`~~          | **removed** | Resolved 2026-07-27 — there are no pack or council dues, so there is nothing to collect. The resources card now explains registration fees and links to `/join/`.                                                                                                                                                                                     |
| `links.parentHandbook` (L49) | `null`      | resources: "Pack link pending"                                                                                                                                                                                                                                                                                                                        |
| ~~`dues.*`~~                 | **removed** | Resolved 2026-07-27 — replaced by `cost`. There are no pack or council dues; the only cost is Scouting America's national registration fee ($87.55 youth / $66.95 adult, verified against a real my.scouting.org checkout) plus the Military Family Fee Waiver. `/join/` states all of it and the "Pack editor: cost details needed" callout is gone. |
| ~~`contact.*Email`~~         | **removed** | Resolved 2026-07-27 — the pack publishes no adult email addresses; all contact funnels through `/contact/`. The privacy webmaster callout, the volunteer "role-based address" line, and the contact-page intro caveat are gone.                                                                                                                       |
| ~~`leadership: []`~~         | **removed** | Resolved 2026-07-27 — the roster moved to `src/data/leadership.md` and renders on `/about/`. Markdown so pack editors can change it without touching TypeScript. Partial roster (4 of ~7 roles), but no placeholder text.                                                                                                                             |
| ~~`dens: []`~~               | **removed** | Resolved 2026-07-27 — all six dens are active, and `ranks` already encodes one den per grade, so the array was redundant. Per-den schedules are set after the first pack meeting of the school year, which `/` and `/join/` now state as a fact.                                                                                                      |

## Editor callout boxes (`notice notice--editor`) — rendered to the public

None remain as of 2026-07-27. The only `notice--editor` left is
`src/pages/calendar/index.astro:113`, and that is a genuine "Calendar unavailable" error state, not
a placeholder.

## Per-page findings

### `/` — src/pages/index.astro

- `:124` "Exact Pack 170 dates are being gathered from leadership." — annual program has no real dates.
- Den text resolved 2026-07-27; the six-rank grid is the den list.

### `/join/` — src/pages/join.astro

- `:35` `noteBody="Loading the next scheduled Pack 170 meeting…"` — transient, replaced by JS from the events API.
- Den text, cost section, and the editor callout all resolved 2026-07-27. Nothing left on this page.

### `/resources/` — src/pages/resources.astro

- `:32` "The Pack 170 Scoutbook destination has not been supplied yet."
- `:71` "Pack link pending" — link-text fallback, currently hit by Facebook and parent handbook.
- The payments card became a "Registration fees" card on 2026-07-27 and is no longer a placeholder.

### `/privacy/` — src/pages/privacy.astro

- Clean as of 2026-07-27. Policy status is "In effect"; the Contact section points at `/contact/`.

### `/calendar/` — src/pages/calendar/index.astro

- `:26` "Loading the Pack 170 calendar…" — transient loading state, fine.
- `:100` "Location being confirmed" — per-event fallback when the API returns a null `location_name`;
  fix in the calendar data, not the page.

### Components — src/components/PackStrip.astro

- `:18` "The next date is being added" — fallback link text when no next event is available.

### `src/data/pack.ts` annual program (L76–81)

Six entries whose `state` is a placeholder string, surfaced on the homepage timeline:
Join Scouting Night, Popcorn fundraiser, Pinewood Derby, Blue & Gold Banquet, Crossover,
Summer camp — all "Date to be added" / "Dates to be added".

## Checked and clean

- `src/pages/about.astro`, `src/pages/activities.astro`, `src/pages/events/index.astro`,
  `src/layouts/BaseLayout.astro`, and the other components — no placeholders.
- No `TODO`/`FIXME`/`lorem`/`example.com`/`555-`/`XXX` tokens anywhere in `src/` or `worker/`.
- `src/pages/contact.astro:83` "Form connection pending" and `:87` "The secure form connection is
  not ready yet." are **not currently showing** — `contact.formEndpoint` is set to `/api/contact`,
  so `hasEndpoint` is true. Dead-path fallbacks only.
