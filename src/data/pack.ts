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
    room: null,
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
    join: 'https://beascout.scouting.org/',
    facebook: null,
    scoutbook: null,
    payment: null,
    parentHandbook: null,
  },
  dues: {
    amount: null,
    includes: null,
    dueDate: null,
  },
  contact: {
    membershipEmail: null,
    leadershipEmail: null,
    webmasterEmail: null,
    formEndpoint: null,
  },
  leadership: [] as Array<{ role: string; name: string; email: string | null }>,
  dens: [] as Array<{ grade: string; name: string; meeting: string | null }>,
} as const;

export const ranks = [
  { name: 'Lion', grade: 'Kindergarten', color: 'sun', mark: 'L' },
  { name: 'Tiger', grade: '1st grade', color: 'orange', mark: 'T' },
  { name: 'Wolf', grade: '2nd grade', color: 'red', mark: 'W' },
  { name: 'Bear', grade: '3rd grade', color: 'blue', mark: 'B' },
  { name: 'Webelos', grade: '4th grade', color: 'green', mark: 'Web' },
  { name: 'Arrow of Light', grade: '5th grade', color: 'tan', mark: 'AOL' },
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
  'Add pack dues and what they include',
  'Add role-based contact addresses',
  'Add the current adult leadership roster',
  'Add active dens and their meeting patterns',
  'Add approved official or consent-cleared photography',
  'Connect the parent contact form',
] as const;
