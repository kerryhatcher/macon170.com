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
      covers: 'the $85.00 national youth registration fee, reduced to $0 — leaving just the $2.55 admin fee',
      how: 'Select “Get Military Discount Code” during online registration, complete verification, then enter the code at checkout.',
      caveat: 'Youth registrations only, online only — new and renewing. Adult registration and admin fees still apply.',
    },
  },
  // All contact funnels through the form. The pack publishes no adult email addresses.
  contact: {
    formEndpoint: '/api/contact',
  },
  // ponytail: roster lives in src/data/leadership.md so pack editors can edit prose, not TypeScript.
  // ponytail: no `dens` array — `ranks` below already encodes one den per grade, and all six are
  // active. Per-den schedules are set after the first pack meeting, so they are not site data.
} as const;

// `emblem` is the official badge of rank in assets/offical/, rendered by RankEmblem.astro.
// It replaced a `mark` letter ('L', 'T', …) that stood in before the official art was on hand.
export const ranks = [
  { name: 'Lion', grade: 'Kindergarten', color: 'sun', emblem: 'Lion1.webp' },
  { name: 'Tiger', grade: '1st grade', color: 'orange', emblem: 'Tiger1.webp' },
  { name: 'Wolf', grade: '2nd grade', color: 'red', emblem: 'Wolf1.webp' },
  { name: 'Bear', grade: '3rd grade', color: 'blue', emblem: 'Bear1.webp' },
  { name: 'Webelos', grade: '4th grade', color: 'green', emblem: 'Webelos1.webp' },
  { name: 'Arrow of Light', grade: '5th grade', color: 'tan', emblem: 'Arrows-of-Ligth-1.webp' },
] as const;

export const annualProgram = [
  { season: 'Fall', title: 'Join Scouting Night', state: 'Date to be added' },
  { season: 'Sep–Nov', title: 'Popcorn fundraiser', state: 'Dates to be added' },
  { season: 'Late January', title: 'Pinewood Derby', state: 'Date to be added' },
  { season: 'February', title: 'Blue & Gold Banquet', state: 'Date to be added' },
  { season: 'Spring', title: 'Crossover', state: 'Date to be added' },
  { season: 'Summer', title: 'Summer camp', state: 'Dates to be added' },
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
    description: 'The pack’s annual celebration of Cub Scouting, shared accomplishments, and community.',
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
