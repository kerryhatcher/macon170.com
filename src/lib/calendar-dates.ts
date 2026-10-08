/** All-day end dates are inclusive, in the pack's timezone. */
export function allDayDateRange(event: { startsAt: string; endsAt?: string | null }): string {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt || event.startsAt);
  const full = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  if (full.format(start) === full.format(end)) return full.format(start);
  const year = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric' });
  const first =
    year.format(start) === year.format(end)
      ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }).format(start)
      : full.format(start);
  return `${first} – ${full.format(end)}`;
}
