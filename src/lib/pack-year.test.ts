import { describe, expect, it } from 'vitest';
import { annualProgram } from '../data/pack';
import {
  buildTimeline,
  milestoneProgress,
  monthKey,
  nominalMilestoneDate,
  programYearStart,
  soonestByMilestone,
  zonedParts,
} from './pack-year';
import type { Milestone, SpineEvent } from './pack-year';

const event = (slug: string, starts_at: string, extra: Partial<SpineEvent> = {}): SpineEvent => ({
  slug,
  title: slug,
  starts_at,
  ...extra,
});

describe('zonedParts', () => {
  it('files a late-evening UTC event under the pack’s own day, not the UTC day', () => {
    // 2026-09-15T22:30:00Z is 6:30pm EDT on the 15th in Macon. Grouping by UTC is still the 15th
    // here, but an 8pm event is the 16th in UTC and must not jump a month at a month boundary.
    expect(zonedParts('2026-09-15T22:30:00.000Z')).toEqual({ year: 2026, month: 9, day: 15 });
    // 2026-10-01T01:00:00Z is 9pm EDT on Sep 30 - UTC would file this under October.
    expect(zonedParts('2026-10-01T01:00:00.000Z')).toEqual({ year: 2026, month: 9, day: 30 });
  });
});

describe('programYearStart', () => {
  it('treats July onward as the opening of the year, and earlier months as its tail', () => {
    expect(programYearStart(new Date('2026-08-01T12:00:00Z'))).toBe(2026);
    expect(programYearStart(new Date('2026-12-31T12:00:00Z'))).toBe(2026);
    // March 2027 is still the 2026-27 program year.
    expect(programYearStart(new Date('2027-03-01T12:00:00Z'))).toBe(2026);
    expect(programYearStart(new Date('2027-08-01T12:00:00Z'))).toBe(2027);
  });

  it('rolls over in July so the anchors sit with the events, not a year behind them', () => {
    // Regression: on 2026-07-28 an August boundary returned 2025, which put the four anchors in
    // August 2025 - January 2026 while every published event was August 2026 onward, so the
    // timeline showed two Augusts and the spine was a year adrift.
    expect(programYearStart(new Date('2026-07-28T12:00:00Z'))).toBe(2026);
    expect(programYearStart(new Date('2026-06-30T12:00:00Z'))).toBe(2025);
  });
});

describe('nominalMilestoneDate', () => {
  const now = new Date('2026-09-01T12:00:00Z');
  const at = (key: string) => nominalMilestoneDate(annualProgram.find((m) => m.key === key) as Milestone, now);

  it('places spring milestones in the following calendar year', () => {
    expect(at('lego-derby').getUTCFullYear()).toBe(2026);
    expect(at('fall-camp').getUTCFullYear()).toBe(2026);
    // Late January and February belong to 2027 within the 2026-27 year.
    expect(at('pinewood-derby').getUTCFullYear()).toBe(2027);
    expect(at('blue-gold').getUTCFullYear()).toBe(2027);
  });

  it('keeps the four milestones in program-year order', () => {
    const order = annualProgram.map((m) => nominalMilestoneDate(m as Milestone, now).getTime());
    expect([...order]).toEqual([...order].sort((a, b) => a - b));
  });
});

describe('soonestByMilestone', () => {
  it('ignores unassociated events and lets the soonest claim a recurring key', () => {
    const byKey = soonestByMilestone([
      event('plain-meeting', '2026-09-15T22:30:00.000Z'),
      event('derby-2027', '2027-01-24T18:00:00.000Z', { milestone: 'pinewood-derby' }),
      event('derby-2026', '2026-01-24T18:00:00.000Z', { milestone: 'pinewood-derby' }),
    ]);
    expect(Object.keys(byKey)).toEqual(['pinewood-derby']);
    expect(byKey['pinewood-derby'].slug).toBe('derby-2026');
  });
});

describe('buildTimeline', () => {
  const now = new Date('2026-09-01T12:00:00Z');

  it('holds the spine when nothing is associated - production’s current state', () => {
    // Ten published events, none carrying a milestone: every anchor must still appear, in season
    // order, and no event may be swallowed.
    const events = [
      event('lego', '2026-08-23T20:00:00.000Z'),
      event('sept-pack', '2026-09-15T22:30:00.000Z'),
      event('scout-sunday', '2027-02-07T14:30:00.000Z'),
    ];
    const entries = buildTimeline(annualProgram, events, now);
    const milestones = entries.filter((e) => e.kind === 'milestone');
    expect(milestones).toHaveLength(4);
    expect(milestones.every((m) => m.kind === 'milestone' && m.event === null)).toBe(true);
    expect(entries.filter((e) => e.kind === 'event')).toHaveLength(3);
    // Sorted ascending overall.
    const times = entries.map((e) => e.at.getTime());
    expect([...times]).toEqual([...times].sort((a, b) => a - b));
  });

  it('does not repeat an event that already fills a milestone row', () => {
    const events = [event('lego', '2026-08-23T20:00:00.000Z', { milestone: 'lego-derby' }), event('sept-pack', '2026-09-15T22:30:00.000Z')];
    const entries = buildTimeline(annualProgram, events, now);
    expect(entries.filter((e) => e.kind === 'event').map((e) => e.kind === 'event' && e.event.slug)).toEqual(['sept-pack']);
    const lego = entries.find((e) => e.kind === 'milestone' && e.milestone.key === 'lego-derby');
    expect(lego?.kind === 'milestone' && lego.event?.slug).toBe('lego');
  });

  it('sorts an associated milestone by its real date rather than its season', () => {
    // Fall camp nominally sits in October; give it a December event and it must move after a
    // November date instead of staying in its nominal slot.
    const events = [event('camp', '2026-12-05T15:00:00.000Z', { milestone: 'fall-camp' }), event('nov-pack', '2026-11-10T23:30:00.000Z')];
    const entries = buildTimeline(annualProgram, events, now);
    const slugs = entries.map((e) => (e.kind === 'event' ? e.event.slug : e.milestone.key));
    expect(slugs.indexOf('nov-pack')).toBeLessThan(slugs.indexOf('fall-camp'));
  });

  it('marks a milestone whose event has finished as done', () => {
    const later = new Date('2026-10-01T12:00:00Z');
    const entries = buildTimeline(annualProgram, [event('lego', '2026-08-23T20:00:00.000Z', { milestone: 'lego-derby' })], later);
    const lego = entries.find((e) => e.kind === 'milestone' && e.milestone.key === 'lego-derby');
    expect(lego?.kind === 'milestone' && lego.done).toBe(true);
  });

  it('groups consecutive entries into months without collapsing distinct months', () => {
    const entries = buildTimeline(annualProgram, [event('a', '2026-09-15T22:30:00.000Z'), event('b', '2026-09-20T22:30:00.000Z')], now);
    const septs = entries.filter((e) => monthKey(e.at) === '2026-09');
    expect(septs.length).toBeGreaterThanOrEqual(2);
    expect(monthKey(new Date('2026-10-01T01:00:00.000Z'))).toBe('2026-09');
  });
});

describe('milestoneProgress', () => {
  it('counts only milestones that actually have an associated event', () => {
    expect(milestoneProgress(annualProgram, [])).toEqual({ confirmed: 0, total: 4 });
    expect(milestoneProgress(annualProgram, [event('lego', '2026-08-23T20:00:00.000Z', { milestone: 'lego-derby' })])).toEqual({
      confirmed: 1,
      total: 4,
    });
    // An unknown key cannot inflate the count.
    expect(milestoneProgress(annualProgram, [event('x', '2026-08-23T20:00:00.000Z', { milestone: 'not-a-milestone' })])).toEqual({
      confirmed: 0,
      total: 4,
    });
  });
});
