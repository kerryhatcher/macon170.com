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
