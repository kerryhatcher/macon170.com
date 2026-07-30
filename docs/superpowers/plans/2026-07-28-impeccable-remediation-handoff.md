# Handoff: impeccable audit + critique remediation, stages 4-7

Date: 2026-07-28
Status: stages 1-3 shipped and deployed. Stages 4-7 remain.
Written for the next agent picking this up cold.

## What this is

An `/impeccable audit` (technical, scored 17/20) then an `/impeccable critique` (UX, scored 28/40)
were run against macon170.com. The audit's six findings were all fixed. The critique produced a
prioritized list, the user chose "everything then the P2s", and asked that each stage run `just ci`,
then commit, then push, deploying via GitHub Actions before the next stage starts. Three stages are
done. This document is the state of play.

The persisted critique snapshot is `.impeccable/critique/2026-07-28T07-20-56Z__src-pages.md`
(gitignored, machine-local — if it is missing, the report body is reproduced in the session
transcript only, so treat this handoff as the authority).

## Ground rules that bit me, so read these first

1. **Never switch branches in this working directory.** Multiple agents work here concurrently.
   `CLAUDE.md` forbids `git checkout/switch/stash/reset --hard/rebase/merge`, and a `PreToolUse`
   hook enforces it. Use a worktree if you need a branch. Committing on `main` is fine and expected.
2. **Stage explicit paths** (`git add <path>`), never `git add -A`. Other sessions have in-progress
   files here.
3. **`just ci` is the gate**, not `bun run build && bun run test`. It runs `lint`, `check`,
   `format:check`, `test`, `test:e2e`. `format:check` fails constantly if you do not run
   `bunx prettier --write` on files you touch — budget for it every stage.
4. **Conventional Commits, and write the message to a file** and use `git commit -F <path>`. A
   `$(cat <<'EOF')` command substitution makes the validator hook see the shell text as the subject
   and reject it.
5. **Pushing to `main` deploys to production**, including `wrangler d1 migrations apply
macon170-submissions --remote`. Check what is unpushed before your first push. I reported "5
   unpushed commits" from a `git log | head -10` that had silently truncated a list of 28; the real
   set included feature work and a D1 migration. Use `git rev-list --count origin/main..HEAD`.

## Environment specifics

- **`bun run dev:worker` does not work** — it needs `.dev.vars`, which is not in the repo (local
  secrets). `.dev.vars.e2e` _is_ present, so use **`bun run e2e:server`** for a full local stack
  (assets + worker API + local D1) on **port 8790**. `astro dev` alone (`bun start`, 4321) serves
  pages but has no API, so `/calendar/` renders its degraded state.
- **The local e2e D1 is empty.** To see the real thing, seed it from production:
  `curl -s https://www.macon170.com/api/events` → build an INSERT → `bunx wrangler d1 execute
macon170-submissions-e2e --local --config wrangler.e2e.jsonc --file <sql>`. Without this you are
  reviewing an empty-calendar state that production is not in.
- **`gh` needs help here:** `GH_HOST= gh run list --repo kerryhatcher/macon170.com ...`. Without
  clearing `GH_HOST` it fails with "failed to determine base repo".
- **Cloudflare serves stale HTML and ignores query strings** for asset matching, so `?cb=123` does
  _not_ bust the cache (`cf-cache-status: HIT`). Verify production with
  `curl -H 'Cache-Control: no-cache'`. I briefly believed a good deploy had failed because of this.
- **`graphify update .` currently refuses to write** ("new graph has 8522 nodes but existing has
  8576"), so `graphify-out/` is stale and `graphify query` returns skill-script nodes rather than
  `src/` for most questions. Do not trust it for orientation on this codebase; it needs `--force`,
  which risks discarding another session's chunks, so it was left alone. It is a real open item.
- **A live-server orphan is listening on :8400** from a different worktree
  (`.claude/worktrees/nitpicks/`, PPID 1, started 2026-07-27). Not from this work. PID was 45633.

## Traps in this codebase specifically

- **Astro scoped CSS never reaches `innerHTML`-built DOM.** Client-rendered markup does not carry
  the `data-astro-cid-*` attribute, so every scoped rule silently misses it. This has now bitten
  three times in this project. Scope through a server-rendered parent with `:global()`, e.g.
  `.timeline :global(.timeline__row)`. Watch the inverse too: `.timeline__note` is a _sibling_ of
  `.timeline`, so wrapping it as a descendant breaks it.
- **Astro collapses the newline between prose and a following inline tag at build time.** Source
  that looks correct across two lines renders as `school year.See what each den works on`. Use an
  explicit `{' '}`. Four instances existed; all are fixed. Guard with a build-time sweep:
  `grep -oE '[a-z,;:.]<(a |strong>|em>|b>)' dist/**/*.html` should return nothing.
- **The admin pages' CSS/JS/HTML are template literals in `worker/*.ts`.** Shared chrome now lives
  in `worker/desk-chrome.ts`; keep it one rule per line (a single-line stylesheet made the design
  detector pair borders and radii across unrelated selectors, producing phantom findings).
- **The design detector has one standing false positive**, `side-tab` at
  `src/pages/calendar/index.astro:459` — `.calendar-help__mark::before`, a checkmark drawn from two
  borders on a 0.95rem pseudo-element. Verified four times. It is _not_ suppressed, because
  suppression needs the user's explicit confirmation, and note `ignore-value --file` silently writes
  a dead config entry in impeccable 3.8.0 (write `{rule, value:"*", files:[...]}` by hand instead).
- **`craft-floor.md` bans a colored `border-left`/`right` above 1px** on cards, rows, callouts. I
  wrote one on the timeline rows and removed it; the category chip already names the category in
  text, which is better anyway. Do not reintroduce it.

## Stages 1-3: what shipped

All deployed and verified on production.

| Commit    | What                                                                                                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2bffb14` | `fix(ci)`: removed an unused `escapeHtml` import; formatted 5 files. Four of them were already unformatted on `HEAD`, so CI would have failed on the existing backlog regardless. |
| `87f9486` | `docs(calendar)`: the empty-first brief, `docs/superpowers/specs/2026-07-28-calendar-empty-first-design.md`. Read it before touching `/calendar/`.                                |
| `d1cc5c4` | `feat(calendar)`: rebuilt `/calendar/` as a program-year timeline. Extracted `src/lib/pack-year.ts` (+11 unit tests). Fixed the P0.                                               |
| `e6c3960` | `fix(copy)`: church FAQ answer open by default, drawn disclosure marker, four collapsed spaces.                                                                                   |

Earlier in the same session (the audit fixes): `5fe7a72` shared desk chrome + labelled state chips,
`e9384a4` contact-form `aria-describedby`, `1b9458e` font pruning + LCP preload, `77e3580`
reduced-motion + `color-scheme`, `491ea09` design-token documentation.

Two bugs found while building stage 2, both fixed, both worth knowing:

- The program year rolled over in **August**, so through July the four anchors sat a year behind the
  events — the page rendered "August 2025" above real August 2026 dates. Rollover is now **July**
  (`PROGRAM_YEAR_ROLLOVER_MONTH`), with a regression test pinned to 2026-07-28.
- A confirmed milestone showed both its season label and its real date, so `pinewood-derby` printed
  "LATE JANUARY" under a "February 2027" heading (the pack holds it at Scout Sunday, Feb 7). The
  season is now suppressed once a date exists.

## Remaining stages

### Stage 4 — phone-width verification (do this first)

**This is a verification gap, not a fix.** `/join/`, `/calendar/`, and `/contact/` have **never been
seen at 390px**, which is the primary case for the site's primary audience (a parent on a phone).
`/calendar/` is brand new and has only been viewed at desktop width.

`mcp__claude-in-chrome__resize_window` **had no effect** in three attempts this session — the
viewport stayed at 606x773 CSS px. Earlier desktop review was done inside a width-pinned iframe,
which drives real media queries but cannot reproduce a real scrollbar, sticky header, or viewport
units. **If resize fails again, say so plainly rather than reporting a mobile pass you did not do.**
Alternatives worth trying: a Playwright script with an explicit viewport (Playwright is already a
devDependency and `bunx playwright` works), or `mcp__plugin_playwright_playwright__browser_resize`.

Only run `/impeccable adapt` if this surfaces real defects. Do not assume it will.

Specific things to look at on a phone:

- The timeline's `.timeline__row--event` collapses to one column under 760px with the category chip
  moving below the title. Verify that actually reads well and the chip does not look orphaned.
- The header + gold strip consumed roughly 260 CSS px before the hero headline at 606px. Confirm at
  390px.
- `/contact/`'s Turnstile widget is force-scaled to 0.82 under 400px. Confirm the challenge is fully
  visible and tappable.

### Stage 5 — `/impeccable harden`: bind submit to the security widget

`src/pages/contact.astro` sets `disabled={!hasEndpoint}`, a server-side check only. Nothing binds the
submit button to Turnstile succeeding, so when the widget fails to load the parent gets an enabled
"Send securely to pack adults" that cannot work, and the page says nothing. This contradicts
DESIGN.md's Inputs rule that disabled actions "remain visible and name the missing connection".

The only other contact route on that page goes to Central Georgia Council, **not** Pack 170, so a
parent who hits this cannot reach this pack at all. On failure, show a Notice naming the problem and
offering the shared pack mailbox PRODUCT.md already establishes. Use Turnstile's
`error-callback`/`expired-callback`.

Note the widget legitimately fails on localhost, so a local failure is not evidence of a bug — the
defect is the unbound state, which is real in production too.

### Stage 6 — `/impeccable layout`: reading measure + a chapter index

The in-page detector found body copy exceeding the documented 65-72ch measure: 4 instances on `/`,
8 on `/dens/webelos/`. `--reading: 70ch` and `.measure` already exist in `src/styles/global.css` but
are not applied to prose on the Read surfaces, so the pages built for comprehension run widest.

`/what-is-cub-scouts/` is roughly 8712px tall at desktop width with no in-page index. It is the page
aimed partly at school administrators (it quotes the Bibb County 2023-28 strategic plan), so it
earns a chapter index at the top.

### Stage 7 — `/impeccable polish`

Carry the smaller consistency items from the critique:

- The six-badge rank strip appears on `/`, `/join/`, and `/dens/` and teaches two different
  affordances: the labels are links on `/dens/` and plain text on `/`.
- The green "✓" callouts and the gold "?" callout share one pill geometry with two different glyphs
  and the distinction is never explained.
- Footer "Community" links leave the site in the same underlined style as internal routes, with no
  visual external indication (the `externalLink` helper is applied, so this is visual only).
- The vertical dashed perforation between the hero columns reads as loose dashes rather than a fold.
- Montserrat carries 46-56% of rendered text. It is the display font by design, but on Read surfaces
  that share suggests labels and meta are encroaching on body territory.

## Open items that are not code

### The pack year's dates are now half-associated (user action, high value)

`calendar_events.milestone` links a published event to a milestone. As of 2026-07-28 production has
**10 published events, 2 associated**: `lego-derby` → "Lego Pinewood Derby & Cookout" (Aug 23) and
`pinewood-derby` → "Scout Sunday & Pinewood Derby Race" (Feb 7). `fall-camp` and `blue-gold` have no
event at all, so they correctly read "Dates to be added".

Associating an event is done in the calendar editor's **Milestone** dropdown at
`admin.macon170.com/calendar`. **Do not infer associations from event titles** — the
milestone-event-association spec deliberately removed keyword matching, and which event _is_ a given
milestone is a pack fact for pack leadership, not something to guess. Do not write to the production
database on the user's behalf.

### The Lego Pinewood Derby, and why it opens the year

Cubmaster-confirmed 2026-07-28, recorded in `src/data/pack.ts` above `annualProgram` and in
PRODUCT.md's Operating Context:

The cars are built **out of Lego at the event itself**, on the same track, setup, and tournament
rules as the real Pinewood Derby in late January. The January derby needs a wooden car built at home
beforehand, which a family that has just heard of the pack cannot have. Building on the spot lets a
prospective or brand-new Scout join the build instead of arriving empty-handed, and the kids iterate
on designs during the event. It is a genuine dry run of the January experience, not a toy substitute
for it — which is precisely why it works as the pack's recruiting event.

**This is currently absent from all visitor-facing copy** and it is the strongest recruiting argument
the pack has for audience #1. The site says only "Lego Pinewood Derby" as a milestone title; there is
no `activities` entry for it (`src/data/pack.ts` has one for `pinewood-derby` only). A proposed
sentence was drafted but **not published**, because writing new claims about the pack's program needs
the user's sign-off under PRODUCT.md's placeholder policy. Offer it; do not ship it unasked.

### Things deliberately not done

- The `?include=past-milestones` API parameter and the "Held this year" completed state. The brief
  specifies them and `pack-year.ts` already computes `done`, but `GET /api/events` returns only
  future events, so `done` can never currently be true. This is additive work, scoped out of stage 2.
- The `/calendar/` den/pack/family filter. Specified in the brief (the user expects 15-40 events a
  year). Must narrow the ordinary rows and **never** hide a milestone anchor.
- The five-bullet "Open the event before you load the car" panel still renders when there are no
  event cards to read. The brief says it should not.

## Verification commands

```bash
just ci                                    # the real gate
git rev-list --count origin/main..HEAD     # what a push would deploy
node .claude/skills/impeccable/scripts/detect.mjs src worker   # expect exactly 1 known false positive
GH_HOST= gh run list --repo kerryhatcher/macon170.com --branch main --limit 3
curl -s -H 'Cache-Control: no-cache' https://www.macon170.com/calendar/   # bypass the edge cache
```

Do not re-run `node .claude/skills/impeccable/scripts/context.mjs` if a session already has; it is
once per session. `CONTEXT_STALE` reported one `auto` finding (the design sidecar's legacy path) —
the sidecar stays at root `DESIGN.json` **on purpose**; the offered migration into gitignored
`.impeccable/` is declined and should stay declined, since `.gitignore:162` would make it silence
findings on one machine only.
