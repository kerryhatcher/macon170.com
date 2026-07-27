import { describe, expect, it } from 'vitest';
import { adventures } from './adventures';
import { ranks } from './pack';

const all = adventures.flatMap((program) => [
  ...program.required.map((adventure) => ({ ...adventure, rank: program.rank, group: 'required' as const })),
  ...program.electives.map((adventure) => ({ ...adventure, rank: program.rank, group: 'electives' as const })),
  ...program.specialElectives.map((adventure) => ({ ...adventure, rank: program.rank, group: 'specialElectives' as const })),
]);

describe('adventures', () => {
  it('covers every rank in pack.ts, six required each', () => {
    expect(adventures.map((program) => program.rank)).toEqual(ranks.map((rank) => rank.name));
    for (const program of adventures) {
      expect(program.required, program.rank).toHaveLength(6);
    }
  });

  it('gives every adventure a summary short enough to be ours, not the source page’s', () => {
    for (const adventure of all) {
      const label = `${adventure.rank} / ${adventure.name}`;
      expect(adventure.summary.trim(), label).not.toBe('');
      // A one-sentence summary. The floor catches stubs; the ceiling catches a snapshot
      // paragraph pasted in from scouting.org, which must not be reproduced here.
      expect(adventure.summary.length, `${label} (${adventure.summary.length} chars)`).toBeGreaterThan(35);
      expect(adventure.summary.length, `${label} (${adventure.summary.length} chars)`).toBeLessThan(140);
    }
  });

  it('links every adventure to scouting.org except the special electives, which have no page', () => {
    for (const adventure of all) {
      const label = `${adventure.rank} / ${adventure.name}`;
      if (adventure.group === 'specialElectives') {
        expect(adventure.url, label).toBeNull();
      } else {
        expect(adventure.url, label).toMatch(/^https:\/\/www\.scouting\.org\/cub-scout-adventures\/[a-z0-9-]+\/$/);
      }
    }
  });
});
