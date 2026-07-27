# Cloudflare deployment and volunteer access

The site deploys as one Cloudflare Worker with Astro static assets, a D1-backed contact API, and a private volunteer desk. Public traffic uses `www.macon170.com`; the apex `macon170.com` permanently redirects to `www`; volunteers use `admin.macon170.com` behind Cloudflare Access.

## Resources already created

- D1 database: `macon170-submissions`
- D1 ID: `30e2d4be-5f6d-4f52-827d-c050c2ade104`
- Turnstile site key: `0x4AAAAAAD-sr-Bk7AntxyZ7`
- Turnstile widget domains: `macon170.com`, `www.macon170.com`

Local and automated development uses Cloudflare’s documented test widget keys rather than allowing production credentials on localhost.

The Turnstile secret is intentionally absent from source control. Store it in GitHub Actions and as a Worker secret.

## 1. Finish Cloudflare Access

In **Zero Trust → Access controls → Applications**:

1. Create a **Self-hosted and private** application.
2. Add the public hostname `admin.macon170.com` with path `*`.
3. Add an **Allow** policy containing only the volunteer email addresses approved by pack leadership. Access is deny-by-default; do not use an `Everyone` allow rule.
4. Enable **One-time PIN** as the initial login method.
5. Set a conservative session duration such as 8 hours. Require volunteers to reauthenticate rather than leaving multi-week sessions on shared family devices.
6. Copy the application’s **Application Audience (AUD) Tag**.
7. Find the team domain under Zero Trust settings. It has the form `https://YOUR-TEAM.cloudflareaccess.com`.
8. Replace the two placeholders in `wrangler.jsonc`:
   - `ACCESS_TEAM_DOMAIN`
   - `ACCESS_AUD`
9. Run `npm run cf:types` and commit the regenerated `worker-configuration.d.ts`.

The Worker verifies every Access JWT using Cloudflare’s rotating JWKS, issuer, and application audience. Cloudflare Access in front of the hostname is necessary but not the only check.

### Access validation checklist

- An allowlisted volunteer receives the one-time PIN and can open the desk.
- A non-allowlisted address receives an Access denial.
- Opening `/api/admin/submissions` without Access returns 403.
- Sign-out and session expiration require authentication again.
- Access audit logs identify the volunteer and policy decision.

## 2. GitHub Actions secrets

Create a GitHub **production** environment and add these repository or environment secrets:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | `6d837580a4d0641139ecada9e74076b8` |
| `CLOUDFLARE_API_TOKEN` | A narrowly scoped deployment token |
| `TURNSTILE_SECRET` | Secret for the `macon170.com contact form` widget |

Create a custom Cloudflare API token restricted to the Kerry Personal account and the macon170.com zone. It needs the minimum permissions required to deploy Workers, edit Workers routes, and edit D1. Do not reuse a Global API Key.

The workflow on `main`:

1. Installs locked dependencies.
2. Runs Astro, Worker type, Wrangler binding, and Worker integration checks.
3. Runs the test suite and production build.
4. Performs a Wrangler dry run.
5. Applies pending D1 migrations.
6. Deploys the Worker and static assets with the Turnstile secret.

The `production` GitHub environment can require manual reviewer approval if desired.

## 3. Local development

Create an ignored `.dev.vars`:

```dotenv
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
```

For predictable local browser testing, temporarily use Cloudflare’s always-pass test site key `1x00000000000000000000AA` in the rendered form or expose the configured key at build time. The committed production form uses the production site key.

```bash
npm ci
npm run db:migrate:local
npm run dev:worker
```

The local Worker accepts the development admin identity instead of requiring a real Access JWT. Production never uses that bypass because `ENVIRONMENT` is `production` in `wrangler.jsonc`.

## 4. First deployment

Before the first production deploy:

1. Complete the Access placeholders in `wrangler.jsonc`.
2. Add at least two approved adult volunteer emails to the Access Allow policy where possible.
3. Add the GitHub secrets above.
4. Push to `main`, or run the workflow manually.
5. Verify `https://www.macon170.com/contact/` and submit a test parent inquiry.
6. Sign in at `https://admin.macon170.com/`, open the message, and move it from New to Resolved.
7. Confirm the D1 row and audit log:

```bash
npx wrangler d1 execute macon170-submissions --remote \
  --command "SELECT id, created_at, status, parent_name, topic FROM contact_submissions ORDER BY created_at DESC LIMIT 10"
```

## Data and safety model

- The form collects parent name, email, optional parent phone, optional child grade, topic, and message.
- It explicitly tells parents not to submit a child’s name or sensitive information.
- Turnstile is verified server-side before D1 insertion.
- A hidden honeypot and Worker rate limiter provide additional abuse resistance.
- D1 stores country code and browser user-agent for abuse and troubleshooting; it does not intentionally store IP addresses.
- A daily Worker cron deletes submissions and their audit logs after 365 days.
- Admin responses are private and non-cacheable.
- Every submission detail view and status change creates an audit entry tied to the verified Access email.
- Calendar events are stored in D1. Volunteers create drafts, publish only when ready, and archive instead of deleting; every event change records the Access email in `event_audit_log`.
- The public calendar API exposes only upcoming published family logistics and never exposes volunteer identities or internal audit metadata.
- Volunteers should reply through an approved shared pack mailbox reaching multiple adults, not from private one-to-one youth channels.

## Operations

- Back up D1 periodically with `wrangler d1 export macon170-submissions --remote --output <secure-path>`.
- Review Access membership when volunteer roles change.
- Remove departed volunteers immediately and invalidate their Access sessions if needed.
- Keep Turnstile and GitHub secrets out of repository files and logs.
- Update `src/pages/privacy.astro` before adding analytics, notifications, or a new data processor.
