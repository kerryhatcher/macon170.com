# Pull request previews

Same-repository frontend pull requests deploy a temporary Worker named
`macon170-pr-<number>` at the account's `workers.dev` subdomain. The build uses
the production CMS origin intentionally, so the rendered public contract matches
production. It never creates or changes CMS, D1, R2, rate-limit, email, or CMS
secret resources.

Set the repository variable `CLOUDFLARE_ACCOUNT_SUBDOMAIN` to the account's
`workers.dev` subdomain. The preview workflow uses it only to construct URLs for
read-only verification and the PR comment. Closing a same-repository PR deletes
only its named temporary Worker. Fork PRs receive validation without credentials
or a live preview.

Do not submit the contact form from a frontend preview unless creating a real
production CMS inquiry is intended.
