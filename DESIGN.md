---
name: Pack 170 Elementary Adventure Handbook
description: A practical family handbook with the warmth and wonder of an elementary-school adventure book.
colors:
  cub-blue: '#003F87'
  midnight-blue: '#002B5C'
  cub-gold: '#FCD116'
  notebook-paper: '#F7F1E3'
  clean-page: '#FFFDF7'
  pencil-charcoal: '#272B2E'
  pencil-muted: '#59636B'
  rule-line: '#D7CDB8'
  river-green: '#42765C'
  river-green-deep: '#28543F'
  cherry-blossom: '#E8A3C6'
  brick-red: '#A33C34'
  # Paper is a monochrome medium and a volunteer's printer is usually black-only, so on
  # paper the palette collapses to this four-step ink ramp: the blue and green fields
  # become type on white and a rule carries the separation the fill used to. Valid only
  # inside @media print, never on screen. Official rank badge artwork keeps its own
  # colors here, unmodified, per the trademark rules in PRODUCT.md.
  print-page: '#FFFFFF'
  print-ink: '#000000'
  print-ink-muted: '#333333'
  print-rule: '#999999'
typography:
  display:
    fontFamily: 'Montserrat, Arial, sans-serif'
    fontSize: 'clamp(2.9rem, 8vw, 5.7rem)'
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: '-0.025em'
  headline:
    fontFamily: 'Montserrat, Arial, sans-serif'
    fontSize: 'clamp(2.05rem, 5vw, 3.5rem)'
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: '-0.025em'
  title:
    fontFamily: 'Montserrat, Arial, sans-serif'
    fontSize: '1.45rem'
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: '-0.015em'
  subtitle:
    fontFamily: 'Montserrat, Arial, sans-serif'
    fontSize: '1.2rem'
    fontWeight: 900
    lineHeight: 1.25
  cardTitle:
    fontFamily: 'Montserrat, Arial, sans-serif'
    fontSize: '1.15rem'
    fontWeight: 800
    lineHeight: 1.25
  subheading:
    fontFamily: 'Montserrat, Arial, sans-serif'
    fontSize: 'clamp(1.25rem, 2vw, 1.65rem)'
    fontWeight: 800
    lineHeight: 1.3
  pageTitle:
    fontFamily: 'Montserrat, Arial, sans-serif'
    fontSize: 'clamp(2.6rem, 7vw, 5rem)'
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: '-0.025em'
  glyphFluid:
    fontFamily: 'Montserrat, Arial, sans-serif'
    fontSize: 'clamp(2.5rem, 6vw, 5.5rem)'
    fontWeight: 900
    lineHeight: 1
  body:
    fontFamily: 'Source Sans 3, Segoe UI, sans-serif'
    fontSize: '1.1rem'
    fontWeight: 400
    lineHeight: 1.65
  bodySmall:
    fontFamily: 'Source Sans 3, Segoe UI, sans-serif'
    fontSize: '0.95rem'
    fontWeight: 400
    lineHeight: 1.55
  meta:
    fontFamily: 'Montserrat, Arial, sans-serif'
    fontSize: '0.82rem'
    fontWeight: 800
    lineHeight: 1.3
  label:
    fontFamily: 'Montserrat, Arial, sans-serif'
    fontSize: '0.76rem'
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: '0.06em'
  labelSmall:
    fontFamily: 'Montserrat, Arial, sans-serif'
    fontSize: '0.68rem'
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: '0.1em'
  # Drawn marks, not type: characters used as illustration (pines, flags, race cars) and
  # numerals inside a badge or mark. Sized to the drawing, never to the reading order, and
  # never valid for prose. Kept apart from the ten-step ramp above on purpose.
  scale:
    glyphMark: '1rem'
    glyphBadge: '1.4rem'
    glyphSmall: '2rem'
    glyphMedium: '3rem'
    glyphLarge: '8rem'
    glyphHuge: '12rem'
rounded:
  control: '9px 9px 3px 9px'
  sheet: '6px 18px 12px 8px'
  tab: '4px 12px 12px 4px'
  chip: '3px 9px 5px 3px'
  pin: '50%'
spacing:
  xs: '0.5rem'
  sm: '0.75rem'
  md: '1rem'
  lg: '1.5rem'
  xl: '2rem'
  section: 'clamp(4.5rem, 9vw, 8rem)'
components:
  button-primary:
    backgroundColor: '{colors.cub-blue}'
    textColor: '{colors.clean-page}'
    typography: '{typography.label}'
    rounded: '{rounded.control}'
    padding: '0.75rem 1.25rem'
    height: '50px'
  button-highlight:
    backgroundColor: '{colors.cub-gold}'
    textColor: '{colors.midnight-blue}'
    typography: '{typography.label}'
    rounded: '{rounded.control}'
    padding: '0.75rem 1.25rem'
    height: '50px'
  paper-sheet:
    backgroundColor: '{colors.clean-page}'
    textColor: '{colors.pencil-charcoal}'
    rounded: '{rounded.sheet}'
    padding: '2rem'
---

# Design System: Pack 170 Elementary Adventure Handbook

## Overview

**Creative North Star: "The Elementary Adventure Handbook"**

Pack 170 feels like the unusually beautiful handbook a child brings home and a parent actually keeps. It combines the practical organization of a family handbook with the warmth of an illustrated elementary-school adventure book: bold chapter tabs, tactile paper rhythm, original sewn-label shapes, friendly scenes, and grade-color wayfinding. Information stays adult-clear, fast to scan, and useful outdoors on a phone.

The system is energetic but never babyish, nostalgic but never archival, and handmade without becoming scrapbook-like. Original illustrations show Macon, Georgia terrain and family adventure objects rather than invented Scouts, protected insignia, or fake pack photography. Motion borrows from lifting paper and moving bookmarks and never hides content.

**Key Characteristics:**

- Practical parent information framed as welcoming handbook chapters
- Cub blue and gold at page scale, with warm paper and sparse local accents
- Bold geometric headings paired with open, readable body copy
- Original illustrated scenes, school-supply details, tabs, labels, and trail marks
- One unmistakable Gold priority action, Join, with Calendar always one tap away beside it

## Colors

Cub Blue and Gold establish unmistakable program recognition; warm paper keeps long-form guidance approachable, while local accents appear only when they carry meaning.

### Primary

- **Cub Scout Blue:** Navigation, chapter covers, important headings, links, and primary actions.
- **Cub Scout Gold:** The next action, bookmark, rule, or earned moment of emphasis. Never small or body text.

### Secondary

- **River Green:** Outdoor chapters, practical guidance, and calm supporting fields.
- **Cherry Blossom:** Sparse spring and Macon annotation, never a generic feminine cue.
- **Brick Red:** Cancellation, editor warning, and rare heritage emphasis.

### Neutral

- **Notebook Paper:** Warm, ruled site ground.
- **Clean Page:** Reading sheets, controls, and raised notices.
- **Pencil Charcoal:** Primary copy and drawn marks.
- **Rule Line:** Notebook structure and quiet separation.

**The Gold Is a Marker Rule.** Gold marks what to do or notice; it is never body copy and never scattered as confetti.

**The Local Accent Rule.** Pink, green, and red must explain season, place, category, or state. They are not a substitute for hierarchy.

## Typography

**Display Font:** Montserrat with Arial fallback
**Body Font:** Source Sans 3 with Segoe UI fallback

**Character:** Montserrat connects chapter titles to school signage and established Cub Scouting materials. Source Sans 3 keeps parent guidance warm, open, and readable on small outdoor-viewed screens.

### Hierarchy

- **Display:** Heavy and compact; cover titles and route openings only.
- **Headline:** Bold chapter naming with short, balanced lines.
- **Title:** Section and list headings inside a chapter.
- **Subtitle:** Emphasis inside a coloured sheet — the date on a gold date sheet, a sub-heading on a field.
- **Card Title:** The heading on a single event, resource, or den card.
- **Body:** Generous leading with a 65–72 character measure on reading pages.
- **Body Small:** Supporting copy inside cards and rows, where full body measure would crowd.
- **Meta:** Dates, times, and logistics in display weight — small but never timid.
- **Label:** Short and sturdy; uppercase is reserved for edition marks and chapter tabs.
- **Label Small:** Category and status chips only. The smallest type the system permits.

**The Ramp Is The Whole Ramp Rule.** Ten steps is already generous for a site this size; a
composition that "needs" an eleventh needs different spacing instead. Reach for the nearest
documented step rather than inventing a value 0.02rem away from one — the codebase currently
carries several such near-duplicates (`0.73`, `0.74`, `0.75`, `0.78`) that should snap to
`label` as their files are next touched.

**The Parent Can Read It in the Parking Lot Rule.** Body copy never shrinks to make a composition fit; the composition adapts around readable type.

## Layout

Pages behave like chapters in one handbook. Wide screens use an intentionally asymmetric grid with room for tabs and annotations; phones collapse to one direct reading column without changing the order. A broad cover establishes orientation, then clean reading sheets, illustrated fields, tabbed indexes, and practical notices alternate to pace the page.

The container tops out at 1160px with one-rem minimum side gutters. Major sections use a fluid 4.5–8rem vertical interval. Join is the single Gold priority action in navigation; Calendar sits with the other chapter tabs and keeps its own button in the Pack essentials strip. Both stay one tap away on every route, but only one of them is highlighted. Dense planner views prioritize date, state, and logistics over decoration.

## Elevation & Depth

Depth comes from paper overlap, visible offset shadows, folded corners, inset rules, and tonal layering—not translucent glass. The standard paper shadow combines an 8×10px blue offset with a soft charcoal ambient shadow. Interactive lift moves two to five pixels up and left, like picking up a card from a desk.

**The Paper, Not Glass Rule.** Every surface should plausibly be printed, clipped, folded, stitched, or drawn; blur and glass effects do not belong in this world.

## Shapes

Sturdy rounded rectangles use asymmetric corners so they feel clipped or hand-cut without looking damaged. Chapter tabs round only the exposed edge. Notices use taped, pinned, or folded geometry. Original badge-like labels remain abstract and never mimic rank insignia. Circles are reserved for dates, compass points, rank-color markers, and pins—not generic icon bubbles.

Five named shapes carry the system: **control** for buttons and inputs, **sheet** for paper surfaces, **tab** for chapter tabs, **chip** for category and status marks, and **pin** for the circular date, marker, and pin family.

**The Hand-Cut Sheet Rule.** `sheet` is a reference cut, not a locked token. Paper surfaces are
_expected_ to vary their corners within roughly 4–8px on the top-left, 12–30px on the top-right,
and 6–14px on the bottom pair, because identical corners on every sheet would read as machine-
stamped and kill the handmade premise. **Consequence:** an automated check that matches radius
literals will always flag this world, and that flagging is noise rather than drift. Scope the
radius rule off for sheet geometry instead of flattening the sheets to satisfy it. The other four
shapes are exact: `control`, `tab`, `chip`, and `pin` do not vary.

## Components

### Buttons

- **Shape:** Sturdy asymmetric corners; controls remain at least 50px high and 44px wide.
- **Primary:** Cub Blue on a visible Midnight Blue offset shadow.
- **Highlight:** Cub Gold with Midnight Blue text for the most important next action.
- **Hover / Focus:** Move slightly up-left; focus uses a thick Gold outline with clear separation.

### Cards / Containers

- **Corner Style:** Sheet geometry with one more open corner and one clipped corner.
- **Background:** Clean Page over Notebook Paper or colored chapter fields.
- **Shadow Strategy:** Offset print shadow plus soft ambient depth; never a zero-offset glow.
- **Border:** Rules explain a printed edge or notice state rather than decorating every box.

### Inputs / Fields

- **Style:** White paper, two-pixel gray-blue stroke, asymmetric seven-to-twelve-pixel corners.
- **Focus:** Cub Blue stroke and translucent Gold outline.
- **Error / Disabled:** Brick Red explanatory copy; disabled actions remain visible and name the missing connection.

### Navigation

-The Midnight Blue header uses high-contrast text and exactly one Gold priority tab: Join. Every other destination, Calendar included, is a plain high-contrast chapter tab. On phones, a 48px Menu control opens a simple stacked chapter index. The Gold Pack strip immediately below navigation carries verified meeting facts, next-event state, and both audience handoffs — New here and Calendar — so the returning family's most-used route is still one tap away without competing with Join for emphasis.

### Chapter Tab

-A small Gold paper tab names the current chapter or local section. It is the system’s one repeated uppercase label and must not appear above every minor heading.

### Notice

-A dashed pinned sheet communicates pending data, a parent safety note, or an editor task. It names both the missing information and the recovery path.

## Do's and Don'ts

### Do:

- **Do** make every decorative object carry navigation, state, sequence, or place.
- **Do** use original school, trail, pine, river, and cherry-blossom illustration language.
- **Do** keep Join and Calendar reachable in one tap from every route, while letting Join alone carry the Gold priority treatment.
- **Do** let missing imagery and data appear as honest, art-directed replacement states.
- **Do** preserve clear reading order, visible focus, reduced-motion behavior, and strong contrast.

### Don't:

- **Don't** make the interface babyish, gamified, scrapbook-like, or dependent on emoji.
- **Don't** redraw, recolor, extract, or imitate official Scouting marks or rank badges.
- **Don't** use the Wolf element outside the approved trademark or use the WOSM emblem.
- **Don't** fabricate pack photography, youth identities, testimonials, history, costs, dates, or leaders.
- **Don't** use generic app-card grids, glass panels, gradient chrome, or decorative icon bubbles.
