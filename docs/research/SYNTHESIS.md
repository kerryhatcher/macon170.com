# Pack 170 Website — Research Synthesis

_The single brief a designer or developer should read before building macon170.com. Distilled from
`scouting-america.md`, `cub-scouting.md`, `highland-hills-baptist.md`, and `macon-ga.md` in this
directory — consult those for sourcing and detail._

---

## 1. Project snapshot

**What we're building:** an Astro static site for **Cub Scout Pack 170** of **Macon, Georgia**, a
Cub Scouting unit of **Scouting America** operating under the **Central Georgia Council**
(headquartered in Macon, 24 counties of middle Georgia).

**Chartered organization:** **Highland Hills Baptist Church**, 1370 Briarcliff Road, Macon, GA 31211
— a 1953-founded Cooperative Baptist Fellowship congregation in the historic Shirley Hills neighborhood of East
Macon. Note the charter relationship is _confirmed_ for Venturing Crew 170 but **not yet
independently confirmed for Pack 170** (see Open Questions).

**Who the program serves:** kids in **kindergarten through 5th grade** (ages ~5–11), boys and girls.
Six ranks in order: **Lion (K) → Tiger (1) → Wolf (2) → Bear (3) → Webelos (4) → Arrow of Light (5)**.
Kids meet in small same-grade **dens** (2–3x/month) that come together as a **pack** once a month.

**Two audiences, in priority order:**

1. **Prospective families** — a parent who just heard about Cub Scouts and wants to know: what is
   this, does my kid qualify, when/where do you meet, what does it cost, how do I sign up. They
   arrive from Google, BeAScout, or a friend, and they leave in 90 seconds if they can't find a
   meeting time and a "Join" button.
2. **Current families** — returning for the calendar (by far the most-used page), event details,
   payment/registration links, leader contacts, and photos.

**Tone:** warm, family-friendly, adventurous, plainly local. This is a volunteer-run neighborhood
pack, not a corporate program page — write like a fellow parent, not a national brochure.

---

## 2. Brand & compliance constraints

These are the hard rules. Getting them wrong is a policy problem, not a style nit.

### Naming

- The national organization is **"Scouting America"** — the Boy Scouts of America renamed on
  Feb 8, 2025. There is **no acronym**; never write "SA," and avoid "BSA" or "Boy Scouts" in new
  copy (BSA persists only in legacy systems like myscouting.org).
- Program names did **not** change: it is still **Cub Scouting**, still **Cub Scout Pack 170**.
  Never "Boy Scout Pack 170." Preferred long form: _"Cub Scout Pack 170, Macon, Georgia"_ or
  _"Pack 170, Scouting America."_

### Trademarks and official artwork

- Scouting America's emblems, rank insignia, and logos are protected by a **1916 Act of Congress**
  plus USPTO registrations — among the strongest trademark protection any US nonprofit holds.
- Official marks **must be used exactly as issued**. A unit does not get to redraw, recolor, crop,
  or restyle the fleur-de-lis, the Cub Scout logo, or any rank badge.
- **Practical rule:** either obtain official artwork through the Chartered Organization Rep /
  Central Georgia Council / the Brand Center, or don't use it. For everything else, use
  _Scouting-adjacent_ original iconography — compass, trail marker, tent, pine, embroidered-patch
  shapes — which is unencumbered and, honestly, more distinctive.
- The site must not present itself as an official national or council property. It's a local unit
  site; say so in the footer.

### Youth protection & privacy (non-negotiable)

- **The national privacy policy explicitly does not cover unit sites.** The pack needs **its own
  privacy policy page** naming a responsible adult webmaster.
- **COPPA:** no forms that collect information from a child. Every form is addressed to a
  parent/guardian.
- **Names:** publish at most a Scout's **first name and last initial**. Never a minor's full name,
  address, phone, school, or a parent's workplace.
- **Photos:** no photo of a youth under 18 without **signed parental consent** (the pack's annual
  registration/photo release). Build a photo opt-out path for families who decline. Prefer
  event-level captions ("Pinewood Derby 2026") over naming individuals at all.
- **Everything public, nothing private.** No members-only areas, closed groups, DMs, or chat. At
  least **two adult admins**, one a registered Youth-Protection-trained leader.
- **No one-on-one adult–youth channel in any medium.** A "contact a leader" form must reach
  multiple adults and be framed as parent-to-leader.

### Content constraints worth knowing

- Prohibited activities that should never appear in event copy: alcohol at any Scouting event,
  paintball, laser tag, hunting, rodeo, fireworks, bungee jumping.
- Pack overnighters require an adult with **BALOO** training present — relevant if the site
  describes camping logistics.

**External references worth bookmarking:** [BeAScout](https://beascout.scouting.org/) ·
[Central Georgia Council](https://www.centralgeorgiacouncil.org/) ·
[Scouting America Brand Center](https://scoutingwire.org/bsa-brand-center/brand-identity/) ·
[Social Media Guidelines](https://scoutingwire.org/social-media-guidelines/)

---

## 3. Visual identity direction

### Palette

Anchor hard on Cub Scout blue and gold — they're unambiguous, well-documented, and instantly read
"Cub Scouts" rather than "generic youth org." Layer Macon in as accents only.

| Role         | Name           | Hex       | Use                                                          |
| ------------ | -------------- | --------- | ------------------------------------------------------------ |
| Primary      | Cub Scout Blue | `#003F87` | Headers, nav, primary buttons, body links (PMS 294)          |
| Primary deep | Midnight Blue  | `#002B5C` | Hover states, footer, large dark fields                      |
| Secondary    | Cub Scout Gold | `#FCD116` | CTA fills, badges, rules, highlights (PMS 116)               |
| Accent       | Cherry Blossom | `#E8A3C6` | Sparingly — seasonal banners, tags, decorative bloom motifs  |
| Accent       | River Green    | `#6B8E7F` | Outdoors/camping sections, secondary buttons                 |
| Accent       | Brick Red      | `#A0473D` | Rare emphasis, history/heritage sections                     |
| Neutral bg   | Warm Cream     | `#F5F1E8` | Page and card backgrounds — warmer and friendlier than white |
| Neutral text | Charcoal       | `#2E2E2E` | Body copy                                                    |

**Contrast rules that matter:** `#003F87` on cream or white is comfortably AA/AAA. **Gold is never a
text color** — it's a fill, and text sitting on gold must be charcoal or midnight blue. Cherry
blossom pink is decorative only; never put small text on it. Aim for WCAG AA (4.5:1) throughout.

**Rank colors** are a free, on-brand secondary system for den pages and grade charts:
Lion yellow, Tiger orange, Wolf red, Bear blue, Webelos plaid, Arrow of Light olive/tan. A
color-coded "which den is my child in?" chart is one of the highest-value graphics on the site.

### Typography

Scouting America's brand faces (Proxima Nova, Futura, Museo Slab, Gill Sans) are all licensed
except **Montserrat**, which is on Google Fonts and reads as a close, brand-adjacent geometric sans.

- **Headlines:** Montserrat (600/700) — the free, defensible brand-adjacent choice.
- **Body:** a warm, highly readable sans — Source Sans 3 or Inter at generous size (17–18px base).
  Parents read this on phones in a parking lot.
- **Optional accent:** a slab serif (Bitter, Zilla Slab) for event titles or pull quotes if the
  design wants a campfire/patch feel. Use one accent face at most.

### Imagery & motifs

- **Lead with real photos of real pack activities** — Pinewood Derby cars mid-race, kids at a
  campout, a Blue & Gold table — subject to the photo-consent rules above. Stock photography of
  generic smiling children reads as fake and undercuts trust faster than no photo at all.
- **Patch aesthetic** is the safest and best motif: rounded shield or circular badge shapes, thick
  borders, flat saturated fills, simple silhouettes. Use it for section headers, den icons, and
  event markers. It evokes rank insignia without reproducing any protected badge.
- **Fleur-de-lis:** use only official artwork obtained through the council, unmodified, and only if
  actually needed. A compass rose is a legitimate stand-in — Baden-Powell chose the fleur-de-lis
  precisely _because_ it resembles a compass point, "it shows the true way to go."
- **Local motifs:** cherry blossom branches as seasonal decoration (spring pages, festival tie-ins),
  the Ocmulgee River and treeline as a silhouette/divider, and rolling pine-and-hill textures for
  outdoor sections. Landmark photography (Ocmulgee Mounds, Lake Tobesofkee, Jackson Springs Park)
  works well for the "what we do outdoors" story.
- **Avoid:** camo, military styling, anything that reads as exclusionary or boys-only. Girls have
  been in Cub Scouting since 2018 and the site should look obviously welcoming to every family.

---

## 4. Content architecture

Recommended pages, ordered by how much they matter:

1. **Home** — one-sentence pitch, the next meeting/event date, a prominent **Join Us** CTA above the
   fold, and the meeting day/time/location visible without scrolling. Three-up: who we are, what we
   do, how to join.
2. **Join / New Families** — the conversion page. What Cub Scouting is, grade-to-den chart, meeting
   cadence (den 2–3x/month, pack 1x/month, 1–2 optional events), realistic cost breakdown ($85/year
   national registration plus local pack dues; roughly $150–200/year all-in with uniform, largely
   offset by the popcorn fundraiser), what to wear to a first visit, and a **BeAScout link plus a
   short parent-facing interest form**. Close with an FAQ.
3. **Calendar / Events** — the most-visited page for existing families and the strongest retention
   tool. Show the **whole program year at once** so families can plan around it. Anchor events:
   fall Join Scouting Night, popcorn fundraiser (Sept–Nov), fall campout, **Pinewood Derby (late
   January)**, **Blue & Gold Banquet (February, near the Feb 8 anniversary)**, crossover ceremony
   (spring), Raingutter Regatta, summer day camp / resident camp, end-of-year picnic. Keep it
   uncluttered — deliberately simpler than a council calendar.
4. **About / Our Pack** — den structure, meeting time and location, chartered organization
   acknowledgment, brief pack history, the Cub Scout motto ("Do Your Best"), Scout Oath and Law.
5. **Leadership & Contact** — Cubmaster, Committee Chair, Den Leaders. Adult names and role emails
   are fine and expected; prefer role-based addresses (`cubmaster@…`) over personal ones. Contact
   form routes to multiple adults.
6. **What We Do / Activities** — the signature events with photos, organized den / pack / family.
   This is where the adventure sells itself.
7. **Photos** — event-captioned galleries under the consent rules. Nice to have, not launch-critical.
8. **Resources** — Scoutbook, advancement/adventure guides, uniform buying guide, parent handbook,
   council and BeAScout links, dues/popcorn payment links.
9. **Volunteer** — how parents plug in, from one-off event help to den leader. Say plainly that no
   experience is required; that objection is the main blocker.
10. **Privacy Policy** — required, pack-specific, names a webmaster contact.

### Chartered-organization acknowledgment

Give Highland Hills Baptist Church a genuine mention on About and a line in the global footer.
Suggested pattern, pending confirmation of the charter:

> Cub Scout Pack 170 is chartered by Highland Hills Baptist Church of Macon, Georgia, in partnership
> with the Central Georgia Council, Scouting America. We're grateful for the space, support, and
> commitment to young people that make our program possible.

Link the church website and address. Worth noting in the About copy: Scouting's partnership model
means the church charters the pack while parents and volunteers run the program, and the pack
welcomes families of all backgrounds. Say this explicitly — prospective families often assume a
church-chartered unit is members-only.

---

## 5. Local hooks

Macon gives this site personality that a template pack site can't have.

- **Cherry blossoms.** Macon is the "Cherry Blossom Capital of the World" — 350,000+ Yoshino cherry
  trees, and the **International Cherry Blossom Festival** each spring since 1982. A spring seasonal
  treatment, a festival service/parade participation post, or simply blossom motifs on spring event
  pages ties the pack to something every local family already loves.
- **Ocmulgee Mounds National Historical Park** — eight miles of trails, the Great Temple Mound, the
  Earth Lodge, ancestral homeland of the Muscogee (Creek) Nation. An outstanding hiking and
  history-adventure destination on the pack's doorstep, and a natural photo backdrop.
- **Lake Tobesofkee** (Claystone, Sandy Beach, Arrowhead parks) — camping, swimming, trails, fishing
  just west of town; a plausible family campout venue.
- **Camp Benjamin Hawkins** — the council's 550-acre camp near Byron, running Scout programming
  since 1927. Worth naming on the camping page.
- **Central Georgia Council** — link the council site for camp registration, training (BALOO,
  first aid), camporees, and the Scout shop; the council serves 3,700+ participants across 24
  counties.
- **Shirley Hills** — the church sits in a National Register historic district with Olmsted-firm
  landscape design and Jackson Springs Park with its bird sanctuary and stone bridges. Good "where
  we meet" flavor and good photography.
- **Macon music heritage** (Otis Redding, Little Richard, the Allman Brothers) — a light garnish for
  event themes or a Blue & Gold banquet motif, not a structural theme.

---

## 6. Open questions for pack leadership

Nothing below should be guessed at or invented in site copy. These need answers from Pack 170
leadership or Highland Hills Baptist Church before launch.

**Blocking — the site cannot launch without these:**

1. **Meeting day, time, and frequency** for pack meetings, and the den meeting pattern.
2. **Meeting location** — does the pack meet at Highland Hills Baptist Church, and in which
   building/room? No public source confirms this.
3. **Charter confirmation** — is Cub Scout Pack 170 actually chartered by Highland Hills Baptist
   Church? Only Venturing Crew 170's charter is publicly confirmed. Verify with the pack, the
   church, or the Central Georgia Council before printing the acknowledgment.
4. **Contact email(s)** — ideally role-based (Cubmaster, Committee Chair, membership/join inquiries).
5. **Local pack dues** — amount, what they cover, when they're due, and how families pay.
6. **Leadership roster** — Cubmaster, Committee Chair, Den Leaders, with the names and role emails
   they're comfortable publishing.
7. **Den structure this year** — which dens actually exist, whether any are girl dens or K–4 family
   dens, and how they're named.

**Needed soon after:**

8. **Photo release status** — does the pack collect a photo consent form, and who tracks opt-outs?
9. **Pack history** — charter date, founding story, notable traditions. Nice-to-have color for About.
10. **This year's calendar** — actual dates for Pinewood Derby, Blue & Gold, campouts, Join Night.
11. **Existing web presence** — the pack has a Facebook page and a `cubscoutpack170.square.site`
    page; decide whether macon170.com replaces, supplements, or links to them, and where dues
    payment lives.
12. **Official artwork** — can the Chartered Organization Rep obtain approved Cub Scout / fleur-de-lis
    assets from the council, or do we go entirely with original patch-style iconography?
13. **Site admins** — the two-adult-administrator requirement means naming who holds access.
