// Shared program-year logic for the two surfaces that render the milestone spine: the homepage
// strip and the /calendar/ timeline. The fragile part is not the markup, it is deciding which
// published event owns which milestone and where an undated milestone sorts, so that lives here
// once and both surfaces import it.
//
// Milestone keys come from annualProgram in src/data/pack.ts, which the worker also validates
// against, so there is exactly one list.

export type SpineEvent = {
  slug: string;
  title: string;
  startsAt: string;
  endsAt?: string | null;
  category?: string;
  eventStatus?: string;
  locationName?: string | null;
  milestone?: string | null;
};

export type Milestone = {
  key: string;
  season: string;
  title: string;
  state: string;
  /** Nominal month the milestone sits in, so an undated one can still sort into the timeline. */
  sortMonth: number;
};

// The program year's first milestone is the August Lego Derby, but planning has to flip to the new
// year *before* it starts: through July the previous year is finished and every upcoming event
// already belongs to the incoming one. Rolling over in July rather than August is what keeps the
// four anchors in the same year as the events - an August boundary put them a year early all July,
// so the page showed "August 2025" above real August 2026 dates.
const PROGRAM_YEAR_ROLLOVER_MONTH = 7;
/** Months at or after the rollover belong to the program year opening in that calendar year. */
const PROGRAM_YEAR_FIRST_MONTH = 8;
const ZONE = 'America/New_York';

/**
 * Year/month/day in the pack's own timezone. An event stored as 2026-09-15T22:30:00Z is
 * 6:30pm on the 15th in Macon, and grouping it by UTC would file it under the wrong day.
 */
export function zonedParts(iso: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date(iso));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0');
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** The calendar year the current program year opened in. August 2026 and March 2027 both give 2026. */
export function programYearStart(now: Date = new Date()): number {
  const { year, month } = zonedParts(now.toISOString());
  return month >= PROGRAM_YEAR_ROLLOVER_MONTH ? year : year - 1;
}

/**
 * A sortable instant for a milestone that has no event yet, placing it in its nominal month
 * within the current program year. Months before August belong to the following calendar year.
 */
export function nominalMilestoneDate(milestone: Milestone, now: Date = new Date()): Date {
  const start = programYearStart(now);
  const year = milestone.sortMonth >= PROGRAM_YEAR_FIRST_MONTH ? start : start + 1;
  return new Date(Date.UTC(year, milestone.sortMonth - 1, 1, 12));
}

/**
 * One event per milestone key: the soonest wins. Milestones recur every year, so two events can
 * legitimately carry the same key; the nearer one is the more useful of the two.
 */
export function soonestByMilestone(events: SpineEvent[]): Record<string, SpineEvent> {
  const byKey: Record<string, SpineEvent> = {};
  for (const event of events) {
    const key = event.milestone;
    if (!key) continue;
    const held = byKey[key];
    if (!held || Date.parse(event.startsAt) < Date.parse(held.startsAt)) byKey[key] = event;
  }
  return byKey;
}

export type TimelineEntry =
  | { kind: 'milestone'; at: Date; milestone: Milestone; event: SpineEvent | null; done: boolean }
  | { kind: 'event'; at: Date; event: SpineEvent };

/**
 * Merge the four milestone anchors and every ordinary event into one date-ordered stream.
 *
 * A milestone with an associated event sorts by that event's date; one without sorts by its
 * nominal season month, so the spine keeps its shape before any date is entered. Events already
 * claimed by a milestone are not repeated as ordinary rows.
 */
export function buildTimeline(milestones: readonly Milestone[], events: SpineEvent[], now: Date = new Date()): TimelineEntry[] {
  const byKey = soonestByMilestone(events);
  const claimed = new Set(Object.values(byKey).map((event) => event.slug));

  const entries: TimelineEntry[] = milestones.map((milestone) => {
    const event = byKey[milestone.key] ?? null;
    return {
      kind: 'milestone' as const,
      at: event ? new Date(event.startsAt) : nominalMilestoneDate(milestone, now),
      milestone,
      event,
      done: event ? Date.parse(event.endsAt || event.startsAt) < now.getTime() : false,
    };
  });

  for (const event of events) {
    if (claimed.has(event.slug)) continue;
    entries.push({ kind: 'event', at: new Date(event.startsAt), event });
  }

  return entries.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** "September 2026", in the pack's timezone, for a month heading. */
export function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: ZONE, month: 'long', year: 'numeric' }).format(date);
}

/** Stable key for grouping consecutive timeline entries under one month heading. */
export function monthKey(date: Date): string {
  const { year, month } = zonedParts(date.toISOString());
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** How many milestones have a published date, for the summary line both surfaces show. */
export function milestoneProgress(milestones: readonly Milestone[], events: SpineEvent[]): { confirmed: number; total: number } {
  const byKey = soonestByMilestone(events);
  return {
    confirmed: milestones.filter((milestone) => byKey[milestone.key]).length,
    total: milestones.length,
  };
}

/**
 * Paint an already server-rendered spine with live dates. Only ever adds: a milestone with no
 * event keeps the placeholder text the server wrote, so a failed fetch degrades to the honest
 * "being scheduled" state rather than an empty one.
 */
export function paintSpine(root: Element | null, events: SpineEvent[], now: Date = new Date()): void {
  if (!root) return;
  const byKey = soonestByMilestone(events);
  const format = (iso: string) => new Intl.DateTimeFormat('en-US', { timeZone: ZONE, dateStyle: 'medium' }).format(new Date(iso));

  for (const [key, event] of Object.entries(byKey)) {
    const cells = root.querySelectorAll(`[data-pm-row="${CSS.escape(key)}"]`);
    for (const cell of cells) {
      const when = cell.querySelector('[data-pm-when]');
      if (!when) continue;
      cell.setAttribute('data-confirmed', '');
      if (Date.parse(event.endsAt || event.startsAt) < now.getTime()) cell.setAttribute('data-done', '');
      when.textContent = format(event.startsAt);
    }
  }

  const note = root.querySelector('[data-pm-note]') ?? root.parentElement?.querySelector('[data-pm-note]');
  if (!note) return;
  const total = root.querySelectorAll('[data-pm-row]').length;
  const confirmed = Object.keys(byKey).filter((key) => root.querySelector(`[data-pm-row="${CSS.escape(key)}"]`)).length;
  note.textContent = confirmed
    ? `${confirmed} of ${total} milestones have a published date. The other ${total - confirmed} are still being scheduled by pack volunteers.`
    : 'No milestone dates are published yet. Pack volunteers are still scheduling the year.';
}
