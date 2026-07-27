# Security Policy

## Scope

This repository powers [macon170.com](https://www.macon170.com), the production
website for Cub Scout Pack 170, including a public contact form, a D1-backed
volunteer admin desk gated behind Cloudflare Access, and a public calendar API.
It handles parent-submitted contact information (name, email, optional phone,
optional child grade — never a child's name). Please treat any way to access,
tamper with, or exfiltrate that data — or to reach the admin desk without a
valid Cloudflare Access identity — as a security issue.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for a security or data-safety
concern.**

Instead, email **kerry@kerryhatcher.com** with:

- A description of the issue and its potential impact
- Steps to reproduce, or a proof of concept if you have one
- Any relevant request/response details (redact real parent data if you
  encounter any)

You should receive an acknowledgement within **3 business days**. This is a
volunteer-maintained project, not a company with a dedicated security team —
please allow reasonable time for a fix, and avoid actions that could expose
real family data (for example, don't submit the production contact form with
real information while testing, and don't attempt to brute-force or bypass
Cloudflare Access against the live site beyond what's needed to confirm the
issue).

## Supported Versions

There are no released versions — `main` is continuously deployed to
production. Security fixes are applied directly to `main` and deployed as soon
as they're verified.

## Disclosure Process

1. Report privately by email as above.
2. The maintainer confirms the issue and assesses impact.
3. A fix is developed and deployed to production.
4. Once resolved, the reporter is credited (if desired) in the fix's commit
   or PR description. Public disclosure, if any, happens only after a fix is
   live.

## Related Safeguards Already In Place

For context when reporting: contact submissions are Turnstile-verified and
rate-limited server-side before reaching D1; the admin desk validates every
request against a Cloudflare Access JWT checked against Cloudflare's rotating
JWKS (not just Access enforcement at the edge); every admin view or status
change writes an audit entry tied to the verified volunteer email; and
submissions are automatically purged after 365 days by a scheduled Worker
job. See [`docs/CLOUDFLARE-DEPLOYMENT.md`](docs/CLOUDFLARE-DEPLOYMENT.md) for
the full data and safety model.
