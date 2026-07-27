// Official Cub Scout Adventures per rank, current program (effective June 1, 2024).
// Every list below traces to the `source` URL on that entry. Verified 2026-07-27.
// Adventure NAMES are facts and may be listed; the requirement TEXT is Scouting America
// publication content and must not be reproduced here.

export type RankAdventures = {
  rank: string; // must exactly match a `name` in ranks[] in src/data/pack.ts
  verified: boolean;
  required: string[]; // the 6 required adventures, Bobcat first, then program order
  electiveCount: number | null;
  electiveExamples: string[]; // 3-5 real elective adventure names for flavor, [] if unverified
  focus: string; // one plain sentence, YOUR OWN WORDS, on what this rank's year is about
  source: string; // URL you actually fetched
  source2?: string; // second corroborating URL if you have one
};

export const adventures: RankAdventures[] = [
  {
    rank: 'Lion',
    verified: true,
    required: ['Bobcat', 'King of the Jungle', "Lion's Pride", 'Mountain Lion', 'Fun on the Run', 'Lion Roar'],
    electiveCount: null,
    electiveExamples: ['Time to Swim', 'Go Fish', "Let's Camp! Lion", 'On Your Mark', 'Champions for Nature Lion'],
    focus:
      'A kindergartner and an adult partner explore Scouting together for the first time, earning loops for simple, guided activities.',
    // ponytail: the corroborating source here was another pack's site — checked, but not worth a public byline.
    source: 'https://hovc.org/cub-scout-required-and-elective-adventures/',
  },
  {
    rank: 'Tiger',
    verified: true,
    required: ['Bobcat', 'Team Tiger', 'Tiger Circles', 'Tigers in the Wild', 'Tiger Bites', 'Tiger Roar'],
    electiveCount: null,
    electiveExamples: ['Tigers in the Water', 'Fish On', 'Rolling Tigers', 'Tiger Tag', "Let's Camp! Tiger"],
    focus: 'First graders build confidence with a bit more independence from their adult partner while still learning as a den.',
    source: 'https://hovc.org/cub-scout-required-and-elective-adventures/',
    source2: 'https://www.scouting.org/cub-scout-adventures/tiger-bites/',
  },
  {
    rank: 'Wolf',
    verified: true,
    required: ['Bobcat', 'Council Fire', 'Footsteps', 'Paws on the Path', 'Running with the Pack', 'Safety in Numbers'],
    electiveCount: null,
    electiveExamples: ['Paws for Water', 'A Wolf Goes Fishing', 'Pedal with the Pack', 'Code of the Wolf', 'Air of the Wolf'],
    focus: 'Second graders take on more outdoor skill-building and start practicing everyday citizenship and safety habits.',
    source: 'https://hovc.org/cub-scout-required-and-elective-adventures/',
  },
  {
    rank: 'Bear',
    verified: true,
    required: ['Bobcat', 'Paws for Action', 'Fellowship', 'Bear Habitat', 'Bear Strong', 'Standing Tall'],
    electiveCount: null,
    electiveExamples: ['Whittling', 'A Bear Goes Fishing', 'Bear Afloat', 'Marble Madness', 'Bears on Bikes'],
    focus: 'Third graders take on bigger outdoor and community challenges, including their first knife-safety adventure, Whittling.',
    source: 'https://hovc.org/cub-scout-required-and-elective-adventures/',
    source2: 'https://www.scoutingatl.org/BearAdvancement',
  },
  {
    rank: 'Webelos',
    verified: true,
    required: ['Bobcat', 'My Community', 'My Family', 'Webelos Walkabout', 'Stronger, Faster, Higher', 'My Safety'],
    electiveCount: 20,
    electiveExamples: ['Aquanaut', 'Art Explosion', 'Build It', 'Chef’s Knife', 'Earth Rocks'],
    focus:
      'Fourth graders spend a full year in their own single-grade program, choosing from 20 electives to sample outdoor, STEM, and craft skills before Arrow of Light.',
    source: 'https://www.scoutingatl.org/WEBELOSAdvancement',
    source2: 'https://hovc.org/cub-scout-required-and-elective-adventures/',
  },
  {
    rank: 'Arrow of Light',
    verified: true,
    required: ['Bobcat', 'Citizenship', 'Duty to God', 'Outdoor Adventurer', 'Personal Fitness', 'First Aid'],
    electiveCount: 16,
    electiveExamples: ['Engineer', 'Estimations', 'High Tech Outdoors', 'Into the Wild', 'Knife Safety'],
    focus:
      'Fifth graders run their own standalone program built around patrol-method outdoor skills that prepare them to cross over into a Scouts BSA troop.',
    source: 'https://www.scoutingatl.org/AOLAdvancement',
    source2: 'https://hovc.org/cub-scout-required-and-elective-adventures/',
  },
];
