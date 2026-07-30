// PACK EDITORS: Update pack-specific facts here. Do not bury facts in page files.
// null means "not supplied yet." The site will show an honest, useful fallback.

export type PackEvent = {
  slug: string;
  title: string;
  category: 'pack' | 'den' | 'family';
  status: 'scheduled' | 'tentative' | 'cancelled';
  date: string | null;
  dateLabel: string;
  time: string | null;
  location: string | null;
  summary: string;
  details: string;
  audience: string;
  registrationUrl: string | null;
};

export const pack = {
  name: 'Cub Scout Pack 170',
  shortName: 'Pack 170',
  city: 'Macon, Georgia',
  neighborhood: 'Shirley Hills',
  grades: 'Kindergarten–5th grade',
  welcome: 'Boys and girls welcome',
  meeting: {
    cadence: 'Roughly once a month',
    day: 'Tuesday',
    time: '6:30 PM',
    location: 'Highland Hills Baptist Church',
    address: '1370 Briarcliff Rd, Macon, GA 31211',
    // ponytail: no `room` here — it varies per meeting; put it in the calendar event's location.
  },
  charteredOrganization: {
    name: 'Highland Hills Baptist Church',
    url: 'https://highlandhillsbaptist.org/',
  },
  council: {
    name: 'Central Georgia Council',
    url: 'https://www.centralgeorgiacouncil.org/',
    phone: '(478) 743-9386',
    email: 'centralgeorgiacouncil@scouting.org',
  },
  links: {
    join: 'https://beascout.scouting.org/list/?zip=31201&program%5B%5D=pack&unitID=234351',
    facebook: 'https://www.facebook.com/Pack170Macon',
    // Scouting America's advancement portal, not a Pack 170-specific URL. Parents sign in
    // with their my.scouting account to see their own Scout.
    scoutbook: 'https://advancements.scouting.org/',
    // ponytail: no `payment` link — there are no pack or council dues to collect.
    // ponytail: no `parentHandbook` — the pack has none and will not have one. Uniform and
    // handbook questions go through /contact/; BSA publications cannot be reproduced here anyway.
  },
  // Pack 170 charges no pack dues and the council charges none either. The only cost to join is
  // Scouting America's national registration fee, paid at online checkout.
  // Figures verified against a real my.scouting.org checkout for Pack 0170, 2026-07-27.
  cost: {
    youth: '$87.55 per Cub Scout ($85.00 registration + $2.55 online admin fee)',
    adult: '$66.95 per registered adult ($65.00 registration + $1.95 online admin fee)',
    optional: 'Scout Life magazine is an optional $15 add-on at checkout, not required.',
    localDues: 'None. Pack 170 charges no pack dues, and there are no council dues.',
    // Military Family Fee Waiver, effective June 1, 2026 (Scouting America).
    militaryWaiver: {
      eligibility: 'families with current service in the Active Duty, Reserve, National Guard, or Coast Guard',
      covers: 'the $85.00 national youth registration fee, reduced to $0, leaving just the $2.55 admin fee',
      how: 'Select “Get Military Discount Code” during online registration, complete verification, then enter the code at checkout.',
      caveat: 'Youth registrations only, online only, new and renewing alike. Adult registration and admin fees still apply.',
    },
  },
  // All contact funnels through the form. The pack publishes no adult email addresses.
  contact: {
    formEndpoint: '/api/contact',
  },
  // ponytail: the public leadership roster is loaded from cms.macon170.com on the About page.
  // ponytail: no `dens` array — `ranks` below already encodes one den per grade, and all six are
  // active. Per-den schedules are set after the first pack meeting, so they are not site data.
} as const;

// `emblem` is the official badge of rank in assets/official/, rendered by RankEmblem.astro.
// It replaced a `mark` letter ('L', 'T', …) that stood in before the official art was on hand.
export const ranks = [
  { name: 'Lion', grade: 'Kindergarten', color: 'sun', emblem: 'Lion1.webp' },
  { name: 'Tiger', grade: '1st grade', color: 'orange', emblem: 'Tiger1.webp' },
  { name: 'Wolf', grade: '2nd grade', color: 'red', emblem: 'Wolf1.webp' },
  { name: 'Bear', grade: '3rd grade', color: 'blue', emblem: 'Bear1.webp' },
  { name: 'Webelos', grade: '4th grade', color: 'green', emblem: 'Webelos1.webp' },
  { name: 'Arrow of Light', grade: '5th grade', color: 'tan', emblem: 'Arrows-of-Ligth-1.webp' },
] as const;

// The annual rhythm is known fact (see PRODUCT.md Operating Context) and is NOT the calendar:
// these are recurring milestones, while D1 holds specific dated events. A calendar event claims a
// milestone by storing its `key` in calendar_events.milestone, set from a dropdown in the admin UI.
// A milestone with no event associated to it keeps its `state` placeholder on the homepage.
//
// `key` is a stored database value: rewording a `title` is safe, but changing a `key` orphans every
// event that holds the old one. Add a migration if a key ever has to change.
export const annualProgram = [
  // The year opens with the Lego Pinewood Derby & Cookout — a free August event families are asked
  // to invite anyone interested in Scouting to, so it is the pack's Join Scouting Night in practice
  // (docs/calendar.md:4, Cubmaster 2026-07-28). There is no separate Join Scouting Night milestone.
  //
  // Why Lego, and why it opens the year (Cubmaster 2026-07-28): the cars are built out of Lego at
  // the event itself, on the same track and setup and under the same tournament rules as the real
  // Pinewood Derby in late January. The January derby needs a wooden car built at home beforehand,
  // which a family that has just heard of the pack cannot have; building on the spot lets a
  // prospective or brand-new Scout join the build instead of arriving empty-handed, and the kids
  // iterate on designs during the event. It is a genuine dry run of the January experience, not a
  // toy substitute for it — which is exactly why it works as the recruiting event.
  // sortMonth places a milestone on the /calendar/ timeline before any event is associated with it,
  // so the spine keeps its shape while dates are still being entered. It is the nominal month of the
  // season, not a claim about a date: months from August on belong to the program year's opening
  // calendar year, earlier ones to the following year (see src/lib/pack-year.ts).
  { key: 'lego-derby', season: 'August', title: 'Lego Pinewood Derby', state: 'Date to be added', sortMonth: 8 },
  { key: 'fall-camp', season: 'Fall', title: 'Fall camp', state: 'Dates to be added', sortMonth: 10 },
  { key: 'pinewood-derby', season: 'Late January', title: 'Pinewood Derby', state: 'Date to be added', sortMonth: 1 },
  // The crossover is not a separate milestone: Pack 170 holds it at the Blue & Gold Banquet, and the
  // pack calls it the Arrow of Light Ceremony (both confirmed by the Cubmaster, 2026-07-28). This
  // matches Scouting America's guidance — see docs/research/cub-scouting.md:70. The strip has room
  // for one short title, so the ceremony is named on /activities/ instead.
  { key: 'blue-gold', season: 'February', title: 'Blue & Gold Banquet', state: 'Date to be added', sortMonth: 2 },
] as const;

export const events: PackEvent[] = [];

export const activities = [
  {
    slug: 'pinewood-derby',
    title: 'Build it. Race it. Cheer together.',
    shortTitle: 'Pinewood Derby',
    season: 'Late January',
    illustration: 'car',
    description: 'A signature Cub Scouting tradition centered on designing, building, and racing a small wooden car with family support.',
  },
  {
    slug: 'camping',
    title: 'Wake up under Georgia pines.',
    shortTitle: 'Camping & outdoors',
    season: 'Fall & spring',
    illustration: 'tent',
    description: 'Age-appropriate outdoor experiences where families learn, explore, and spend time together.',
  },
  {
    slug: 'blue-gold',
    title: 'Celebrate a year of doing your best.',
    shortTitle: 'Blue & Gold Banquet',
    season: 'February',
    illustration: 'banner',
    // The Arrow of Light Ceremony — the crossover into Scouts BSA — happens here, not at a separate
    // spring event. Confirmed by the Cubmaster, 2026-07-28.
    description:
      'The pack’s annual celebration of Cub Scouting, shared accomplishments, and community. It is also where the Arrow of Light Ceremony happens: our fifth graders cross the bridge into a Scouts BSA troop.',
  },
  {
    slug: 'service',
    title: 'Help the neighborhood we call home.',
    shortTitle: 'Service',
    season: 'Throughout the year',
    illustration: 'hands',
    description: 'Practical, family-friendly opportunities to care for our community and learn responsibility together.',
  },
] as const;

export const editorChecklist = [
  'Add this program year’s event dates',
  'Add role-based contact addresses',
  'Add active dens and their meeting patterns',
  'Add approved official or consent-cleared photography',
  'Add role-based recipient and webmaster emails',
] as const;
