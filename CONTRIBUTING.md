# Contributing

Thanks for helping with the Pack 170 website. This is a small, volunteer-maintained project, so this guide stays practical: how to get a working environment, how changes get reviewed, and the standards that keep the site correct for families.

## Development setup

**Prerequisites:** [Bun](https://bun.sh) and a [Cloudflare account](https://dash.cloudflare.com) with [Wrangler](https://developers.cloudflare.com/workers/wrangler/) authenticated locally (`bunx wrangler login`) if you need the full Worker.

```bash
git clone https://github.com/kerryhatcher/macon170.com.git
cd macon170.com
bun install --frozen-lockfile
cp .dev.vars.example .dev.vars
bun run db:migrate:local
```

Two ways to run it locally:

- `bun run dev` — Astro dev server only. Fastest loop for page/content/style changes; no API, no D1.
- `bun run dev:worker` — builds the site and runs the full Cloudflare Worker (contact API, admin desk, local D1) at `localhost:8787`. Use this for anything touching `worker/`.

`.dev.vars` provides `TURNSTILE_SECRET` set to Cloudflare's documented always-pass test secret — safe for local use, never used in production. Never commit a real Turnstile or Cloudflare secret.

## Before you open a PR

Run the full local CI battery — it's the same set of checks GitHub Actions runs before a deploy is allowed:

```bash
just ci
```

Which runs, in order: `bun run lint`, `bun run check` (Astro + Worker type-checking), `bun run format:check`, `bun run test` (unit + integration, against the real Cloudflare Workers runtime and applied D1 migrations), and `bun run test:e2e` (Playwright, contact-to-admin flow).

Don't have `just`? Run the individual `bun run` scripts listed in [README.md](README.md#-usage) in the same order.

## Code standards

- **TypeScript everywhere in `worker/`.** No `any` where a real type is available; the Worker environment is typed via `WorkerEnv = Env & { TURNSTILE_SECRET: string }` in `worker/index.ts`, not by widening the generated `worker-configuration.d.ts`.
- **Formatting is enforced, not debated.** Run `bun run format` (Prettier, including `.astro` files) before committing; `format:check` in CI will fail otherwise.
- **Lint clean.** `bun run lint:fix` handles most ESLint issues automatically.
- **Test the layer you changed.** Worker logic changes need a unit or integration test in `worker/*.test.ts`; anything touching the contact-to-admin user flow needs e2e coverage in `e2e/`.
- **Pack facts live in one place.** Pack-specific details (dues, contacts, event dates) belong in `src/data/pack.ts`, never hardcoded into a page. Unknown facts are marked as clear placeholders, never invented.
- **`docs/Offical-info.md` is human-authored.** It's the canonical source of truth for pack and council facts and should not be edited by an agent or contributor without explicit sign-off from pack leadership — it overrides the research docs in `docs/research/` if they ever disagree.
- **Respect the youth-protection and brand constraints.** Youth are identified by first name and last initial only, with no photos without consent; official Scouting marks are used unmodified only. See `PRODUCT.md` for the full constraint list before adding anything that touches youth data, contact flows, or Scouting branding.

## Pull request process

1. Branch from `main`.
2. Make your change, keeping it scoped — small, focused PRs are easier to review on a volunteer timeline.
3. Run `just ci` locally and confirm it's green.
4. Open a PR describing what changed and why. Link any related issue.
5. GitHub Actions re-runs the same `just ci` battery plus a production build and a Wrangler dry-run before anything can merge to a deployable state.
6. A maintainer reviews and merges. Pushing to `main` triggers a production deploy (see [`docs/CLOUDFLARE-DEPLOYMENT.md`](docs/CLOUDFLARE-DEPLOYMENT.md)), so `main` should always be in a deployable state.

## Finding something to work on

Check [open issues](https://github.com/kerryhatcher/macon170.com/issues), particularly anything labeled `good first issue`. If you've spotted a pack-fact error (a wrong date, an outdated contact), that's a welcome PR even without an issue — just cite the source in the PR description.

## Reporting security issues

Please don't open a public issue for a security or data-safety concern. See [SECURITY.md](SECURITY.md) instead.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Participation means agreeing to keep interactions respectful and harassment-free.
