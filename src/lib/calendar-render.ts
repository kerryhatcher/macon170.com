import { buildTimeline, monthKey, monthLabel, milestoneProgress, type Milestone, type SpineEvent } from './pack-year';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character,
  );
const dayLabel = (value: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric' }).format(
    new Date(value),
  );
const timeLabel = (value: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeStyle: 'short' }).format(new Date(value));

function milestoneRow(entry: Extract<ReturnType<typeof buildTimeline>[number], { kind: 'milestone' }>): string {
  const { milestone, event, done } = entry;
  // No event yet: keep the honest placeholder the server already wrote rather than inventing a date.
  const when = event ? `${dayLabel(event.startsAt)} · ${timeLabel(event.startsAt)}` : milestone.state;
  const where = event?.locationName ? `<span class="timeline__where">${escapeHtml(event.locationName)}</span>` : '';
  const state = done ? '<span class="timeline__state">Held this year</span>' : '';
  const open = event ? `<a class="timeline__open" href="/events/?event=${encodeURIComponent(event.slug)}">Open event details</a>` : '';
  const flags = [event ? 'data-confirmed' : '', done ? 'data-done' : ''].filter(Boolean).join(' ');
  // The season is only a stand-in for a date we do not have yet. Once an event is associated the
  // real date supersedes it, and keeping both contradicts itself: Pinewood Derby's season reads
  // "Late January" while the pack actually holds it at Scout Sunday on February 7, which would
  // print "LATE JANUARY" under a "February 2027" heading.
  const season = event ? '' : `<span class="timeline__season">${escapeHtml(milestone.season)}</span>`;
  return `<li class="timeline__row timeline__row--milestone" data-pm-row="${escapeHtml(milestone.key)}" ${flags}>
      ${season}
      <strong class="timeline__title">${escapeHtml(event ? event.title : milestone.title)}</strong>
      <small class="timeline__when" data-pm-when>${escapeHtml(when)}</small>${where}${state}${open}
    </li>`;
}

function eventRow(event: SpineEvent): string {
  // Only a state that changes a family's plans earns a chip; "scheduled" is the silent default.
  const flag =
    (event.eventStatus ?? '').toLowerCase() === 'scheduled'
      ? ''
      : `<span class="event-status">${escapeHtml(event.eventStatus ?? '')}</span>`;
  const where = event.locationName ? `<span class="timeline__where">${escapeHtml(event.locationName)}</span>` : '';
  return `<li class="timeline__row timeline__row--event" data-category="${escapeHtml(event.category ?? 'pack')}">
      <span class="timeline__day">${dayLabel(event.startsAt)} · ${timeLabel(event.startsAt)}</span>
      <a class="timeline__title" href="/events/?event=${encodeURIComponent(event.slug)}">${escapeHtml(event.title)}</a>
      <span class="event-cat">${escapeHtml(event.category ?? 'pack')}</span>${flag}${where}
    </li>`;
}

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
