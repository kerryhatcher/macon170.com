// Official Cub Scout Adventures per rank, current program (effective June 1, 2024).
// Names, links, and icon filenames are transcribed from the rank pages under
// https://www.scouting.org/programs/cub-scouts/adventures/ — see the ## Adventures section of
// docs/Offical-info.md, verified 2026-07-27. Adventure NAMES are facts and may be listed; the
// requirement TEXT is Scouting America publication content and must not be reproduced here.
// The `summary` on each adventure is written HERE, in our own words, from the adventure's page —
// it says what a Scout does, and it is never a quote of the page's text or its requirements.
// Icons live in assets/offical/ and are resolved by src/lib/official-image.ts.

export type Adventure = {
  name: string;
  url: string | null; // scouting.org page, null for the special electives, which have none
  icon: string; // filename in assets/offical/
  summary: string; // one plain sentence, YOUR OWN WORDS, on what the Scout actually does
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
      {
        name: 'Bobcat Lion',
        url: 'https://www.scouting.org/cub-scout-adventures/bobcat-lion/',
        icon: 'lion_Lion_Bobcat.webp',
        summary: 'The adventure every Lion starts with: the Scout Oath and Law, the sign, the salute, and the handshake.',
      },
      {
        name: 'Fun on the Run',
        url: 'https://www.scouting.org/cub-scout-adventures/fun-on-the-run/',
        icon: 'lion_Fun_On_The_Run.webp',
        summary: 'Lions try out the food groups, get moving with active games, and find out why rest matters too.',
      },
      {
        name: 'Lion’s Roar',
        url: 'https://www.scouting.org/cub-scout-adventures/lions-roar/',
        icon: 'lion_Lions_Roar.webp',
        summary: 'Lions learn the Protect Yourself Rules and the other habits that keep them safe.',
      },
      {
        name: 'Lion’s Pride',
        url: 'https://www.scouting.org/cub-scout-adventures/lions-pride/',
        icon: 'lion_Lions_Pride.webp',
        summary: 'Lions talk about their own family’s faith and traditions, mostly at home with their adult partner.',
      },
      {
        name: 'King of the Jungle',
        url: 'https://www.scouting.org/cub-scout-adventures/king-of-the-jungle/',
        icon: 'lion_King_of_The_Jungle.webp',
        summary: 'Citizenship starts at home, so Lions look for ways to help out where they live and nearby.',
      },
      {
        name: 'Mountain Lion',
        url: 'https://www.scouting.org/cub-scout-adventures/mountain-lion/',
        icon: 'lion_Mountain_Lion.webp',
        summary: 'A first walk outdoors with the Cub Scout Six Essentials, sorting what is natural from what people built.',
      },
    ],
    electives: [
      {
        name: 'Build It Up, Knock It Down',
        url: 'https://www.scouting.org/cub-scout-adventures/build-it-up-knock-it-down/',
        icon: 'lion_Build_It_Up_Knock_It_Down.webp',
        summary: 'Lions build a structure on their own, then build one as a team, and knock them both down.',
      },
      {
        name: 'Champions for Nature Lion',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-lion/',
        icon: 'lion_Champions_of_Nature.webp',
        summary: 'A conservation adventure Scouts do worldwide, wrapped up with a service project.',
      },
      {
        name: 'Count On Me',
        url: 'https://www.scouting.org/cub-scout-adventures/count-on-me/',
        icon: 'lion_Count_On_Me.webp',
        summary: 'Lions and their adult partners hunt for geometric shapes and learn to name them.',
      },
      {
        name: 'Everyday Tech',
        url: 'https://www.scouting.org/cub-scout-adventures/everyday-tech/',
        icon: 'lion_Everyday_Tech.webp',
        summary: 'A look at the technology around the house, what it makes easier, and how to use it safely.',
      },
      {
        name: 'Gizmos and Gadgets',
        url: 'https://www.scouting.org/cub-scout-adventures/gizmos-and-gadgets/',
        icon: 'lion_Gizmos_and_Gadgets.webp',
        summary: 'Lions build something useful with their adult partner and play with motion and force.',
      },
      {
        name: 'Go Fish',
        url: 'https://www.scouting.org/cub-scout-adventures/go-fish/',
        icon: 'lion_Go_Fish.webp',
        summary: 'A first fishing trip for a Lion and an adult partner to take together.',
      },
      {
        name: 'I’ll Do It Myself',
        url: 'https://www.scouting.org/cub-scout-adventures/ill-do-it-myself/',
        icon: 'lion_Ill_Do_It_Myself.webp',
        summary: 'Hygiene and self-reliance: the small everyday habits a Lion can take on alone.',
      },
      {
        name: 'Let’s Camp Lion',
        url: 'https://www.scouting.org/cub-scout-adventures/lets-camp-lion/',
        icon: 'lion_Lets_Camp.webp',
        summary: 'An overnight campout for Lions and their adult partners.',
      },
      {
        name: 'On a Roll',
        url: 'https://www.scouting.org/cub-scout-adventures/on-a-roll/',
        icon: 'lion_On_a_Roll.webp',
        summary: 'Bike safety and a ride with the den or family; trikes, training wheels, and adaptive bikes all count.',
      },
      {
        name: 'On Your Mark',
        url: 'https://www.scouting.org/cub-scout-adventures/on-your-mark/',
        icon: 'lion_On_Your_Mark.webp',
        summary: 'Active games with the den and the family, including a box derby race.',
      },
      {
        name: 'Pick My Path',
        url: 'https://www.scouting.org/cub-scout-adventures/pick-my-path-lion/',
        icon: 'lion_Pick_My_Path.webp',
        summary: 'A game that shows Lions how the choices they make lead to consequences.',
      },
      {
        name: 'Race Time Lion',
        url: 'https://www.scouting.org/cub-scout-adventures/race-time-lion/',
        icon: 'lion_Race_Time.webp',
        summary: 'Build and race a Pinewood Derby® car or a Raingutter Regatta™ boat with an adult partner.',
      },
      {
        name: 'Ready, Set, Grow',
        url: 'https://www.scouting.org/cub-scout-adventures/ready-set-grow/',
        icon: 'lion_Ready_Set_Grow.webp',
        summary: 'Lions plant and tend a garden, for fun and for food, and see how growing things works.',
      },
      {
        name: 'Time to Swim',
        url: 'https://www.scouting.org/cub-scout-adventures/time-to-swim/',
        icon: 'lion_Time_to_Swim.webp',
        summary: 'Water safety and getting comfortable in the water under qualified supervision; swim lessons can count instead.',
      },
    ],
    specialElectives: [
      {
        name: 'Archery Lion',
        url: null,
        icon: 'lion_Archery.webp',
        summary: 'Target archery, earned only at an approved event with a certified instructor and a proper range.',
      },
      {
        name: 'Slingshot',
        url: null,
        icon: 'lion_Slingshot.webp',
        summary: 'Slingshot target shooting, earned only at an approved event with a certified instructor and range.',
      },
    ],
    focus:
      'A kindergartner and an adult partner explore Scouting together for the first time, earning loops for simple, guided activities.',
    source: 'https://www.scouting.org/programs/cub-scouts/adventures/lion/',
  },
  {
    rank: 'Tiger',
    verified: true,
    required: [
      {
        name: 'Bobcat Tiger',
        url: 'https://www.scouting.org/cub-scout-adventures/bobcat-tiger/',
        icon: 'tiger_Tiger-Bobcat.webp',
        summary: 'The adventure every Tiger starts with: the Scout Oath and Law, the sign, the salute, and the handshake.',
      },
      {
        name: 'Tiger Bites',
        url: 'https://www.scouting.org/cub-scout-adventures/tiger-bites/',
        icon: 'tiger_Tiger_Bites.webp',
        summary: 'Tigers explore the food groups, get moving, and find out why rest is part of staying healthy.',
      },
      {
        name: 'Tiger’s Roar',
        url: 'https://www.scouting.org/cub-scout-adventures/tigers-roar/',
        icon: 'tiger_Tigers-Roar.webp',
        summary: 'Tigers learn the Protect Yourself Rules and other skills for keeping themselves safe.',
      },
      {
        name: 'Tiger Circles',
        url: 'https://www.scouting.org/cub-scout-adventures/tiger-circles/',
        icon: 'tiger_Tiger_Circles.webp',
        summary: 'Tigers look at their own family’s faith and traditions, with most of it done at home.',
      },
      {
        name: 'Team Tiger',
        url: 'https://www.scouting.org/cub-scout-adventures/team-tiger/',
        icon: 'tiger_Team_Tiger.webp',
        summary: 'Tigers find ways to pitch in at home and in the den, and take a turn helping their community.',
      },
      {
        name: 'Tigers in the Wild',
        url: 'https://www.scouting.org/cub-scout-adventures/tigers-in-the-wild/',
        icon: 'tiger_Tigers_in_the_Wild.webp',
        summary: 'A walk outdoors with the den, learning to tell domesticated animals from wild ones.',
      },
    ],
    electives: [
      {
        name: 'Champions for Nature Tiger',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-tiger/',
        icon: 'tiger_Champions_of_Nature.webp',
        summary: 'A conservation adventure Scouts do worldwide, wrapped up with a service project.',
      },
      {
        name: 'Curiosity, Intrigue, and Magical Mysteries',
        url: 'https://www.scouting.org/cub-scout-adventures/curiosity-intrigue-and-magical-mysteries/',
        icon: 'tiger_Curiosity_Intrigue_and_Magical_Mysteries.webp',
        summary: 'Tigers learn to perform a magic trick and invent a secret code of their own.',
      },
      {
        name: 'Designed by Tiger',
        url: 'https://www.scouting.org/cub-scout-adventures/designed-by-tiger/',
        icon: 'tiger_Designed_by_Tiger.webp',
        summary: 'A first taste of engineering: design something, build it, then figure out how to improve it.',
      },
      {
        name: 'Fish On',
        url: 'https://www.scouting.org/cub-scout-adventures/fish-on/',
        icon: 'tiger_Fish_On.webp',
        summary: 'Tigers pick up the basics of fishing and then go fishing with the den or family.',
      },
      {
        name: 'Floats and Boats',
        url: 'https://www.scouting.org/cub-scout-adventures/floats-and-boats/',
        icon: 'tiger_Floats_and_Boats.webp',
        summary: 'Tigers test what floats and what sinks, then build a model boat of their own.',
      },
      {
        name: 'Good Knights',
        url: 'https://www.scouting.org/cub-scout-adventures/good-knights/',
        icon: 'tiger_Good_Knights.webp',
        summary: 'Tigers make their own shield or coat of arms, and a castle to go with it.',
      },
      {
        name: 'Let’s Camp Tiger',
        url: 'https://www.scouting.org/cub-scout-adventures/lets-camp-tiger/',
        icon: 'tiger_Lets_Camp.webp',
        summary: 'An overnight campout for Tigers and their adult partners.',
      },
      {
        name: 'Race Time Tiger',
        url: 'https://www.scouting.org/cub-scout-adventures/race-time-tiger/',
        icon: 'tiger_Race_Time.webp',
        summary: 'Build and race a Pinewood Derby® car or a Raingutter Regatta™ boat with an adult partner.',
      },
      {
        name: 'Rolling Tigers',
        url: 'https://www.scouting.org/cub-scout-adventures/rolling-tigers/',
        icon: 'tiger_Rolling_Tigers.webp',
        summary: 'Bike safety and a ride with the den or family; trikes, training wheels, and adaptive bikes all count.',
      },
      {
        name: 'Safe and Smart',
        url: 'https://www.scouting.org/cub-scout-adventures/safe-and-smart/',
        icon: 'tiger_Tiger_Safe_and_Smart.webp',
        summary: 'Fire safety, plus how to get ready for an emergency and what to do in one.',
      },
      {
        name: 'Sky is the Limit',
        url: 'https://www.scouting.org/cub-scout-adventures/sky-is-the-limit/',
        icon: 'tiger_Sky_is_the_Limit.webp',
        summary: 'Tigers go out under the night sky and learn to pick out constellations.',
      },
      {
        name: 'Stories in Shapes',
        url: 'https://www.scouting.org/cub-scout-adventures/stories-in-shapes/',
        icon: 'tiger_Stories_in_Shapes.webp',
        summary: 'Tigers find the math hiding in art, using shapes and symbols to tell a story.',
      },
      {
        name: 'Summertime Fun Tiger',
        url: 'https://www.scouting.org/cub-scout-adventures/summertime-fun-tiger/',
        icon: 'tiger_Summertime_Fun.webp',
        summary: 'Stay in Scouting over the summer with den or pack events, day camp, or resident camp.',
      },
      {
        name: 'Tech All Around',
        url: 'https://www.scouting.org/cub-scout-adventures/tech-all-around/',
        icon: 'tiger_Tech_All_Around.webp',
        summary: 'Tigers spot the technology in their own home, see how it has improved, and learn the rules for using it.',
      },
      {
        name: 'Tiger Tag',
        url: 'https://www.scouting.org/cub-scout-adventures/tiger-tag/',
        icon: 'tiger_Tigers_Tag.webp',
        summary: 'Outdoor games and sports with the den or family, plus a game to watch together.',
      },
      {
        name: 'Tiger-iffic!',
        url: 'https://www.scouting.org/cub-scout-adventures/tiger-iffic/',
        icon: 'tiger_Tiger_rrrrific.webp',
        summary: 'Taking turns and playing by the rules, learned the fun way through games.',
      },
      {
        name: 'Tigers in the Water',
        url: 'https://www.scouting.org/cub-scout-adventures/tigers-in-the-water/',
        icon: 'tiger_Tigers_in_the_Water.webp',
        summary: 'Water safety and getting comfortable in the water, under qualified supervision.',
      },
    ],
    specialElectives: [
      {
        name: 'Archery Tiger',
        url: null,
        icon: 'tiger_Archery.webp',
        summary: 'Target archery, earned only at an approved event with a certified instructor and a proper range.',
      },
      {
        name: 'Slingshot',
        url: null,
        icon: 'tiger_Slingshot.webp',
        summary: 'Slingshot target shooting, earned only at an approved event with a certified instructor and range.',
      },
      {
        name: 'BB Guns',
        url: null,
        icon: 'tiger_BB_Guns.webp',
        summary: 'BB gun target shooting, earned only at an approved event with a certified instructor and range.',
      },
    ],
    focus: 'First graders build confidence with a bit more independence from their adult partner while still learning as a den.',
    source: 'https://www.scouting.org/programs/cub-scouts/adventures/tiger/',
  },
  {
    rank: 'Wolf',
    verified: true,
    required: [
      {
        name: 'Bobcat Wolf',
        url: 'https://www.scouting.org/cub-scout-adventures/bobcat-wolf/',
        icon: 'wolf_Wolf_Bobcat.webp',
        summary: 'The adventure every Wolf starts with: the Scout Oath and Law, the sign, the salute, and the handshake.',
      },
      {
        name: 'Running With the Pack',
        url: 'https://www.scouting.org/cub-scout-adventures/running-with-the-pack/',
        icon: 'wolf_Running_With_the_Pack.webp',
        summary: 'Eating well, exercising, and getting enough rest, and why a Scout keeps all three going.',
      },
      {
        name: 'Safety in Numbers',
        url: 'https://www.scouting.org/cub-scout-adventures/safety-in-numbers/',
        icon: 'wolf_Safety_in_Numbers.webp',
        summary: 'A personal-safety adventure a Wolf works through mostly with a parent or guardian.',
      },
      {
        name: 'Footsteps',
        url: 'https://www.scouting.org/cub-scout-adventures/footsteps/',
        icon: 'wolf_Footsteps.webp',
        summary: 'Wolves learn more about their family’s faith traditions at home, and why being trustworthy matters.',
      },
      {
        name: 'Council Fire',
        url: 'https://www.scouting.org/cub-scout-adventures/council-fire/',
        icon: 'wolf_Council_Fire.webp',
        summary: 'Wolves build a model community, then find a way to take an active part in their real one.',
      },
      {
        name: 'Paws on the Path',
        url: 'https://www.scouting.org/cub-scout-adventures/paws-on-the-path/',
        icon: 'wolf_Paws_on_the_Path.webp',
        summary: 'A walk outdoors with the Wolf den, and the gear worth bringing along on it.',
      },
    ],
    electives: [
      {
        name: 'A Wolf Goes Fishing',
        url: 'https://www.scouting.org/cub-scout-adventures/a-wolf-goes-fishing/',
        icon: 'wolf_A_Wolf_Goes_Fishing.webp',
        summary: 'The basics of fishing where you live, then a trip with the den, pack, or family.',
      },
      {
        name: 'Adventures in Coins',
        url: 'https://www.scouting.org/cub-scout-adventures/adventures-in-coins/',
        icon: 'wolf_Adventures_in_Coins.webp',
        summary: 'Wolves try coin collecting, learning where coins are made and what their pictures mean.',
      },
      {
        name: 'Air of the Wolf',
        url: 'https://www.scouting.org/cub-scout-adventures/air-of-the-wolf/',
        icon: 'wolf_Air_of_the_Wolf.webp',
        summary: 'Paper airplanes and other flying things, and what makes one fly farther than another.',
      },
      {
        name: 'Champions for Nature Wolf',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-wolf/',
        icon: 'wolf_Champions_of_Nature.webp',
        summary: 'Wolves find small habits that protect air, water, and food, and see how they add up.',
      },
      {
        name: 'Code of the Wolf',
        url: 'https://www.scouting.org/cub-scout-adventures/code-of-the-wolf/',
        icon: 'wolf_Code_of_the_Wolf.webp',
        summary: 'Math as patterns and secret codes, including how a key hides a message.',
      },
      {
        name: 'Computing Wolves',
        url: 'https://www.scouting.org/cub-scout-adventures/computing-wolves/',
        icon: 'wolf_Computing_Wolves.webp',
        summary: 'A look inside a computer at the parts that make it work, and the on-off code it runs on.',
      },
      {
        name: 'Cubs Who Care',
        url: 'https://www.scouting.org/cub-scout-adventures/cubs-who-care/',
        icon: 'wolf_Cubs_Who_Care.webp',
        summary: 'Wolves try out some of the challenges people with disabilities face, to understand them better.',
      },
      {
        name: 'Digging in the Past',
        url: 'https://www.scouting.org/cub-scout-adventures/digging-in-the-past/',
        icon: 'wolf_Digging_Into_the_Past.webp',
        summary: 'Dinosaurs and fossils, the work a paleontologist does, and a dinosaur of your own invention.',
      },
      {
        name: 'Finding Your Way',
        url: 'https://www.scouting.org/cub-scout-adventures/finding-your-way/',
        icon: 'wolf_Finding_Your_Way.webp',
        summary: 'Maps and compasses, and how each one tells you whether you are headed the right way.',
      },
      {
        name: 'Germs Alive!',
        url: 'https://www.scouting.org/cub-scout-adventures/germs-alive/',
        icon: 'wolf_Germs_Alive.webp',
        summary: 'Why handwashing, sneezing into your elbow, and a clean room keep you from getting sick.',
      },
      {
        name: 'Let’s Camp Wolf',
        url: 'https://www.scouting.org/cub-scout-adventures/lets-camp-wolf/',
        icon: 'wolf_Lets_Camp.webp',
        summary: 'An overnight campout, with the Wolf packing and doing more of the work each time.',
      },
      {
        name: 'Paws for Water',
        url: 'https://www.scouting.org/cub-scout-adventures/paws-for-water/',
        icon: 'wolf_Paws_For_Water.webp',
        summary: 'Swimming as exercise, and the rules that keep swimming safe.',
      },
      {
        name: 'Paws of Skill',
        url: 'https://www.scouting.org/cub-scout-adventures/paws-of-skill/',
        icon: 'wolf_Paws_of_Skill.webp',
        summary: 'Sports and active games, using the Scout Oath and Law as a guide while you play.',
      },
      {
        name: 'Pedal With the Pack',
        url: 'https://www.scouting.org/cub-scout-adventures/pedal-with-the-pack/',
        icon: 'wolf_Pedal_With_the_Pack.webp',
        summary: 'Getting a bike ready and knowing what to bring, then a ride with the den, pack, or family.',
      },
      {
        name: 'Race Time Wolf',
        url: 'https://www.scouting.org/cub-scout-adventures/race-time-wolf/',
        icon: 'wolf_Race_Time.webp',
        summary: 'Design and build a Pinewood Derby® car or a Raingutter Regatta™ boat, then race it.',
      },
      {
        name: 'Spirit of the Water',
        url: 'https://www.scouting.org/cub-scout-adventures/spirit-of-the-water/',
        icon: 'wolf_Spirit_of_the_Water.webp',
        summary: 'Where the water you use comes from, and what you can do to use less of it.',
      },
      {
        name: 'Summertime Fun Wolf',
        url: 'https://www.scouting.org/cub-scout-adventures/summertime-fun-wolf/',
        icon: 'wolf_Summertime_Fun.webp',
        summary: 'Three Scouting activities over the summer, from day camp to a pack picnic.',
      },
    ],
    specialElectives: [
      {
        name: 'Archery Wolf',
        url: null,
        icon: 'wolf_Archery.webp',
        summary: 'Target archery, earned only at an approved event with a certified instructor and a proper range.',
      },
      {
        name: 'Slingshot',
        url: null,
        icon: 'wolf_Slingshot.webp',
        summary: 'Slingshot target shooting, earned only at an approved event with a certified instructor and range.',
      },
      {
        name: 'BB Guns',
        url: null,
        icon: 'wolf_BB_Guns.webp',
        summary: 'BB gun target shooting, earned only at an approved event with a certified instructor and range.',
      },
    ],
    focus: 'Second graders take on more outdoor skill-building and start practicing everyday citizenship and safety habits.',
    source: 'https://www.scouting.org/programs/cub-scouts/adventures/wolf/',
  },
  {
    rank: 'Bear',
    verified: true,
    required: [
      {
        name: 'Bobcat Bear',
        url: 'https://www.scouting.org/cub-scout-adventures/bobcat-bear/',
        icon: 'bear_Bear_Bobcat.webp',
        summary: 'The adventure every Bear starts with: the Scout Oath and Law, the sign, the salute, and the handshake.',
      },
      {
        name: 'Bear Strong',
        url: 'https://www.scouting.org/cub-scout-adventures/bear-strong/',
        icon: 'bear_Bear_Strong.webp',
        summary: 'Eating right and exercising to stay physically strong, plus the rest and reading that keep a mind awake.',
      },
      {
        name: 'Standing Tall',
        url: 'https://www.scouting.org/cub-scout-adventures/standing-tall/',
        icon: 'bear_Standing_Tall.webp',
        summary: 'The Protect Yourself Rules, using electronics responsibly, and protecting your body at play and work.',
      },
      {
        name: 'Bear Habitat',
        url: 'https://www.scouting.org/cub-scout-adventures/bear-habitat/',
        icon: 'bear_Bear_Habitat.webp',
        summary: 'Bears plan and take a one-mile walk with the den, on a neighborhood, nature, or historical trail.',
      },
      {
        name: 'Paws for Action',
        url: 'https://www.scouting.org/cub-scout-adventures/paws-for-action/',
        icon: 'bear_Paws_For_Action.webp',
        summary: 'The country’s symbols, how communities solve their own problems, and a service project of the den’s own.',
      },
      {
        name: 'Fellowship',
        url: 'https://www.scouting.org/cub-scout-adventures/fellowship/',
        icon: 'bear_Fellowship.webp',
        summary: 'Bears explore their family’s faith and traditions and how their own beliefs fit into Scouting.',
      },
    ],
    electives: [
      {
        name: 'A Bear Goes Fishing',
        url: 'https://www.scouting.org/cub-scout-adventures/a-bear-goes-fishing/',
        icon: 'bear_A_Bear_Goes_Fishing.webp',
        summary: 'Fishing with a cane pole or a rod and reel, the fish that live nearby, and the rules that go with it.',
      },
      {
        name: 'Balancing Bears',
        url: 'https://www.scouting.org/cub-scout-adventures/balancing-bears/',
        icon: 'bear_Balancing_Bears.webp',
        summary: 'Equations as a balance, where whatever is on one side has to match the other.',
      },
      {
        name: 'Baloo the Builder',
        url: 'https://www.scouting.org/cub-scout-adventures/baloo-the-builder/',
        icon: 'bear_Baloo_the_Builder.webp',
        summary: 'Bears build something useful or fun out of wood and learn the tools that go into it.',
      },
      {
        name: 'Bears Afloat',
        url: 'https://www.scouting.org/cub-scout-adventures/bears-afloat/',
        icon: 'bear_Bears_Afloat.webp',
        summary: 'Bears pick a canoe, kayak, or paddleboard and learn to handle it; the swimmer test comes first.',
      },
      {
        name: 'Bears on Bikes',
        url: 'https://www.scouting.org/cub-scout-adventures/bears-on-bikes/',
        icon: 'bear_Bears_on_Bikes.webp',
        summary: 'What to wear, some basic bike maintenance, and a ride with the den, pack, or family.',
      },
      {
        name: 'Champions for Nature Bear',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-bear/',
        icon: 'bear_Champions_of_Nature.webp',
        summary: 'Water, soil, and air as resources worth protecting, and a conservation project to match.',
      },
      {
        name: 'Chef Tech',
        url: 'https://www.scouting.org/cub-scout-adventures/chef-tech/',
        icon: 'bear_Chef_Tech.webp',
        summary: 'Cooking as technology, from a stick over an open fire to a microwave.',
      },
      {
        name: 'Critter Care',
        url: 'https://www.scouting.org/cub-scout-adventures/critter-care/',
        icon: 'bear_Critter_Care.webp',
        summary: 'Looking after pets, and what different animals need from the people who keep them.',
      },
      {
        name: 'Forensics',
        url: 'https://www.scouting.org/cub-scout-adventures/forensics/',
        icon: 'bear_Forensics.webp',
        summary: 'The clues people leave behind, and how forensic scientists use them to solve a case.',
      },
      {
        name: 'Let’s Camp Bear',
        url: 'https://www.scouting.org/cub-scout-adventures/lets-camp-bear/',
        icon: 'bear_Lets_Camp.webp',
        summary: 'Packing for a campout, then finding a good spot and pitching a tent to sleep in.',
      },
      {
        name: 'Marble Madness',
        url: 'https://www.scouting.org/cub-scout-adventures/marble-madness/',
        icon: 'bear_Marble_Madness.webp',
        summary: 'Marble games, mazes, and obstacle courses, plus the words only marble players use.',
      },
      {
        name: 'Race Time Bear',
        url: 'https://www.scouting.org/cub-scout-adventures/race-time-bear/',
        icon: 'bear_Race_Time.webp',
        summary: 'Build a Pinewood Derby® car or a Raingutter Regatta™ boat and find out what makes it go.',
      },
      {
        name: 'Roaring Laughter',
        url: 'https://www.scouting.org/cub-scout-adventures/roaring-laughter/',
        icon: 'bear_Roaring_Laughter.webp',
        summary: 'Jokes, smiles, and all the ways a laugh spreads to the people around you.',
      },
      {
        name: 'Salmon Run',
        url: 'https://www.scouting.org/cub-scout-adventures/salmon-run/',
        icon: 'bear_Salmon_Run.webp',
        summary: 'Swimming and boating, and how to stay safe in and around the water.',
      },
      {
        name: 'Summertime Fun Bear',
        url: 'https://www.scouting.org/cub-scout-adventures/summertime-fun-bear/',
        icon: 'bear_Summertime_Fun.webp',
        summary: 'Three Scouting activities over the summer, from day camp to a pack picnic.',
      },
      {
        name: 'Super Science',
        url: 'https://www.scouting.org/cub-scout-adventures/super-science/',
        icon: 'bear_Super_Science.webp',
        summary: 'The questions scientists ask, tried as experiments: why the sky is blue, how gravity works.',
      },
      {
        name: 'Whittling',
        url: 'https://www.scouting.org/cub-scout-adventures/whittling/',
        icon: 'bear_Whittling.webp',
        summary: 'How to use a pocketknife safely, and the basics of carving something with it.',
      },
    ],
    specialElectives: [
      {
        name: 'Archery Bear',
        url: null,
        icon: 'bear_Archery.webp',
        summary: 'Target archery, earned only at an approved event with a certified instructor and a proper range.',
      },
      {
        name: 'Slingshot',
        url: null,
        icon: 'bear_Slingshot.webp',
        summary: 'Slingshot target shooting, earned only at an approved event with a certified instructor and range.',
      },
      {
        name: 'BB Guns',
        url: null,
        icon: 'bear_BB_Guns.webp',
        summary: 'BB gun target shooting, earned only at an approved event with a certified instructor and range.',
      },
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
        summary: 'The adventure every Webelos starts with: the Scout Oath and Law, the sign, the salute, and the handshake.',
      },
      {
        name: 'Stronger, Faster, Higher',
        url: 'https://www.scouting.org/cub-scout-adventures/stronger-faster-higher/',
        icon: 'webelos_Stronger_Faster_Higher.webp',
        summary: 'Eating well, exercising, and resting, and how personal fitness balances all three.',
      },
      {
        name: 'My Safety',
        url: 'https://www.scouting.org/cub-scout-adventures/my-safety/',
        icon: 'webelos_My_Safety.webp',
        summary: 'The Protect Yourself Rules, plus ways to make a home and a meeting space safer.',
      },
      {
        name: 'My Family',
        url: 'https://www.scouting.org/cub-scout-adventures/my-family/',
        icon: 'webelos_My_Family.webp',
        summary: 'Webelos look at their own faith and family and how to keep those practices going.',
      },
      {
        name: 'My Community',
        url: 'https://www.scouting.org/cub-scout-adventures/my-community/',
        icon: 'webelos_My_Community.webp',
        summary: 'Voting, how the national government balances power, and a talk with a local elected official.',
      },
      {
        name: 'Webelos Walkabout',
        url: 'https://www.scouting.org/cub-scout-adventures/webelos-walkabout/',
        icon: 'webelos_Webelos_Walkabout.webp',
        summary: 'Webelos plan a two-mile walk, pack for it, and know what to do if something goes wrong.',
      },
    ],
    electives: [
      {
        name: 'Aquanaut',
        url: 'https://www.scouting.org/cub-scout-adventures/aquanaut/',
        icon: 'webelos_Aquanaut.webp',
        summary: 'Swimming for fun and fitness, and how to respond when there is trouble in the water.',
      },
      {
        name: 'Art Explosion',
        url: 'https://www.scouting.org/cub-scout-adventures/art-explosion/',
        icon: 'webelos_Art_Explosion.webp',
        summary: 'Drawing, painting, sculpture, photography, or illustration, with no right answer to get.',
      },
      {
        name: 'Aware and Care',
        url: 'https://www.scouting.org/cub-scout-adventures/aware-and-care/',
        icon: 'webelos_Aware_and_Care.webp',
        summary: 'Seeing the world through someone else’s challenges, and being more helpful for it.',
      },
      {
        name: 'Build It',
        url: 'https://www.scouting.org/cub-scout-adventures/build-it/',
        icon: 'webelos_Build_It.webp',
        summary: 'A carpentry project of your own, and the tools a builder reaches for to make it.',
      },
      {
        name: 'Catch the Big One',
        url: 'https://www.scouting.org/cub-scout-adventures/catch-the-big-one/',
        icon: 'webelos_Catch_the_Big_One.webp',
        summary: 'Time outdoors near the water learning to fish, usually releasing what you catch.',
      },
      {
        name: 'Champions for Nature Webelos',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-webelos/',
        icon: 'webelos_Champions_of_Nature.webp',
        summary: 'The wildlife we share the planet with, species people helped bring back, and a conservation project.',
      },
      {
        name: 'Chef’s Knife',
        url: 'https://www.scouting.org/cub-scout-adventures/chefs-knife/',
        icon: 'webelos_ChefsKnife.webp',
        summary: 'Kitchen knife safety, and how to slice, chop, and mince with one.',
      },
      {
        name: 'Earth Rocks',
        url: 'https://www.scouting.org/cub-scout-adventures/earth-rocks/',
        icon: 'webelos_Earth_Rocks.webp',
        summary: 'Rocks and minerals, what people make from them, and ground that is always moving.',
      },
      {
        name: 'Let’s Camp Webelos',
        url: 'https://www.scouting.org/cub-scout-adventures/lets-camp-webelos/',
        icon: 'webelos_Lets_Camp.webp',
        summary: 'Webelos help plan a campout, get ready for rough weather, and leave no trace behind.',
      },
      {
        name: 'Math on the Trail',
        url: 'https://www.scouting.org/cub-scout-adventures/math-on-the-trail/',
        icon: 'webelos_Math_on_the_Trail.webp',
        summary: 'Knowing your own pace so you can estimate how long any walk will take.',
      },
      {
        name: 'Modular Design',
        url: 'https://www.scouting.org/cub-scout-adventures/modular-design/',
        icon: 'webelos_Modular_Design.webp',
        summary: 'Building from modular parts, and writing directions someone else can actually follow.',
      },
      {
        name: 'Paddle Onward',
        url: 'https://www.scouting.org/cub-scout-adventures/paddle-onward/',
        icon: 'webelos_Paddle_Onward.webp',
        summary: 'Pick a canoe, kayak, or paddleboard and learn to get in, out, and moving; swimmer test first.',
      },
      {
        name: 'Pedal Away',
        url: 'https://www.scouting.org/cub-scout-adventures/pedal-away/',
        icon: 'webelos_Pedal_Away.webp',
        summary: 'How the gears on a bike work, plus the safety and upkeep that make one last.',
      },
      {
        name: 'Race Time Webelos',
        url: 'https://www.scouting.org/cub-scout-adventures/race-time-webelos/',
        icon: 'webelos_Race_Time.webp',
        summary: 'Propulsion and friction: build vehicles and work out what makes them travel farther.',
      },
      {
        name: 'Summertime Fun Webelos',
        url: 'https://www.scouting.org/cub-scout-adventures/summertime-fun-webelos/',
        icon: 'webelos_Summertime_Fun.webp',
        summary: 'Three Scouting activities over the summer, from day camp to a pack picnic.',
      },
      {
        name: 'Tech on the Trail',
        url: 'https://www.scouting.org/cub-scout-adventures/tech-on-the-trail/',
        icon: 'webelos_Tech_on_the_Trail.webp',
        summary: 'Using technology outdoors to explore, navigate, and understand the country around you.',
      },
      {
        name: 'Yo-yo',
        url: 'https://www.scouting.org/cub-scout-adventures/yo-yo/',
        icon: 'webelos_Yo_Yo.webp',
        summary: 'Yo-yo tricks, from the sleeper to walk the dog to around the world.',
      },
    ],
    specialElectives: [
      {
        name: 'Archery Webelos',
        url: null,
        icon: 'webelos_Archery.webp',
        summary: 'Target archery, earned only at an approved event with a certified instructor and a proper range.',
      },
      {
        name: 'Slingshot',
        url: null,
        icon: 'webelos_Slingshot.webp',
        summary: 'Slingshot target shooting, earned only at an approved event with a certified instructor and range.',
      },
      {
        name: 'BB Guns',
        url: null,
        icon: 'webelos_BB_Guns.webp',
        summary: 'BB gun target shooting, earned only at an approved event with a certified instructor and range.',
      },
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
        summary: 'The Scout slogan, the patrol method, ranks and merit badges, and a visit to a Scouts BSA troop.',
      },
      {
        name: 'Personal Fitness',
        url: 'https://www.scouting.org/cub-scout-adventures/personal-fitness/',
        icon: 'arrow-of-light_Personal_Fitness.webp',
        summary: 'Nutrition, group activities, and personal exercise, plus a first look at your own health record.',
      },
      {
        name: 'First Aid',
        url: 'https://www.scouting.org/cub-scout-adventures/first-aid/',
        icon: 'arrow-of-light_First_Aid.webp',
        summary: 'How to help someone who is hurt, sometimes taught by an EMT, a nurse, or a doctor.',
      },
      {
        name: 'Duty to God',
        url: 'https://www.scouting.org/cub-scout-adventures/duty-to-god/',
        icon: 'arrow-of-light_AOL_Duty_to_God.webp',
        summary: 'Scouts explore their own family’s faith and how they practice it, mostly at home.',
      },
      {
        name: 'Citizenship',
        url: 'https://www.scouting.org/cub-scout-adventures/citizenship/',
        icon: 'arrow-of-light_Citizenship.webp',
        summary: 'Scouts identify, plan, and carry out a service project rather than just turning up for one.',
      },
      {
        name: 'Outdoor Adventurer',
        url: 'https://www.scouting.org/cub-scout-adventures/outdoor-adventurer/',
        icon: 'arrow-of-light_AOL_Outdoor_Adventurer.webp',
        summary: 'Plan and run a campout with the patrol or a Scouts BSA troop, using the SAFE Checklist.',
      },
    ],
    electives: [
      {
        name: 'Champions for Nature AOL',
        url: 'https://www.scouting.org/cub-scout-adventures/champions-for-nature-aol/',
        icon: 'arrow-of-light_Champions_of_Nature.webp',
        summary: 'Where food comes from, the land and resources it takes, and how to waste less of it.',
      },
      {
        name: 'Cycling',
        url: 'https://www.scouting.org/cub-scout-adventures/cycling/',
        icon: 'arrow-of-light_Cycling.webp',
        summary: 'A 10-mile ride on road or trail, with the bike, gear, and essentials checked first.',
      },
      {
        name: 'Engineer',
        url: 'https://www.scouting.org/cub-scout-adventures/engineer/',
        icon: 'arrow-of-light_Engineering.webp',
        summary: 'What engineers actually do, tried out on engineering projects of your own.',
      },
      {
        name: 'Estimations',
        url: 'https://www.scouting.org/cub-scout-adventures/estimations/',
        icon: 'arrow-of-light_Estimations.webp',
        summary: 'When to measure and when a good estimate will do, like the time of day or a tree’s height.',
      },
      {
        name: 'Fishing',
        url: 'https://www.scouting.org/cub-scout-adventures/fishing/',
        icon: 'arrow-of-light_Fishing.webp',
        summary: 'Planning a fishing trip yourself with Scouting America’s SAFE Checklist.',
      },
      {
        name: 'High Tech Outdoors',
        url: 'https://www.scouting.org/cub-scout-adventures/high-tech-outdoors/',
        icon: 'arrow-of-light_High_Tech_Outdoors.webp',
        summary: 'How gear and digital tools have changed camping, navigating, and staying safe outdoors.',
      },
      {
        name: 'Into the Wild',
        url: 'https://www.scouting.org/cub-scout-adventures/into-the-wild/',
        icon: 'arrow-of-light_Into_the_Wild.webp',
        summary: 'A closer look at the local wildlife, day and night, and the part each animal plays.',
      },
      {
        name: 'Into the Woods',
        url: 'https://www.scouting.org/cub-scout-adventures/into-the-woods/',
        icon: 'arrow-of-light_Into_the_Woods.webp',
        summary: 'The trees and plants around you, found on a walk or a visit to a nature center or park.',
      },
      {
        name: 'Knife Safety',
        url: 'https://www.scouting.org/cub-scout-adventures/knife-safety/',
        icon: 'arrow-of-light_Knife_Safety.webp',
        summary: 'The safety circle and knife care, then a pocketknife on a campout and a kitchen knife at home.',
      },
      {
        name: 'Paddle Craft',
        url: 'https://www.scouting.org/cub-scout-adventures/paddle-craft/',
        icon: 'arrow-of-light_Paddle_Craft.webp',
        summary: 'Pick a canoe, kayak, or paddleboard and learn to get in, out, and moving; swimmer test first.',
      },
      {
        name: 'Race Time AOL',
        url: 'https://www.scouting.org/cub-scout-adventures/race-time-aol/',
        icon: 'arrow-of-light_Race_Time.webp',
        summary: 'Build a Pinewood Derby® car or Raingutter Regatta™ boat, then mentor younger Cub Scouts on theirs.',
      },
      {
        name: 'Summertime Fun AOL',
        url: 'https://www.scouting.org/cub-scout-adventures/summertime-fun-aol/',
        icon: 'arrow-of-light_Summertime_Fun.webp',
        summary: 'Three Scouting activities over the summer with the patrol or the pack.',
      },
      {
        name: 'Swimming',
        url: 'https://www.scouting.org/cub-scout-adventures/swimming/',
        icon: 'arrow-of-light_Swimming.webp',
        summary: 'Passing the swimmer test, which opens up the aquatics waiting in Scouts BSA.',
      },
    ],
    specialElectives: [
      {
        name: 'Archery Arrow of Light',
        url: null,
        icon: 'arrow-of-light_Archery.webp',
        summary: 'Target archery, earned only at an approved event with a certified instructor and a proper range.',
      },
      {
        name: 'Slingshot',
        url: null,
        icon: 'arrow-of-light_Slingshot.webp',
        summary: 'Slingshot target shooting, earned only at an approved event with a certified instructor and range.',
      },
      {
        name: 'BB Guns',
        url: null,
        icon: 'arrow-of-light_BB_Guns.webp',
        summary: 'BB gun target shooting, earned only at an approved event with a certified instructor and range.',
      },
    ],
    focus:
      'Fifth graders run their own standalone program built around patrol-method outdoor skills that prepare them to cross over into a Scouts BSA troop.',
    source: 'https://www.scouting.org/programs/cub-scouts/adventures/arrow-of-light/',
  },
];
