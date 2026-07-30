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

## Pull-request previews

Same-repository frontend pull requests use the protected GitHub `preview`
environment. Configure it separately from `production` with least-privilege,
preview-only credentials:

- `PREVIEW_CLOUDFLARE_ACCOUNT_ID`
- `PREVIEW_CLOUDFLARE_API_TOKEN`
- repository variable `CLOUDFLARE_ACCOUNT_SUBDOMAIN`

The preview reads production CMS data but disables contact submissions by
default. Set the protected `preview` environment variable
`PREVIEW_CONTACT_SUBMISSIONS_ENABLED` to `true` only when a real production
inquiry is intentionally allowed. Preview automation remains read-only.

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
