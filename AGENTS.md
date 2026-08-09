# macon170.com agent guidance

This is the public Astro site and Cloudflare Worker for Pack 170. Follow the
workspace guidance in `../AGENTS.md` as well as this project's `README.md`,
`PRODUCT.md`, and `CONTRIBUTING.md`.

## Event signup pages

Two client-rendered pages talk to `cms.macon170.com/api/signups/v1` through
`src/lib/signup-client.ts`, with the claim arithmetic in `src/lib/signup-claims.ts`:

- `/signups/?form=<slug>` — a family views a form and submits. The slug is a query
  parameter, not a path segment, because `output: 'static'` plus a CMS with no
  form-list endpoint leaves `getStaticPaths` nothing to enumerate. Same shape as
  `/events/?event=<slug>`.
- `/signups/edit/?token=…` — the magic-link page. **This path is hardcoded in
  `macon170-cms/src/signup-email.ts`; renaming it breaks every link already
  emailed.** The token is a bearer credential, so the page passes `sensitive` to
  `BaseLayout` and `worker/index.ts` adds `Referrer-Policy: no-referrer`,
  `X-Robots-Tag: noindex, nofollow`, and `Cache-Control: no-store`.

Volunteers publish a signup by pasting its URL into the calendar event's
Registration URL field, which `/events/` already renders as a link.

Unlike the contact form — a native form POST, which CORS never touches — signups
are JSON fetches, so they preflight and the CMS requires `Origin` to equal its
`PUBLIC_SITE_ORIGIN` for writes. **`bun run dev` against the prod CMS is blocked
by CORS.** Run a local CMS (port 41772, `.dev.vars` pointing `CORS_ORIGINS` and
`PUBLIC_SITE_ORIGIN` at your dev origin) and set `PUBLIC_CMS_ORIGIN`. Playwright
is unaffected: `page.route` fulfils without a network hop.

## Worktrees

Place Git worktrees in the workspace-level `../worktrees/` directory, not in
this project directory. For example, from the workspace root:

```bash
git -C macon170.com worktree add ../worktrees/<branch-name> <branch-name>
```

## Commits

Commit focused, validated changes often. Use Conventional Commit messages in
the form `type(optional-scope): description`, such as
`docs(agents): add worktree guidance`. Use `feat` for new features and `fix`
for bug fixes; indicate breaking changes with `!` before the colon or an
uppercase `BREAKING CHANGE:` footer.

After installing dependencies in a fresh checkout, run `pre-commit install`.
Confirm it has installed the configured `pre-commit`, `commit-msg`, and
`pre-push` hooks before making commits or pushes.

## GitHub Actions

When adding or updating a GitHub Actions workflow, pin every third-party
action to its immutable full commit SHA; never use a mutable tag or branch.
Add a comment identifying the human-readable release version where useful.
