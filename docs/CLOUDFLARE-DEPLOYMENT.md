# Cloudflare deployment and contact ownership

The public Astro site and the SonicJS CMS are independently deployed Workers.
Do not merge their Wrangler configuration, secrets, databases, migrations, or
deployment workflows.

## Ownership

| Surface                                                         | Owner                             |
| --------------------------------------------------------------- | --------------------------------- |
| `www.macon170.com` and `macon170.com`                           | Public Astro Worker               |
| `cms.macon170.com/api/forms/contact/submit`                     | CMS contact submission handler    |
| `cms.macon170.com/api/forms/contact/schema`                     | CMS public form schema            |
| `cms.macon170.com/admin/forms/default-contact-form/submissions` | CMS-authenticated volunteer queue |
| CMS calendar JSON, ICS, and editing                             | CMS                               |

The public Worker has only an `ASSETS` binding. It has no D1, rate-limit, cron,
Turnstile secret, or Cloudflare Access configuration.

## Legacy database

The production `macon170-submissions` D1 database is retained untouched and
read-only. Its migrations remain in this repository as history, but the public
workflow does not apply them and the Worker does not bind, read, write, migrate,
or delete that database. The two existing test rows are not migrated or
removed.

Do not restore the old contact routes or dual-write the public and CMS
databases. An authorized export may be taken for recovery without reconnecting
the database to the Worker.

## Public-site deployment

Configure only these GitHub `production` environment secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` with the minimum Worker deployment and route scope

The workflow installs locked dependencies, runs `just ci`, builds, performs a
Wrangler dry run, deploys the Worker/static assets, and runs the production
Turnstile-state browser check. It does not apply D1 migrations or upload a
Turnstile secret.

Local setup needs no `.dev.vars`:

```bash
bun install --frozen-lockfile
bun run dev:worker
```

## Redirect rules

URL canonicalization lives in Cloudflare Redirect Rules, not in the Worker. Redirect Rules execute
before Workers in Cloudflare's request pipeline, and the trailing-slash 307 is emitted by the
static-asset handler _after_ the Worker delegates to `env.ASSETS.fetch` — so neither redirect could
be fixed in `worker/index.ts` without intercepting every asset request.

This is unversioned dashboard state. **These two rules are load-bearing; record any change here.**
Zone `macon170.com` = `02444593a477496a8f085e83184670f9`. Deployed 2026-07-30.

Cloudflare stops at the first matching rule, so at most one redirect is issued per request pass.
Order matters.

### Rule 1 — "www and tls" (order: first)

Canonicalizes scheme and host together. Splitting these into the two Cloudflare templates
(`Redirect from HTTP to HTTPS` + `Redirect from root to WWW`) was measured at three hops for
`http://macon170.com/join`; combining them gives two.

```
Expression:            (http.host eq "macon170.com") or (http.host eq "www.macon170.com" and not ssl)
Type:                  Dynamic
Target:                concat("https://www.macon170.com", http.request.uri)
Status:                308
Preserve query string: OFF
```

`http.request.uri` already carries path _and_ query, so preserving the query string here would
append it a second time.

**The expression names both hostnames on purpose. Do not rewrite it as "anything that is not
www."** Redirect Rules are scoped to the whole `macon170.com` **zone**, which includes every
subdomain. This rule originally read `(not ssl or http.host ne "www.macon170.com")`, which matched
`cms.macon170.com` and rewrote the CMS onto the public site — taking down the contact form, the
calendar feed, and the leadership roster for about an hour on 2026-07-30 before it was caught. Any
host-matching predicate here must enumerate hosts rather than negate one.

`e2e/redirects.live.spec.ts` guards this: it asserts no CMS path is ever host-rewritten onto
`www.macon170.com`. Note the CMS does legitimately redirect on its own — `/` sends you to
`/auth/login`, and the contact endpoint 303s to `https://www.macon170.com/contact/?error=...` as
part of the branded-form flow — so the test checks for the exact outage signature (same path,
rewritten host) rather than for any redirect at all.

This rule does not upgrade `http://cms.macon170.com` — Rule 3 does.

### Rule 2 — "Trailing slash" (order: last)

Replaces the asset handler's 307 with a permanent 308.

```
Expression:            (http.host eq "www.macon170.com"
                        and not ends_with(http.request.uri.path, "/")
                        and not http.request.uri.path contains ".")
Type:                  Dynamic
Target:                concat("https://www.macon170.com", http.request.uri.path, "/")
Status:                308
Preserve query string: ON
```

The `contains "."` guard keeps static assets (`/favicon.svg`, `/_astro/*.css`, `/logo/*.png`) from
acquiring a trailing slash. Preserve-query-string is ON here because the target rebuilds from
`http.request.uri.path`, which omits the query.

### Rule 3 — HTTP to HTTPS (order: last)

Cloudflare's built-in template, matching `http://*` across the zone and preserving the host:

```
Match:   URI Full wildcard  r"http://*"
Action:  301 redirect to wildcard_replace(http.request.full_uri, r"http://*", r"https://${1}")
```

It exists to upgrade `cms.macon170.com`, whose admin login and API were reachable over cleartext
until 2026-07-30. It covers any future subdomain for free.

**Order matters: it must stay last.** Rules 1 and 2 match apex and www first and stop evaluation,
so the public-site chain stays at two hops. Promoting this rule to first would insert a scheme-only
hop ahead of the host canonicalization and push `http://macon170.com/join` back to three.

Enabling the zone-level **Always Use HTTPS** setting would have the same three-hop effect, since it
runs ahead of Redirect Rules. Leave it off.

This rule preserves the host, so it cannot rewrite one host onto another — which is why a broad
`http://*` match is safe here even though a broad match in Rule 1 was not.

One asymmetry to know about: this template issues **301**, while rules 1 and 2 issue 308. A 301
permits a client to downgrade a POST to GET on redirect. Nothing in this site posts to an
`http://` CMS URL — the contact form's action is the `https://` endpoint — so it is not a live
concern, only something to weigh before pointing any new POST at a cleartext CMS URL.

### Verifying

```bash
# worst case: 2 hops, both 308
curl -sIL http://macon170.com/join -o /dev/null -w '%{num_redirects} %{url_effective}\n'
# query survives exactly once
curl -sIL "http://macon170.com/join?a=1" -o /dev/null -w '%{url_effective}\n'
# assets must not redirect
curl -sI https://www.macon170.com/favicon.svg -o /dev/null -w '%{http_code}\n'
# CMS: upgraded to https, host preserved, never rewritten onto www
curl -sI http://cms.macon170.com/api/calendar/v1/events | grep -i location
curl -sI https://cms.macon170.com/api/calendar/v1/events | grep -iE '^HTTP/'
```

`e2e/redirects.live.spec.ts` asserts all of the above; run it with `bun run test:live`.

## Calendar freshness

`/calendar/` and the pack strip that appears on every page are rendered from a **build-time** fetch
of `https://cms.macon170.com/api/calendar/v1/events`. Publishing or editing an event in the CMS
therefore does not change the deployed site until it rebuilds.

This is deliberate. Crawlers do not reliably execute JavaScript, so a runtime-only fetch left
eleven published events invisible to search and put the placeholder "The next date is being added"
on every page. Build-time rendering is what makes the dates crawlable.

**Visitors are not affected by staleness.** The client scripts in `PackStrip.astro` and
`src/pages/calendar/index.astro` still re-fetch after load and replace what the build rendered, so a
browser always shows current data. Only crawlers see the build-time snapshot — which is the audience
this design targets.

### Keeping it fresh

- **The CMS should call a Cloudflare deploy hook when an event is published or edited.** That hook
  lives in the CMS repository and the Cloudflare dashboard, not here.
- **A scheduled nightly rebuild is the safety net.** If the hook breaks, staleness is bounded at
  roughly a day instead of lasting indefinitely and silently.

### When the fetch fails

The build never fails on a CMS problem — a build that died because a third-party API blipped would
block every unrelated deploy. It degrades instead: the calendar falls back to the milestone spine
and the strip keeps its placeholder.

Because that degradation is invisible in the output, both call sites log a warning, and **those
warnings are the signal to watch in CI**:

```
[calendar]   build-time event fetch failed; shipping the milestone spine with no dates: ...
[pack-strip] build-time next-event fetch failed; keeping the placeholder: ...
```

A build that emits either line succeeded but shipped an empty calendar. Treat it as a failure worth
investigating, not a warning to scroll past.

One non-obvious trigger: `getCalendarEvents()` both retrieves _and_ validates, mapping
`validateCalendarEvent` over the whole list (`src/lib/calendar-client.ts`). A single malformed
record — a bad slug, revision, or classification — rejects every event, not just the bad one. In
practice a volunteer saving an unusual event is a likelier cause of these warnings than the CMS
being down.

## Contact cutover

Before changing the public frontend, confirm the CMS contact migration is
merged, its production deployment is green, and its live smoke checks pass.
Configure the CMS `TURNSTILE_SECRET` Worker secret separately, apply the CMS
core and custom migrations, then verify:

- form schema version `pack-contact-v1`;
- allowed-origin CORS and preflight;
- missing-token rejection;
- CMS login protection;
- successful branded-form redirect;
- queue rendering, view audit, and each status transition.

Deploy the public frontend second. Browser-test the contact page at desktop and
mobile widths, Turnstile recovery, a successful submission, and friendly error
redirects.

The deployed Worker configuration removes the unused `admin.macon170.com` and
`api.macon170.com` custom domains. Separately remove the legacy Cloudflare
Access application for `admin.macon170.com/*`; that account-level resource is
intentionally outside the public-site deployment workflow.

Rollback is a frontend revert coordinated with an explicitly approved backend
rollback. Never dual-write. Do not delete or mutate the legacy D1 database as
part of rollback.

The CMS repository’s contact runbook documents its D1 schema, Turnstile
secret, rate limit, administrator access, retention cron, smoke checks, and
deployment order.
