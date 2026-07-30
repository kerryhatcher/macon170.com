# SEO Audit Remediation — Design

**Date:** 2026-07-30
**Source:** `docs/seo/seo-audit-2026-07-30.md` (score 57/100; 3 Critical, 5 High, 9 Medium)
**Status:** Approved for planning

## Goal

Close the three near-total gaps the audit identified — no structured data, no crawl-discovery
infrastructure, no HTTPS enforcement — and make the pack's event dates visible to search engines.
Success is measured by the audit's own falsifiability checks, restated per phase below as
acceptance criteria.

## Corrections to the audit

The audit was fact-checked against the live site and this codebase before planning. Five claims
were wrong or incomplete, and the plan deviates from the report accordingly. Recording them here
so the deviations are not mistaken for oversights.

1. **Finding #4 is not a data or fetch bug.** "The next date is being added" is the hardcoded
   server-rendered fallback at `src/components/PackStrip.astro:14`, replaced by client JS at line
   33. Crawlers and `curl` always see the placeholder regardless of whether events exist. The fix
   is architectural (Phase 3), not a bug fix.

2. **Finding #5 understates the scope.** `PackStrip` is rendered from `BaseLayout.astro:54` with
   `showStrip` defaulting to `true`, and no page ever overrides it. `getCalendarEvents()` therefore
   fires on all 14 routes, plus a second time on `/calendar` from its own script
   (`calendar/index.astro:215`). It is not a `/calendar`-only defect.

3. **The Event JSON-LD appendix rests on a false premise.** `src/data/pack.ts:123` is
   `export const events: PackEvent[] = []` and is permanently empty by design. Real events live in
   `cms.macon170.com`, fetched at runtime by `src/lib/calendar-client.ts:30`. With
   `output: 'static'` there is no build-time event data to render, so Event schema requires the
   architectural change in Phase 3 rather than a template edit.

4. **robots.txt is not in the repository.** No `public/robots.txt` exists. The live file is
   Cloudflare's managed *AI content signals* file, auto-injected because the origin returns 404.
   "Template comments with no values set" is that feature's default output, not an unfinished edit.
   Fixing it means shipping our own file, which displaces the managed one.

5. **The LCP element is text, not an image.** `BaseLayout.astro:11-14` documents that the
   `ChapterHero` `<h1>` is the LCP element on every route. The audit's `fetchpriority="high"`
   recommendation targets `index.astro:115`, which is `loading="lazy"` and below the fold — adding
   `fetchpriority` there would compete with the actual LCP path. Critical-CSS inlining, which the
   audit also recommends, is the correct and only fix. The `fetchpriority` and hero-image-weight
   items are dropped.

Claims verified as accurate and actionable: HTTP `www` returns 200 with no redirect; `/join`
returns 307; zero security headers on HTTPS; `cache-control: public, max-age=0, must-revalidate`
on all assets; `/sitemap.xml` returns 404; no Open Graph tags anywhere; 10 of 13 meta descriptions
under 120 characters; only the homepage title contains "Macon".

Page-count math confirmed: 13 static routes + 6 generated den pages = 19 total, minus `/events/`
= **18 indexable pages**, matching the audit's expected sitemap count.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Event indexability | Build-time fetch + CMS deploy hook | Keeps `output: 'static'`; real dates land in crawlable HTML; follows the existing `about.astro:37` precedent |
| AI content signals | `search=yes, ai-input=yes, ai-train=no` | Maximize discoverability for parents searching, including AI assistants; withhold training-corpus use |
| CSP rollout | Report-Only first, enforce after Phase 5 | A strict `style-src 'self'` would break the critical-CSS inlining that Phase 5 introduces |

## Phase 1 — Worker and edge

All changes in `worker/index.ts` (currently 27 lines, one redirect).

**Changes**

- **HTTP → HTTPS.** Redirect with 308 when the request scheme is `http:`, mirroring the existing
  apex-hostname redirect at line 5.
- **307 → 308 trailing slash.** Normalize extensionless paths to trailing-slash with a 308 in the
  Worker before delegating to `env.ASSETS.fetch`. `run_worker_first: true` in `wrangler.jsonc`
  means the Worker gets first handling, so the asset handler's 307 never fires.
- **Security headers** on HTML responses: `Strict-Transport-Security`, `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, and `Content-Security-Policy-Report-Only`.
- **Cache-Control.** `/_astro/*` and `/logo/*` get `public, max-age=31536000, immutable`
  (filenames are content-hashed, so this is safe). HTML keeps `must-revalidate`.

**CSP allowlist**, derived from origins actually referenced in `src/` and `worker/`:

- `script-src`: `'self'`, `https://challenges.cloudflare.com` (Turnstile)
- `frame-src`: `https://challenges.cloudflare.com`
- `connect-src`: `'self'`, `https://cms.macon170.com`
- `img-src`: `'self'`, `data:`
- `font-src`: `'self'`
- `default-src`: `'self'`

Remaining external origins found in source (`scouting.org`, `facebook.com`,
`centralgeorgiacouncil.org`, `highlandhillsbaptist.org`, `bcsdk12.net`) are outbound anchor hrefs,
which CSP does not govern. No allowlist entry needed.

**Open question to resolve during implementation:** whether a Worker on a Cloudflare custom domain
observes `http:` in `request.url`, or whether TLS termination rewrites it. If the Worker cannot see
the original scheme, fall back to the zone-level "Always Use HTTPS" setting and document it in
`docs/CLOUDFLARE-DEPLOYMENT.md`. An e2e test settles this before the rest of the phase is written.

**Acceptance criteria**

- `curl -I http://www.macon170.com/` returns 308 to `https://`
- `curl -I https://www.macon170.com/join` returns 308, not 307
- All five security headers present on the HTTPS HTML response
- `/_astro/*` responses carry `max-age=31536000, immutable`
- Existing Playwright e2e suite passes with no new console CSP violations

## Phase 2 — Crawl discovery

**Changes**

- `bun add @astrojs/sitemap`; register in `astro.config.mjs` with a filter excluding `/events/`.
  Generating from Astro's route manifest avoids the drift a hand-written file would accumulate.
- `public/robots.txt`:

  ```
  User-agent: *
  Allow: /

  Content-Signal: search=yes, ai-input=yes, ai-train=no

  Sitemap: https://www.macon170.com/sitemap-index.xml
  ```

  This displaces Cloudflare's managed file, which only serves while the origin 404s.
- Add an optional `noindex` prop to `BaseLayout.astro`; set it on `src/pages/events/index.astro`.

**Two corrections to the originally proposed robots.txt**

1. **No `Disallow: /events/`.** Disallowing a path prevents crawlers from fetching it, which means
   they never see its `noindex` meta tag — the URL can still surface in results as a bare,
   description-less link. `Disallow` and `noindex` are mutually exclusive tools. Since the goal is
   de-indexing rather than crawl budget (18 pages), `noindex` alone is correct and `/events/` must
   remain crawlable for it to work.

2. **`Sitemap:` points at `/sitemap-index.xml`, not `/sitemap.xml`.** `@astrojs/sitemap` emits an
   index plus numbered child files; nothing is served at `/sitemap.xml`. This supersedes the audit's
   falsifiability check, which assumed a single flat file. If a flat `/sitemap.xml` is preferred for
   familiarity, the integration's `filenameBase` option can be set, but the index form is the
   package default and needs no configuration.

**Acceptance criteria**

- `/sitemap-index.xml` returns 200, and its child sitemap contains exactly 18 `<url>` entries
- `/events/` is absent from the sitemap, serves `<meta name="robots" content="noindex">`, and is
  **not** disallowed in robots.txt
- `/robots.txt` serves our file, not Cloudflare's managed one

## Phase 3 — Build-time events and structured data

The substantive phase. Follows the `about.astro:37` precedent: build-time `fetch` with a 5-second
timeout and a graceful fallback, so a CMS outage degrades the build rather than failing it.

**Changes**

- `src/pages/calendar/index.astro` — call `getCalendarEvents()` in frontmatter. Render timeline
  rows server-side and emit `Event` JSON-LD. Keep the existing client script as a freshness
  refresh, not the sole renderer. The existing `render()` logic is reused, not duplicated: the
  row-building functions move to a module both the frontmatter and the client script import.
- `src/components/PackStrip.astro` — accept the next event as a prop resolved at build time so the
  crawlable HTML carries a real date instead of the line-14 placeholder. Keep the client refresh.
- **Duplicate-fetch fix falls out of this.** Once both render at build time, the client side
  collapses from a fetch per component per page to one shared refresh.
- `src/layouts/BaseLayout.astro` — site-wide `Organization` JSON-LD, using the audit's Appendix
  block with `logo` set to `https://www.macon170.com/logo/pack170-logo-512.png` (verified 512×512,
  above the 112px minimum). No `address` on the org block: the church's address must not be
  attributed to the Pack as an org location.
- `src/pages/dens/index.astro` and `src/pages/dens/[den].astro` — `BreadcrumbList` JSON-LD.

**Ops dependency (outside this repository):** a Cloudflare deploy-hook URL invoked by
cms.macon170.com when an event is published or edited. Without it, dates go stale between builds.
A scheduled nightly rebuild is added as a safety net so a broken webhook degrades gracefully
instead of silently. Document the hook in `docs/CLOUDFLARE-DEPLOYMENT.md`.

**Acceptance criteria**

- Google Rich Results Test on `/` and `/calendar` shows valid `Organization` and `Event` entities
  with no errors
- `curl https://www.macon170.com/calendar/` contains real event dates in the HTML response body
- The string "The next date is being added" does not appear in served HTML when a future event
  exists in the CMS
- Network tab on a fresh `/calendar` load shows at most one `GET /api/calendar/v1/events`
- A den page's HTML contains a valid three-item `BreadcrumbList`

## Phase 4 — On-page and social

**Changes**

- Open Graph and Twitter Card tags in `BaseLayout.astro` (currently zero across the site).
- Generate a 1200×630 OG image from existing logo assets. The 1024×1024 square crops badly at
  social aspect ratios, so it is not reused directly.
- Add "Macon" to the `/about`, `/calendar`, and `/contact` titles. The homepage already has it.
- Raise the 10 meta descriptions currently under 120 characters into the 120–160 band.

**Acceptance criteria**

- `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, and `twitter:card` present on
  every page
- OG image resolves to a 200 and is 1200×630
- All page meta descriptions fall within 120–160 characters
- `/about`, `/calendar`, `/contact` titles contain "Macon"

## Phase 5 — Performance

Critical-CSS inlining for the `ChapterHero` `<h1>` LCP, currently gated on render-blocking CSS
shared via `BaseLayout.astro`.

**Measure before choosing a tool.** `beasties` / `astro-critters` add build complexity, and because
the CSS is a single shared bundle, hand-inlining the above-fold rules may be both smaller and more
predictable. The implementation plan should include a measurement step whose result selects the
approach, rather than committing to a tool up front.

Also add `<link rel="preconnect">` to `cms.macon170.com`. Its value drops once Phase 3 makes the
client fetch a refresh rather than the critical path, but it remains correct.

After this phase settles, promote `Content-Security-Policy-Report-Only` to enforcing
`Content-Security-Policy`, adding style hashes or a nonce for whatever inline CSS the chosen
approach emits.

**Acceptance criteria**

- Lighthouse mobile LCP on `/` and `/calendar` moves toward ≤2.5s from the current ~3.1–3.2s
- `preconnect` hint present before the client-side calendar fetch
- CSP enforcing with no violations in the e2e suite

## Phase 6 — Requires the pack, not code

Flagged for humans; no pull request.

- Four blank den-leader names (Tiger, Wolf, Bear, Arrow of Light) in the CMS leadership roster.
  Likely genuinely vacant volunteer roles, but should be confirmed rather than left ambiguous.
- BeAScout unit-locator zip `31201` in `pack.ts:45` vs the stated address zip `31211`. May be a
  search-radius parameter rather than a mismatch.
- Legacy domain consolidation (`pack170.org`, `cubscoutpack170.square.site`) — decide whether to
  consolidate NAP or redirect and deprecate. Requires account access.
- Optional: Moz or Bing Webmaster backlink API key to unlock DA/PA data.

## Out of scope

Dropped deliberately, with reasons:

- **IndexNow** — marginal ROI at 18 pages.
- **htmldate `2026-01-01` freshness artifact** — a tooling artifact, not user-facing.
- **Nav active-state styling and `/join` mobile CTA position** — design questions the audit itself
  scored as non-issues, not SEO defects.
- **`fetchpriority="high"` and hero-image weight** — target a non-LCP, below-the-fold, lazy-loaded
  image. See correction 5.
- **FAQPage schema** — no Google SERP benefit as of May 2026. If genuine parent Q&A content is
  ever added, mark it `QAPage`.

## Risks

| Risk | Mitigation |
|---|---|
| Worker may not observe the original `http:` scheme | Resolve with an e2e test in Phase 1; fall back to the zone-level "Always Use HTTPS" setting |
| Build-time CMS fetch makes builds depend on CMS availability | 5s timeout with graceful fallback, matching `about.astro:37`; build degrades rather than fails |
| CMS deploy hook is outside this repo and may not get wired up | Scheduled nightly rebuild as a safety net |
| Enforcing CSP could break Turnstile on `/contact` | Report-Only first; existing Playwright Turnstile e2e specs validate before enforcing |
| Phase 5's win may be smaller than the audit implies | Measurement step gates tool selection; phase is scoped last and can be cut |

## Sequencing

Phases 1 and 2 have no content dependency and can ship the same day. Phase 3 is the highest-value
work but carries the ops dependency. Phase 4 is independent of 1–3 and can land in parallel.
Phase 5 is measured after 1–4 land. Phase 6 is handed to the pack.
