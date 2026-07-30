# Cloudflare deployment and contact ownership

The public Astro site and the SonicJS CMS are independently deployed Workers.
Do not merge their Wrangler configuration, secrets, databases, migrations, or
deployment workflows.

## Ownership

| Surface                                                         | Owner                                           |
| --------------------------------------------------------------- | ----------------------------------------------- |
| `www.macon170.com` and `macon170.com`                           | Public Astro Worker                             |
| `admin.macon170.com`                                            | Public Worker redirect to the CMS contact queue |
| `api.macon170.com` and public-site `/api/*`                     | Closed with `404`                               |
| `cms.macon170.com/api/forms/contact/submit`                     | CMS contact submission handler                  |
| `cms.macon170.com/api/forms/contact/schema`                     | CMS public form schema                          |
| `cms.macon170.com/admin/forms/default-contact-form/submissions` | CMS-authenticated volunteer queue               |
| CMS calendar JSON, ICS, and editing                             | CMS                                             |

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

## Contact cutover

Deploy the CMS first only after separately configuring its
`TURNSTILE_SECRET` Worker secret. Apply the CMS core and custom migrations,
then verify:

- form schema version `pack-contact-v1`;
- allowed-origin CORS and preflight;
- missing-token rejection;
- CMS login protection;
- successful branded-form redirect;
- queue rendering, view audit, and each status transition.

Deploy the public frontend second. Browser-test the contact page at desktop and
mobile widths, Turnstile recovery, a successful submission, friendly error
redirects, and the `admin.macon170.com` redirect.

Before testing the admin redirect, obtain separate approval to remove or
disable the legacy Cloudflare Access application that covers
`admin.macon170.com/*`. Access evaluates the request before the Worker, so the
old application can challenge or deny visitors before the redirect runs. The
public-site deployment workflow deliberately does not remove that account-level
cloud resource.

Rollback is a frontend revert coordinated with an explicitly approved backend
rollback. Never dual-write. Do not delete or mutate the legacy D1 database as
part of rollback.

The CMS repository’s contact runbook documents its D1 schema, Turnstile
secret, rate limit, administrator access, retention cron, smoke checks, and
deployment order.
