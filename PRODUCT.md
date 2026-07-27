# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary audiences, weighted equally (user-confirmed):

1. **Prospective families** — a Macon-area parent of a K–5 child who just heard about Cub Scouts (from a friend, school flyer, or BeAScout) and needs to answer in under two minutes: what is this, does my kid qualify, when/where do you meet, what does it cost, how do I join. Mostly on phones.
2. **Current pack families** — returning for the calendar (the most-used page), event details, leader contacts, and resources.

Secondary, internal (user-confirmed as an ops surface, not a third design priority): **adult pack volunteers** working the private desk at `admin.macon170.com` — answering parent inquiries, publishing calendar events, and maintaining the leadership roster. Design attention belongs on the public site; the desk must be correct, clear, and functional rather than expressive.

## Product Purpose

The official website for Cub Scout Pack 170 of Macon, Georgia (macon170.com) — a Cub Scouting unit of Scouting America under the Central Georgia Council, chartered by Highland Hills Baptist Church. The site replaces the pack's existing `cubscoutpack170.square.site` as the primary web presence (user-confirmed); the pack's Facebook page remains and is linked. Success = new-family signups initiated (BeAScout/contact) and current families reliably finding event info.

## Positioning

The neighborhood pack, plainly local: Macon's own Pack 170, meeting in the historic Shirley Hills area of East Macon, serving boys and girls K–5. A volunteer-run pack site written like a fellow parent — not a corporate program page. No other unit can truthfully claim this pack's people, place, and calendar.

## Operating Context

- Program year runs fall–spring: Join Scouting Night (fall), popcorn fundraiser (Sep–Nov), Pinewood Derby (late Jan), Blue & Gold Banquet (Feb), crossover (spring), summer camp.
- **Pack meetings: roughly monthly, Tuesdays 6:30 PM at Highland Hills Baptist Church** (per `docs/Offical-info.md`, the human-written canonical source for pack/council facts — never edited by agents). Dens set their own times; many meet at the church for an hour before the pack meeting.
- Six ranks by grade: Lion (K), Tiger (1), Wolf (2), Bear (3), Webelos (4), Arrow of Light (5). Arrow of Light is a standalone 5th-grade program since June 2024.
- Chartered organization: Highland Hills Baptist Church, 1370 Briarcliff Rd, Macon GA 31211 (Shirley Hills neighborhood) — a Cooperative Baptist Fellowship congregation (user-corrected; earlier research wrongly said SBC). Official site: highlandhillsbaptist.org.
- Council: Central Georgia Council #96, Macon (Ocmulgee District). Local Scout Shop at 4335 Confederate Way.
- Research corpus: `docs/research/SYNTHESIS.md` (design brief), `docs/research/trademark-brand-guidance.md` (binding brand/legal rules), plus four topic files. `docs/Offical-info.md` overrides all research docs where they conflict.

## Capabilities and Constraints

- Astro, deployed as a single Cloudflare Worker serving static assets plus a small API. Not a purely static site: D1 (`macon170-submissions`) backs the contact inbox and the calendar; Turnstile guards the public form; a daily cron prunes submissions after 365 days. Public traffic on `www.macon170.com` (apex redirects); `admin.macon170.com` is the volunteer desk. See `docs/CLOUDFLARE-DEPLOYMENT.md`.
- **Volunteer desk access:** Cloudflare Access, deny-by-default allowlist of approved adult volunteer emails, one-time PIN, short sessions. The Worker independently verifies every Access JWT (issuer, JWKS, audience) — the hostname gate is not the only check. Every detail view and status change writes an audit row tied to the verified Access email.
- **Placeholder policy (user-confirmed, evolving):** pack-specific facts not in `docs/Offical-info.md` are never invented. Facts a volunteer can maintain (leadership roster, calendar events) move to D1 and are edited in the desk — no git, no deploy. The clearly-marked single-file placeholder pattern (`src/data/`) remains for facts that have no editor yet (dues, den structure, contact emails). Meeting info IS known (see Operating Context).
- **Brand/trademark rules (binding, see trademark-brand-guidance.md):** official Scouting artwork used unmodified only, from the Brand Center; fleur-de-lis affirmatively recommended as icon/favicon; never extract the Wolf element; never use the WOSM World Scout Emblem; no recoloring/effects on marks; footer attribution + non-endorsement block required; no ads or merchandise sales; don't reproduce Supply Group publications.
- **Youth protection (binding):** youth identified by first name + last initial only; no youth photos without consent; site needs its own privacy policy page naming a webmaster contact; all contact channels reach multiple adults, parent-framed. **All family-facing content is public — there is no members-only site.** The single gated surface is adult-volunteer administration, which holds no youth data: the contact form tells parents not to submit a child's name, the roster schema has no adult email column, and the public calendar API exposes only published family logistics, never volunteer identities or audit metadata. Volunteers reply from an approved shared pack mailbox, never a private one-to-one youth channel.
- Naming: "Cub Scout Pack 170" / "Pack 170, Scouting America" — never "Boy Scout Pack" or bare "BSA" in fresh copy.
- Charter relationship to Highland Hills Baptist Church is confirmed by pack leadership (`docs/Offical-info.md`); the pack meets there. Acknowledgment copy should still be easy to update.

## Brand Commitments

- Cub Scout Blue `#003F87` and Gold `#FCD116` (primary-source confirmed Screen Usage values) anchor the palette; Macon accents (cherry-blossom, river green, brick red) sparingly.
- Montserrat for headlines (free, brand-adjacent); warm readable body sans.
- Patch/badge aesthetic as core motif (echo, never reproduce, rank insignia).
- Imagery (user-confirmed): official Scouting America Brand Center photo library until pack photos exist — user must register and download; build with clearly-marked image slots.
- Domain macon170.com deliberately contains no Scouting mark; keep it that way.

## Evidence on Hand

- Five research documents in `docs/research/` with primary-source citations.
- Verified pack and council facts: `docs/Offical-info.md` (canonical, human-written, never edited by agents).
- Partial real leadership roster in `src/data/leadership.md` — Cubmaster, Committee Chair, Chartered Organization Representative, and two den leaders are real and named; the remaining den leader rows are deliberately empty and must stay empty until filled by leadership.
- Still absent and never to be fabricated: pack photos, testimonials, dues amounts, and dated calendar events. Real assets (Brand Center artwork/photos, pack facts) come from the user later.

## Product Principles

1. **A parent on a phone decides in 90 seconds** — meeting time, place, cost, and a Join path must never be more than one tap away.
2. **Compliance is a feature, not a footnote** — youth-protection and trademark rules are hard constraints baked into structure, not retrofitted.
3. **Placeholders are loud, real facts are easy** — anything unknown is visibly placeholder; anything a volunteer owns is editable without a developer, in the desk or in one marked file. Nothing unknown is ever presented as fact.
4. **Local beats generic** — Macon and Shirley Hills specificity is the differentiator over any template pack site.
5. **Warm, plainspoken, welcoming to every family** — girls and boys, all backgrounds; explicitly counter the assumption that a church-chartered unit is members-only.

## Accessibility & Inclusion

WCAG AA contrast throughout; gold is never a text color. Parents reading on phones outdoors — generous type sizes. Site must read as obviously welcoming to girls and all family backgrounds.
