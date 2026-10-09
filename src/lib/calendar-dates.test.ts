import { expect, it } from 'vitest';
import { allDayDateRange } from './calendar-dates';

it('shows the inclusive campout dates without hours', () => {
  expect(allDayDateRange({ startsAt: '2026-10-24T16:00:00Z', endsAt: '2026-10-25T16:00:00Z' })).toBe('Oct 24 – Oct 25, 2026');
});
it('uses the pack timezone for a single day and repeats years across a year boundary', () => {
  expect(allDayDateRange({ startsAt: '2026-10-25T01:00:00Z' })).toBe('Oct 24, 2026');
  expect(allDayDateRange({ startsAt: '2026-12-31T17:00:00Z', endsAt: '2027-01-01T17:00:00Z' })).toBe('Dec 31, 2026 – Jan 1, 2027');
});
