# Redesign /calendar/ empty-first

Date: 2026-07-28
Status: approved, not yet implemented
Supersedes one decision in [milestone-event-association](2026-07-28-milestone-event-association-design.md) — see Passed milestones.

## Problem

`/calendar/` is the most-used page for returning families and the "when do you meet" answer for
prospective ones, and in the site's actual launch state — zero published events — it fails three ways
at once.

1. The empty and error notices are injected into `#calendar-status`, which is styled
   `font-size:.76rem; text-transform:uppercase; font-weight:800; letter-spacing:.06em` in Montserrat.
   So the notice heading _and_ its full paragraph render as roughly 12px all-caps label type. DESIGN.md
   reserves that step for "category and status chips only", calls it "the smallest type the system
   permits", limits uppercase to "edition marks and chapter tabs", and states the Parent Can Read It
   in the Parking Lot rule. One element breaks all three.
2. The copy reads "Use the annual overview below and contact the pack before making a special trip."
   There is no annual overview on `/calendar/` — the four-milestone strip lives on the homepage — and
   "contact the pack" is not a link. A family follows the instruction and finds nothing.
3. The hero's gold "See upcoming events" jumps to `#published-events`, which is the empty region.

Underneath those bugs is a structural mistake: the page is a list view with an apology on top, so its
default state is an absence. The program year is the one thing about this calendar that is always
true, and it is currently only on the homepage.

## Approach

Make the four-milestone program year the page's permanent spine and let published dates attach to it,
so an empty calendar still describes the year rather than apologizing for itself.

The mechanism already exists and is proven — `src/pages/index.astro:189-226` keys events to milestones
through `calendar_events.milestone`, marks confirmed rows with `data-confirmed`, and paints a live
"N of 4 milestones have a published date" note. This work extracts that spine into a shared component
and makes it the calendar's frame. The homepage keeps rendering the same component, so the two pages
stay consistent by construction instead of by discipline.

## Direction: one timeline, milestones as anchors

A single date-ordered stream. Milestones render as large anchor entries; every other published event
nests between them in date order under a month heading.

```
══ AUGUST ═══════════════════════
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ★ LEGO PINEWOOD DERBY       ┃   ← milestone, date published: solid, lifted
┃   Sat Sep 6 · free · all    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
   Sep 9   Pack meeting          ← ordinary published events
   Sep 16  Wolf den · Museum
══ FALL ═════════════════════════
┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐
╎ ★ FALL CAMP                ╎   ← milestone, no date yet: dashed, states so
╎   Dates being scheduled    ╎
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```

Consequences of choosing anchors over a separate strip:

- With zero events the page still renders four anchors in season order with real structure between
  them. The empty state stops being a notice and becomes the year.
- A milestone with no date sorts by its **season**, not by a date it does not have. Season ordering is
  fixed by `annualProgram` array order, which is already authored chronologically.
- Milestones and ordinary events share one visual family with a weight difference, not two unrelated
  components.

## Passed milestones — supersedes the prior spec

**Decision: all four milestones stay visible year-round; a passed one is marked done.** A family
arriving in March sees the whole shape of the year, which is the recruiting argument.

This reverses a deliberate decision in the milestone-event-association spec, which accepted rows
reverting to "Date to be added" specifically to avoid "a second API view for past flagged events."
That cost is now accepted, and the builder must not silently re-resolve it the old way.

`GET /api/events` returns only future events, so the spine cannot currently see a milestone that has
happened. Implement it as an explicit, additive read:

- Extend the public events endpoint with an opt-in parameter (for example `?include=past-milestones`)
  that additionally returns published events carrying a non-null `milestone` whose date has passed,
  within the current program year.
- Default behavior stays exactly as today, so `PackStrip` and any other consumer are unaffected.
- A passed milestone renders in a completed treatment carrying the date it happened. It is a quiet
  state, not an achievement badge.

Cheaper fallback if the API change is refused: mark a milestone done by comparing today against its
season without showing a date. Weaker — it cannot say when the thing happened — and it is a fallback,
not the plan.

Program-year boundary: the year runs fall–spring, so "current program year" needs one definition in
one place. Do not scatter month arithmetic across the component.

## Volume: 15 to 40 events per year

- **Month headings are required**, not optional. They are the timeline's rhythm.
- **A den/pack/family filter belongs on this page.** The category is already on every event and the
  card accents already encode it. A parent with one child in one den should be able to remove the
  other five dens' noise.
- Filtering must not hide the milestone anchors — they are the page's spine, so a filter narrows the
  ordinary entries between them. Filtering to a den does not delete Blue & Gold from the year.
- No pagination at this volume. One year is one page.

## Scope and boundaries

**In scope:** `/calendar/`'s structure and states; extracting the milestone spine into a shared
component; the three P0 defects above as consequences of the restructure; month headings; the
category filter; the additive API parameter.

**Untouched:** the Elementary Adventure Handbook visual world — this is a structural redesign inside
the committed world, so DESIGN.md is amended, not replaced. The homepage's own composition stays as
it is beyond swapping in the shared component. `/events/` detail pages, the admin calendar editor, and
the `milestone` data model are all unchanged.

**Anti-goals:** no month-grid calendar widget; no invented dates or seeded sample events (the loud
placeholder policy holds — an unscheduled milestone says so); no ICS/subscribe in this pass; no
second source of truth for the milestone list, which stays `annualProgram` in `src/data/pack.ts`.

## States

- **Zero published events** (today's real state): four anchors in season order, each stating it is
  being scheduled. No notice, no apology, no tutorial for cards that do not exist. This is the state
  to design first and the one to screenshot for review.
- **Some milestones dated, some not**: mixed solid and dashed anchors, ordinary events between them.
- **Mid-year**: earlier milestones marked done with their dates, later ones upcoming.
- **API unavailable**: the four anchors still render from `annualProgram`, which is server-rendered, so
  the page degrades to the program year plus an honest note that live dates could not load. The page
  must never be empty because a fetch failed.
- **No JavaScript**: same as above — the spine is server-rendered; only the dates need the fetch.
- **A cancelled published event**: keeps carrying its own status, as it does today.

## Interaction and layout

Hierarchy is season → milestone anchor → ordinary events. The existing five-bullet "Open the event
before you load the car" panel is guidance for reading event cards, so it belongs after the timeline
and should not appear when there are no cards to read. The hero's gold action must always land on
something real: with no dates published it points at the spine and says so.

Responsive: the timeline is a single column on a phone, which is its natural shape. Month headings
stay visible while scrolling only if that costs nothing; a sticky heading is not a requirement.

Accessibility: month headings are real headings in the outline, the timeline is a list, and a
milestone's state is stated in text rather than carried by solid-versus-dashed alone — the same rule
the volunteer desk's state chips now follow.

## Decisions a builder must not invent

1. Whether a passed milestone shows its date. It does — see above.
2. How "current program year" is defined. Define it once, in one place.
3. Whether the filter can hide milestone anchors. It cannot.
4. The milestone key list. It comes from `annualProgram`; renaming a title is safe, changing a `key`
   orphans events that hold the old value.
