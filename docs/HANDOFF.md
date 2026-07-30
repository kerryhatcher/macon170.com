# Session Handoff — macon170.com (Pack 170 website)

_Written 2026-07-26, cutting session short due to usage limits. Read this first when resuming._

## Project goal

Astro static site for Cub Scout Pack 170, Macon GA, chartered by Highland Hills Baptist Church. Domain: macon170.com.

## Where things stand

### ✅ Done and committed

- **Research phase complete:** 5 docs in `docs/research/` (scouting-america, cub-scouting, highland-hills-baptist, macon-ga, trademark-brand-guidance) + `SYNTHESIS.md` (the designer's brief).
- **`docs/Official-info.md`** — HUMAN-WRITTEN canonical pack/council facts. Never edit without explicit instruction. Overrides research docs on conflict. Confirms: pack meets ~monthly, Tuesdays 6:30 PM at Highland Hills Baptist Church; dens set own times.
- **`PRODUCT.md`** — impeccable-skill product record, complete and current (includes user-confirmed decisions below).
- User corrected research errors: church is **Cooperative Baptist Fellowship (CBF), NOT Southern Baptist**; co-pastors **Rev. Caitlin Childers Brown & Rev. Ethan Brown** since July 2023; family-dens date June 1, 2023.

### ⚠️ INTERRUPTED MID-TASK: fact-check pass

Five Opus fact-check agents (one per research doc) were launched but the session ended before all finished. At handoff time only `highland-hills-baptist.md` showed edits. **On resume:**

1. Review `git diff`/`git log` on `docs/research/` to see which docs got fact-check corrections.
2. Re-run fact-checks for any doc that wasn't corrected: verify every claim/URL against primary sources (org's own current website ALWAYS outranks aggregators like FaithStreet — that's how the SBC error happened). Agents' briefs emphasized: fix in place, mark unverified claims, flag dead links ⚠️, never revert user corrections, never edit Official-info.md.
3. **Not yet done at all:** fact-check `SYNTHESIS.md` against the corrected topic docs (was deliberately queued after the topic docs to avoid racing their edits).
4. Commit corrections.

### ⬜ Not started: design/build phase

The **impeccable skill** flow was underway (user requires it for all design work — see memory):

- `context.mjs` ran; PRODUCT.md written (init complete).
- **Next step: load `~/.claude/skills/impeccable/reference/new-work.md`** to establish the visual world + surface concept, then build. Craft-floor reference (`reference/craft-floor.md`) loads immediately before writing UI code. After UI edits, run the detector: `node ~/.claude/skills/impeccable/scripts/detect.mjs --json <targets>`.
- No Astro scaffold exists yet. Nothing in the repo but docs + PRODUCT.md.

## User-confirmed decisions (do not re-ask)

1. **Homepage serves prospective AND current families equally.**
2. **Imagery:** official Scouting America Brand Center photos/artwork (user must register at scoutingwire.org Brand Center and download); build with clearly-marked image slots until then. No pack photos yet.
3. **macon170.com replaces `cubscoutpack170.square.site` as primary**; Facebook stays, linked.
4. **Unknown pack facts** (dues, roster, den structure, contact emails, event dates) = loud placeholders in ONE easy-to-edit data file. Meeting info is known (Official-info.md).
5. Verify UI changes visually with Playwright MCP, screenshots to gitignored `screenshots/` (user's global CLAUDE.md).

## Non-negotiable design constraints (from research — full detail in the two key docs)

- Read `docs/research/SYNTHESIS.md` (design brief) and `docs/research/trademark-brand-guidance.md` (§7 = ready-made do/don't policy) before designing.
- Palette: Cub Scout Blue `#003F87` + Gold `#FCD116` (primary-source confirmed); Macon accents sparingly. Gold never a text color. WCAG AA.
- Montserrat headlines; official marks unmodified only (fleur-de-lis favicon affirmatively recommended by brand policy); never extract the Wolf; never WOSM emblem; footer needs attribution + non-endorsement block (ready-made language in trademark doc §7 Do #5).
- Youth: first name + last initial only; own privacy-policy page; contact routes to multiple adults; no members-only areas.
- Say "Scouting America" / "Cub Scout Pack 170" — never "BSA"/"Boy Scout Pack" in fresh copy.

## Suggested resume order

1. Finish/verify fact-checks (incl. SYNTHESIS.md) → commit.
2. Invoke `impeccable` skill → new-work.md flow (visual world, homepage concept) → scaffold Astro → build pages per SYNTHESIS.md content architecture → detector + Playwright screenshots → commit per phase.
