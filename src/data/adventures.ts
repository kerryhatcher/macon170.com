// Official Cub Scout Adventures per rank, current program (effective June 1, 2024).
// Names, links, and icon filenames are transcribed from the rank pages under
// https://www.scouting.org/programs/cub-scouts/adventures/ — see the ## Adventures section of
// docs/Offical-info.md, verified 2026-07-27. Adventure NAMES are facts and may be listed; the
// requirement TEXT is Scouting America publication content and must not be reproduced here.
// Icons live in assets/offical/ and are resolved by src/lib/official-image.ts.

export type Adventure = {
  name: string;
  url: string | null; // scouting.org page, null for the special electives, which have none
  icon: string; // filename in assets/offical/
};

export type RankAdventures = {
  rank: string; // must exactly match a `name` in ranks[] in src/data/pack.ts
  verified: boolean;
  required: Adventure[]; // the 6 required adventures, Bobcat first, then program order
  electives: Adventure[];
  specialElectives: Adventure[]; // only earned at approved events with qualified instructors
  focus: string; // one plain sentence, YOUR OWN WORDS, on what this rank's year is about
  source: string; // the rank page these lists came from
};

export const adventures: RankAdventures[] = [
  {
    rank: 'Lion',
    verified: true,
    required: [
      { name: 'Bobcat Lion', url: 'https://www.scouting.org/cub-scout-adventures/bobcat-lion/', icon: 'lion_Lion_Bobcat.webp' },
      { name: 'Fun on the Run', url: 'https://www.scouting.org/cub-scout-adventures/fun-on-the-run/', icon: 'lion_Fun_On_The_Run.webp' },
      { name: 'Lion’s Roar', url: 'https://www.scouting.org/cub-scout-adventures/lions-roar/', icon: 'lion_Lions_Roar.webp' },
      { name: 'Lion’s Pride', url: 'https://www.scouting.org/cub-scout-adventures/lions-pride/', icon: 'lion_Lions_Pride.webp' },
      {
        name: 'King of the Jungle',
        url: 'https://www.scouting.org/cub-scout-adventures/king-of-the-jungle/',
        icon: 'lion_King_of_The_Jungle.webp',
      },
      { name: 'Mountain Lion', url: 'https://www.scouting.org/cub-scout-adventures/mountain-lion/', icon: 'lion_Mountain_Lion.webp' },
    ],
    electives: [
      {
        name: 'Build It Up, Knock It Down',
        url: 'https://www.scouting.org/cub-scout-adventures/build-it-up-knock-it-down/',
        icon: 'lion_Build_It_Up_Knock_It_Down.webp',
      },
      {
        name: 'Champions for Nature Lion',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-lion/',
        icon: 'lion_Champions_of_Nature.webp',
      },
      { name: 'Count On Me', url: 'https://www.scouting.org/cub-scout-adventures/count-on-me/', icon: 'lion_Count_On_Me.webp' },
      { name: 'Everyday Tech', url: 'https://www.scouting.org/cub-scout-adventures/everyday-tech/', icon: 'lion_Everyday_Tech.webp' },
      {
        name: 'Gizmos and Gadgets',
        url: 'https://www.scouting.org/cub-scout-adventures/gizmos-and-gadgets/',
        icon: 'lion_Gizmos_and_Gadgets.webp',
      },
      { name: 'Go Fish', url: 'https://www.scouting.org/cub-scout-adventures/go-fish/', icon: 'lion_Go_Fish.webp' },
      {
        name: 'I’ll Do It Myself',
        url: 'https://www.scouting.org/cub-scout-adventures/ill-do-it-myself/',
        icon: 'lion_Ill_Do_It_Myself.webp',
      },
      { name: 'Let’s Camp Lion', url: 'https://www.scouting.org/cub-scout-adventures/lets-camp-lion/', icon: 'lion_Lets_Camp.webp' },
      { name: 'On a Roll', url: 'https://www.scouting.org/cub-scout-adventures/on-a-roll/', icon: 'lion_On_a_Roll.webp' },
      { name: 'On Your Mark', url: 'https://www.scouting.org/cub-scout-adventures/on-your-mark/', icon: 'lion_On_Your_Mark.webp' },
      { name: 'Pick My Path', url: 'https://www.scouting.org/cub-scout-adventures/pick-my-path-lion/', icon: 'lion_Pick_My_Path.webp' },
      { name: 'Race Time Lion', url: 'https://www.scouting.org/cub-scout-adventures/race-time-lion/', icon: 'lion_Race_Time.webp' },
      { name: 'Ready, Set, Grow', url: 'https://www.scouting.org/cub-scout-adventures/ready-set-grow/', icon: 'lion_Ready_Set_Grow.webp' },
      { name: 'Time to Swim', url: 'https://www.scouting.org/cub-scout-adventures/time-to-swim/', icon: 'lion_Time_to_Swim.webp' },
    ],
    specialElectives: [
      { name: 'Archery Lion', url: null, icon: 'lion_Archery.webp' },
      { name: 'Slingshot', url: null, icon: 'lion_Slingshot.webp' },
    ],
    focus:
      'A kindergartner and an adult partner explore Scouting together for the first time, earning loops for simple, guided activities.',
    source: 'https://www.scouting.org/programs/cub-scouts/adventures/lion/',
  },
  {
    rank: 'Tiger',
    verified: true,
    required: [
      { name: 'Bobcat Tiger', url: 'https://www.scouting.org/cub-scout-adventures/bobcat-tiger/', icon: 'tiger_Tiger-Bobcat.webp' },
      { name: 'Tiger Bites', url: 'https://www.scouting.org/cub-scout-adventures/tiger-bites/', icon: 'tiger_Tiger_Bites.webp' },
      { name: 'Tiger’s Roar', url: 'https://www.scouting.org/cub-scout-adventures/tigers-roar/', icon: 'tiger_Tigers-Roar.webp' },
      { name: 'Tiger Circles', url: 'https://www.scouting.org/cub-scout-adventures/tiger-circles/', icon: 'tiger_Tiger_Circles.webp' },
      { name: 'Team Tiger', url: 'https://www.scouting.org/cub-scout-adventures/team-tiger/', icon: 'tiger_Team_Tiger.webp' },
      {
        name: 'Tigers in the Wild',
        url: 'https://www.scouting.org/cub-scout-adventures/tigers-in-the-wild/',
        icon: 'tiger_Tigers_in_the_Wild.webp',
      },
    ],
    electives: [
      {
        name: 'Champions for Nature Tiger',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-tiger/',
        icon: 'tiger_Champions_of_Nature.webp',
      },
      {
        name: 'Curiosity, Intrigue, and Magical Mysteries',
        url: 'https://www.scouting.org/cub-scout-adventures/curiosity-intrigue-and-magical-mysteries/',
        icon: 'tiger_Curiosity_Intrigue_and_Magical_Mysteries.webp',
      },
      {
        name: 'Designed by Tiger',
        url: 'https://www.scouting.org/cub-scout-adventures/designed-by-tiger/',
        icon: 'tiger_Designed_by_Tiger.webp',
      },
      { name: 'Fish On', url: 'https://www.scouting.org/cub-scout-adventures/fish-on/', icon: 'tiger_Fish_On.webp' },
      {
        name: 'Floats and Boats',
        url: 'https://www.scouting.org/cub-scout-adventures/floats-and-boats/',
        icon: 'tiger_Floats_and_Boats.webp',
      },
      { name: 'Good Knights', url: 'https://www.scouting.org/cub-scout-adventures/good-knights/', icon: 'tiger_Good_Knights.webp' },
      { name: 'Let’s Camp Tiger', url: 'https://www.scouting.org/cub-scout-adventures/lets-camp-tiger/', icon: 'tiger_Lets_Camp.webp' },
      { name: 'Race Time Tiger', url: 'https://www.scouting.org/cub-scout-adventures/race-time-tiger/', icon: 'tiger_Race_Time.webp' },
      { name: 'Rolling Tigers', url: 'https://www.scouting.org/cub-scout-adventures/rolling-tigers/', icon: 'tiger_Rolling_Tigers.webp' },
      {
        name: 'Safe and Smart',
        url: 'https://www.scouting.org/cub-scout-adventures/safe-and-smart/',
        icon: 'tiger_Tiger_Safe_and_Smart.webp',
      },
      {
        name: 'Sky is the Limit',
        url: 'https://www.scouting.org/cub-scout-adventures/sky-is-the-limit/',
        icon: 'tiger_Sky_is_the_Limit.webp',
      },
      {
        name: 'Stories in Shapes',
        url: 'https://www.scouting.org/cub-scout-adventures/stories-in-shapes/',
        icon: 'tiger_Stories_in_Shapes.webp',
      },
      {
        name: 'Summertime Fun Tiger',
        url: 'https://www.scouting.org/cub-scout-adventures/summertime-fun-tiger/',
        icon: 'tiger_Summertime_Fun.webp',
      },
      {
        name: 'Tech All Around',
        url: 'https://www.scouting.org/cub-scout-adventures/tech-all-around/',
        icon: 'tiger_Tech_All_Around.webp',
      },
      { name: 'Tiger Tag', url: 'https://www.scouting.org/cub-scout-adventures/tiger-tag/', icon: 'tiger_Tigers_Tag.webp' },
      { name: 'Tiger-iffic!', url: 'https://www.scouting.org/cub-scout-adventures/tiger-iffic/', icon: 'tiger_Tiger_rrrrific.webp' },
      {
        name: 'Tigers in the Water',
        url: 'https://www.scouting.org/cub-scout-adventures/tigers-in-the-water/',
        icon: 'tiger_Tigers_in_the_Water.webp',
      },
    ],
    specialElectives: [
      { name: 'Archery Tiger', url: null, icon: 'tiger_Archery.webp' },
      { name: 'Slingshot', url: null, icon: 'tiger_Slingshot.webp' },
      { name: 'BB Guns', url: null, icon: 'tiger_BB_Guns.webp' },
    ],
    focus: 'First graders build confidence with a bit more independence from their adult partner while still learning as a den.',
    source: 'https://www.scouting.org/programs/cub-scouts/adventures/tiger/',
  },
  {
    rank: 'Wolf',
    verified: true,
    required: [
      { name: 'Bobcat Wolf', url: 'https://www.scouting.org/cub-scout-adventures/bobcat-wolf/', icon: 'wolf_Wolf_Bobcat.webp' },
      {
        name: 'Running With the Pack',
        url: 'https://www.scouting.org/cub-scout-adventures/running-with-the-pack/',
        icon: 'wolf_Running_With_the_Pack.webp',
      },
      {
        name: 'Safety in Numbers',
        url: 'https://www.scouting.org/cub-scout-adventures/safety-in-numbers/',
        icon: 'wolf_Safety_in_Numbers.webp',
      },
      { name: 'Footsteps', url: 'https://www.scouting.org/cub-scout-adventures/footsteps/', icon: 'wolf_Footsteps.webp' },
      { name: 'Council Fire', url: 'https://www.scouting.org/cub-scout-adventures/council-fire/', icon: 'wolf_Council_Fire.webp' },
      {
        name: 'Paws on the Path',
        url: 'https://www.scouting.org/cub-scout-adventures/paws-on-the-path/',
        icon: 'wolf_Paws_on_the_Path.webp',
      },
    ],
    electives: [
      {
        name: 'A Wolf Goes Fishing',
        url: 'https://www.scouting.org/cub-scout-adventures/a-wolf-goes-fishing/',
        icon: 'wolf_A_Wolf_Goes_Fishing.webp',
      },
      {
        name: 'Adventures in Coins',
        url: 'https://www.scouting.org/cub-scout-adventures/adventures-in-coins/',
        icon: 'wolf_Adventures_in_Coins.webp',
      },
      { name: 'Air of the Wolf', url: 'https://www.scouting.org/cub-scout-adventures/air-of-the-wolf/', icon: 'wolf_Air_of_the_Wolf.webp' },
      {
        name: 'Champions for Nature Wolf',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-wolf/',
        icon: 'wolf_Champions_of_Nature.webp',
      },
      {
        name: 'Code of the Wolf',
        url: 'https://www.scouting.org/cub-scout-adventures/code-of-the-wolf/',
        icon: 'wolf_Code_of_the_Wolf.webp',
      },
      {
        name: 'Computing Wolves',
        url: 'https://www.scouting.org/cub-scout-adventures/computing-wolves/',
        icon: 'wolf_Computing_Wolves.webp',
      },
      { name: 'Cubs Who Care', url: 'https://www.scouting.org/cub-scout-adventures/cubs-who-care/', icon: 'wolf_Cubs_Who_Care.webp' },
      {
        name: 'Digging in the Past',
        url: 'https://www.scouting.org/cub-scout-adventures/digging-in-the-past/',
        icon: 'wolf_Digging_Into_the_Past.webp',
      },
      {
        name: 'Finding Your Way',
        url: 'https://www.scouting.org/cub-scout-adventures/finding-your-way/',
        icon: 'wolf_Finding_Your_Way.webp',
      },
      { name: 'Germs Alive!', url: 'https://www.scouting.org/cub-scout-adventures/germs-alive/', icon: 'wolf_Germs_Alive.webp' },
      { name: 'Let’s Camp Wolf', url: 'https://www.scouting.org/cub-scout-adventures/lets-camp-wolf/', icon: 'wolf_Lets_Camp.webp' },
      { name: 'Paws for Water', url: 'https://www.scouting.org/cub-scout-adventures/paws-for-water/', icon: 'wolf_Paws_For_Water.webp' },
      { name: 'Paws of Skill', url: 'https://www.scouting.org/cub-scout-adventures/paws-of-skill/', icon: 'wolf_Paws_of_Skill.webp' },
      {
        name: 'Pedal With the Pack',
        url: 'https://www.scouting.org/cub-scout-adventures/pedal-with-the-pack/',
        icon: 'wolf_Pedal_With_the_Pack.webp',
      },
      { name: 'Race Time Wolf', url: 'https://www.scouting.org/cub-scout-adventures/race-time-wolf/', icon: 'wolf_Race_Time.webp' },
      {
        name: 'Spirit of the Water',
        url: 'https://www.scouting.org/cub-scout-adventures/spirit-of-the-water/',
        icon: 'wolf_Spirit_of_the_Water.webp',
      },
      {
        name: 'Summertime Fun Wolf',
        url: 'https://www.scouting.org/cub-scout-adventures/summertime-fun-wolf/',
        icon: 'wolf_Summertime_Fun.webp',
      },
    ],
    specialElectives: [
      { name: 'Archery Wolf', url: null, icon: 'wolf_Archery.webp' },
      { name: 'Slingshot', url: null, icon: 'wolf_Slingshot.webp' },
      { name: 'BB Guns', url: null, icon: 'wolf_BB_Guns.webp' },
    ],
    focus: 'Second graders take on more outdoor skill-building and start practicing everyday citizenship and safety habits.',
    source: 'https://www.scouting.org/programs/cub-scouts/adventures/wolf/',
  },
  {
    rank: 'Bear',
    verified: true,
    required: [
      { name: 'Bobcat Bear', url: 'https://www.scouting.org/cub-scout-adventures/bobcat-bear/', icon: 'bear_Bear_Bobcat.webp' },
      { name: 'Bear Strong', url: 'https://www.scouting.org/cub-scout-adventures/bear-strong/', icon: 'bear_Bear_Strong.webp' },
      { name: 'Standing Tall', url: 'https://www.scouting.org/cub-scout-adventures/standing-tall/', icon: 'bear_Standing_Tall.webp' },
      { name: 'Bear Habitat', url: 'https://www.scouting.org/cub-scout-adventures/bear-habitat/', icon: 'bear_Bear_Habitat.webp' },
      { name: 'Paws for Action', url: 'https://www.scouting.org/cub-scout-adventures/paws-for-action/', icon: 'bear_Paws_For_Action.webp' },
      { name: 'Fellowship', url: 'https://www.scouting.org/cub-scout-adventures/fellowship/', icon: 'bear_Fellowship.webp' },
    ],
    electives: [
      {
        name: 'A Bear Goes Fishing',
        url: 'https://www.scouting.org/cub-scout-adventures/a-bear-goes-fishing/',
        icon: 'bear_A_Bear_Goes_Fishing.webp',
      },
      { name: 'Balancing Bears', url: 'https://www.scouting.org/cub-scout-adventures/balancing-bears/', icon: 'bear_Balancing_Bears.webp' },
      {
        name: 'Baloo the Builder',
        url: 'https://www.scouting.org/cub-scout-adventures/baloo-the-builder/',
        icon: 'bear_Baloo_the_Builder.webp',
      },
      { name: 'Bears Afloat', url: 'https://www.scouting.org/cub-scout-adventures/bears-afloat/', icon: 'bear_Bears_Afloat.webp' },
      { name: 'Bears on Bikes', url: 'https://www.scouting.org/cub-scout-adventures/bears-on-bikes/', icon: 'bear_Bears_on_Bikes.webp' },
      {
        name: 'Champions for Nature Bear',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-bear/',
        icon: 'bear_Champions_of_Nature.webp',
      },
      { name: 'Chef Tech', url: 'https://www.scouting.org/cub-scout-adventures/chef-tech/', icon: 'bear_Chef_Tech.webp' },
      { name: 'Critter Care', url: 'https://www.scouting.org/cub-scout-adventures/critter-care/', icon: 'bear_Critter_Care.webp' },
      { name: 'Forensics', url: 'https://www.scouting.org/cub-scout-adventures/forensics/', icon: 'bear_Forensics.webp' },
      { name: 'Let’s Camp Bear', url: 'https://www.scouting.org/cub-scout-adventures/lets-camp-bear/', icon: 'bear_Lets_Camp.webp' },
      { name: 'Marble Madness', url: 'https://www.scouting.org/cub-scout-adventures/marble-madness/', icon: 'bear_Marble_Madness.webp' },
      { name: 'Race Time Bear', url: 'https://www.scouting.org/cub-scout-adventures/race-time-bear/', icon: 'bear_Race_Time.webp' },
      {
        name: 'Roaring Laughter',
        url: 'https://www.scouting.org/cub-scout-adventures/roaring-laughter/',
        icon: 'bear_Roaring_Laughter.webp',
      },
      { name: 'Salmon Run', url: 'https://www.scouting.org/cub-scout-adventures/salmon-run/', icon: 'bear_Salmon_Run.webp' },
      {
        name: 'Summertime Fun Bear',
        url: 'https://www.scouting.org/cub-scout-adventures/summertime-fun-bear/',
        icon: 'bear_Summertime_Fun.webp',
      },
      { name: 'Super Science', url: 'https://www.scouting.org/cub-scout-adventures/super-science/', icon: 'bear_Super_Science.webp' },
      { name: 'Whittling', url: 'https://www.scouting.org/cub-scout-adventures/whittling/', icon: 'bear_Whittling.webp' },
    ],
    specialElectives: [
      { name: 'Archery Bear', url: null, icon: 'bear_Archery.webp' },
      { name: 'Slingshot', url: null, icon: 'bear_Slingshot.webp' },
      { name: 'BB Guns', url: null, icon: 'bear_BB_Guns.webp' },
    ],
    focus: 'Third graders take on bigger outdoor and community challenges, including their first knife-safety adventure, Whittling.',
    source: 'https://www.scouting.org/programs/cub-scouts/adventures/bear/',
  },
  {
    rank: 'Webelos',
    verified: true,
    required: [
      {
        name: 'Bobcat Webelos',
        url: 'https://www.scouting.org/cub-scout-adventures/bobcat-webelos/',
        icon: 'webelos_Webelos_Bobcat_edit.webp',
      },
      {
        name: 'Stronger, Faster, Higher',
        url: 'https://www.scouting.org/cub-scout-adventures/stronger-faster-higher/',
        icon: 'webelos_Stronger_Faster_Higher.webp',
      },
      { name: 'My Safety', url: 'https://www.scouting.org/cub-scout-adventures/my-safety/', icon: 'webelos_My_Safety.webp' },
      { name: 'My Family', url: 'https://www.scouting.org/cub-scout-adventures/my-family/', icon: 'webelos_My_Family.webp' },
      { name: 'My Community', url: 'https://www.scouting.org/cub-scout-adventures/my-community/', icon: 'webelos_My_Community.webp' },
      {
        name: 'Webelos Walkabout',
        url: 'https://www.scouting.org/cub-scout-adventures/webelos-walkabout/',
        icon: 'webelos_Webelos_Walkabout.webp',
      },
    ],
    electives: [
      { name: 'Aquanaut', url: 'https://www.scouting.org/cub-scout-adventures/aquanaut/', icon: 'webelos_Aquanaut.webp' },
      { name: 'Art Explosion', url: 'https://www.scouting.org/cub-scout-adventures/art-explosion/', icon: 'webelos_Art_Explosion.webp' },
      { name: 'Aware and Care', url: 'https://www.scouting.org/cub-scout-adventures/aware-and-care/', icon: 'webelos_Aware_and_Care.webp' },
      { name: 'Build It', url: 'https://www.scouting.org/cub-scout-adventures/build-it/', icon: 'webelos_Build_It.webp' },
      {
        name: 'Catch the Big One',
        url: 'https://www.scouting.org/cub-scout-adventures/catch-the-big-one/',
        icon: 'webelos_Catch_the_Big_One.webp',
      },
      {
        name: 'Champions for Nature Webelos',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-webelos/',
        icon: 'webelos_Champions_of_Nature.webp',
      },
      { name: 'Chef’s Knife', url: 'https://www.scouting.org/cub-scout-adventures/chefs-knife/', icon: 'webelos_ChefsKnife.webp' },
      { name: 'Earth Rocks', url: 'https://www.scouting.org/cub-scout-adventures/earth-rocks/', icon: 'webelos_Earth_Rocks.webp' },
      {
        name: 'Let’s Camp Webelos',
        url: 'https://www.scouting.org/cub-scout-adventures/lets-camp-webelos/',
        icon: 'webelos_Lets_Camp.webp',
      },
      {
        name: 'Math on the Trail',
        url: 'https://www.scouting.org/cub-scout-adventures/math-on-the-trail/',
        icon: 'webelos_Math_on_the_Trail.webp',
      },
      { name: 'Modular Design', url: 'https://www.scouting.org/cub-scout-adventures/modular-design/', icon: 'webelos_Modular_Design.webp' },
      { name: 'Paddle Onward', url: 'https://www.scouting.org/cub-scout-adventures/paddle-onward/', icon: 'webelos_Paddle_Onward.webp' },
      { name: 'Pedal Away', url: 'https://www.scouting.org/cub-scout-adventures/pedal-away/', icon: 'webelos_Pedal_Away.webp' },
      {
        name: 'Race Time Webelos',
        url: 'https://www.scouting.org/cub-scout-adventures/race-time-webelos/',
        icon: 'webelos_Race_Time.webp',
      },
      {
        name: 'Summertime Fun Webelos',
        url: 'https://www.scouting.org/cub-scout-adventures/summertime-fun-webelos/',
        icon: 'webelos_Summertime_Fun.webp',
      },
      {
        name: 'Tech on the Trail',
        url: 'https://www.scouting.org/cub-scout-adventures/tech-on-the-trail/',
        icon: 'webelos_Tech_on_the_Trail.webp',
      },
      { name: 'Yo-yo', url: 'https://www.scouting.org/cub-scout-adventures/yo-yo/', icon: 'webelos_Yo_Yo.webp' },
    ],
    specialElectives: [
      { name: 'Archery Webelos', url: null, icon: 'webelos_Archery.webp' },
      { name: 'Slingshot', url: null, icon: 'webelos_Slingshot.webp' },
      { name: 'BB Guns', url: null, icon: 'webelos_BB_Guns.webp' },
    ],
    focus:
      'Fourth graders spend a full year in their own single-grade program, sampling outdoor, STEM, and craft electives before Arrow of Light.',
    source: 'https://www.scouting.org/programs/cub-scouts/adventures/webelos/',
  },
  {
    rank: 'Arrow of Light',
    verified: true,
    required: [
      {
        name: 'Bobcat Arrow of Light',
        url: 'https://www.scouting.org/cub-scout-adventures/bobcat-arrow-of-light/',
        icon: 'arrow-of-light_AOL_Bobcat.webp',
      },
      {
        name: 'Personal Fitness',
        url: 'https://www.scouting.org/cub-scout-adventures/personal-fitness/',
        icon: 'arrow-of-light_Personal_Fitness.webp',
      },
      { name: 'First Aid', url: 'https://www.scouting.org/cub-scout-adventures/first-aid/', icon: 'arrow-of-light_First_Aid.webp' },
      {
        name: 'Duty to God',
        url: 'https://www.scouting.org/cub-scout-adventures/duty-to-god/',
        icon: 'arrow-of-light_AOL_Duty_to_God.webp',
      },
      { name: 'Citizenship', url: 'https://www.scouting.org/cub-scout-adventures/citizenship/', icon: 'arrow-of-light_Citizenship.webp' },
      {
        name: 'Outdoor Adventurer',
        url: 'https://www.scouting.org/cub-scout-adventures/outdoor-adventurer/',
        icon: 'arrow-of-light_AOL_Outdoor_Adventurer.webp',
      },
    ],
    electives: [
      {
        name: 'Champions for Nature AOL',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-aol/',
        icon: 'arrow-of-light_Champions_of_Nature.webp',
      },
      { name: 'Cycling', url: 'https://www.scouting.org/cub-scout-adventures/cycling/', icon: 'arrow-of-light_Cycling.webp' },
      { name: 'Engineer', url: 'https://www.scouting.org/cub-scout-adventures/engineer/', icon: 'arrow-of-light_Engineering.webp' },
      { name: 'Estimations', url: 'https://www.scouting.org/cub-scout-adventures/estimations/', icon: 'arrow-of-light_Estimations.webp' },
      { name: 'Fishing', url: 'https://www.scouting.org/cub-scout-adventures/fishing/', icon: 'arrow-of-light_Fishing.webp' },
      {
        name: 'High Tech Outdoors',
        url: 'https://www.scouting.org/cub-scout-adventures/high-tech-outdoors/',
        icon: 'arrow-of-light_High_Tech_Outdoors.webp',
      },
      {
        name: 'Into the Wild',
        url: 'https://www.scouting.org/cub-scout-adventures/into-the-wild/',
        icon: 'arrow-of-light_Into_the_Wild.webp',
      },
      {
        name: 'Into the Woods',
        url: 'https://www.scouting.org/cub-scout-adventures/into-the-woods/',
        icon: 'arrow-of-light_Into_the_Woods.webp',
      },
      {
        name: 'Knife Safety',
        url: 'https://www.scouting.org/cub-scout-adventures/knife-safety/',
        icon: 'arrow-of-light_Knife_Safety.webp',
      },
      {
        name: 'Paddle Craft',
        url: 'https://www.scouting.org/cub-scout-adventures/paddle-craft/',
        icon: 'arrow-of-light_Paddle_Craft.webp',
      },
      { name: 'Race Time AOL', url: 'https://www.scouting.org/cub-scout-adventures/race-time-aol/', icon: 'arrow-of-light_Race_Time.webp' },
      {
        name: 'Summertime Fun AOL',
        url: 'https://www.scouting.org/cub-scout-adventures/summertime-fun-aol/',
        icon: 'arrow-of-light_Summertime_Fun.webp',
      },
      { name: 'Swimming', url: 'https://www.scouting.org/cub-scout-adventures/swimming/', icon: 'arrow-of-light_Swimming.webp' },
    ],
    specialElectives: [
      { name: 'Archery Arrow of Light', url: null, icon: 'arrow-of-light_Archery.webp' },
      { name: 'Slingshot', url: null, icon: 'arrow-of-light_Slingshot.webp' },
      { name: 'BB Guns', url: null, icon: 'arrow-of-light_BB_Guns.webp' },
    ],
    focus:
      'Fifth graders run their own standalone program built around patrol-method outdoor skills that prepare them to cross over into a Scouts BSA troop.',
    source: 'https://www.scouting.org/programs/cub-scouts/adventures/arrow-of-light/',
  },
];
