<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/header-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/header.svg">
    <img src="assets/header.svg" alt="Pack 170 — Cub Scouts of Macon, Georgia" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/kerryhatcher/macon170.com/actions/workflows/deploy.yml"><img src="https://github.com/kerryhatcher/macon170.com/actions/workflows/deploy.yml/badge.svg" alt="Deploy status"></a>
  <img src="https://img.shields.io/badge/built%20with-Astro-FF5D01?logo=astro&logoColor=white" alt="Built with Astro">
  <img src="https://img.shields.io/badge/deployed%20on-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white" alt="Deployed on Cloudflare Workers">
  <img src="https://img.shields.io/badge/runtime-Bun-000000?logo=bun&logoColor=white" alt="Bun">
</p>
<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-6366F1" alt="Version 0.1.0">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
</p>

**Pack 170** is the source for [macon170.com](https://www.macon170.com) — the
official website of Cub Scout Pack 170 in Macon, Georgia, built with
[Astro](https://astro.build) and a
[Cloudflare Workers](https://workers.cloudflare.com) backend.

<p align="center">
  <img src="screenshots/final/home-desktop.png" alt="macon170.com home page: a notebook-styled hero reading 'Cub Scout Pack 170 — Build confidence. Find friends. Get outside. Do your best.' with a den grid and family calendar preview below it" width="720">
</p>

## ✨ Features

- 🏕️ **Family-first static site** — [Astro](https://astro.build) pages for
  the calendar, adventures, joining, and volunteering, built to answer
  "is this pack for us?" in under two minutes on a phone
- ✉️ **Turnstile-verified contact form** — the Pack-branded page posts directly
  to the separately deployed SonicJS CMS, where validation, private storage,
  review, auditing, and 365-day retention are enforced
- 📅 **CMS-managed family calendar** — volunteers manage events in the
  separately deployed SonicJS CMS; this frontend reads its versioned public
  JSON and iCalendar feeds directly
- 🔐 **CMS-authenticated volunteer queue** — only active SonicJS
  administrators at `cms.macon170.com` can review or change inquiry status
- 🧪 **Real Workers-runtime tests** — [Vitest](https://vitest.dev) route
  coverage plus [Playwright](https://playwright.dev) coverage of the branded
  form, CMS redirect states, Turnstile recovery, and mobile layout
- 🧹 **One-command CI parity** — `just ci` runs the exact lint/check/format/
  test/e2e battery GitHub Actions runs before every deploy

## 🚀 Quick Start

```bash
bun install --frozen-lockfile
bun run dev:worker
```

Open **http://localhost:8787** — this runs the public routing Worker in front
of the built site. Contact submission storage and volunteer review run in the
separate `macon170-cms` project.

## Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Why This Exists](#-why-this-exists)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Architecture](#️-architecture)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#license)
- [Acknowledgements](#-acknowledgements)

## 🤔 Why This Exists

Pack 170 previously ran its web presence on a Square site. This project
replaces it as the pack's primary web presence, serving two audiences
equally: **prospective families** who need to answer "what is this, does
my kid qualify, when/where do you meet, how do I join" in under two
minutes, and **current pack families** looking up the calendar, event
details, and volunteer contacts.

Two constraints shaped the architecture more than anything else:

- **Youth protection.** Youth are identified by first name and last
  initial only, no photos without consent, and every contact channel is
  parent-framed and reaches multiple adults — there's no one-to-one
  adult–youth messaging path.
- **Scouting America brand rules.** Official marks are used unmodified
  only, sourced from the Brand Center, with no ads, no merchandise
  sales, and a required non-endorsement disclaimer — this site is run
  by pack volunteers, not Scouting America or the Central Georgia
  Council.

Those constraints are why the CMS contact queue is administrator-only and why
the CMS data model tracks an audit trail for every submission view and status
change.

## 📦 Installation

**Prerequisites:** [Bun](https://bun.sh) and a
[Cloudflare account](https://dash.cloudflare.com) with
[Wrangler](https://developers.cloudflare.com/workers/wrangler/)
authenticated (`bunx wrangler login`).

The installed pre-commit hooks also require
[pii-hound v0.1.9](https://github.com/saddledata/pii-hound/releases/tag/v0.1.9)
on your `PATH`. Download the binary for your platform from that release and
verify it against the published `checksums.txt` before installing it. The hook
scans changed files and blocks commits containing detected PII or secrets.

```bash
git clone https://github.com/kerryhatcher/macon170.com.git
cd macon170.com
bun install --frozen-lockfile
```

<details>
<summary><strong>Environment variables reference</strong></summary>

| Variable                     | Where                        | Purpose                                                     |
| ---------------------------- | ---------------------------- | ----------------------------------------------------------- |
| `PUBLIC_CALENDAR_CMS_ORIGIN` | local build environment only | Optional local CMS origin for calendar reads during a build |

The Turnstile secret, contact allowlists, rate limit, D1 binding, and CMS
authentication configuration belong to `macon170-cms`, not this project. Full
production setup is documented in
[`docs/CLOUDFLARE-DEPLOYMENT.md`](docs/CLOUDFLARE-DEPLOYMENT.md).

</details>

## 🔧 Usage

| Command                   | What it does                                                          |
| ------------------------- | --------------------------------------------------------------------- |
| `bun run dev`             | Astro dev server only (no API, no D1), exposed on the LAN at `:41771` |
| `bun run dev:worker`      | Public routing Worker + static site, exposed on the LAN at `:8787`    |
| `bun run build`           | Type-checks and builds to `dist/`                                     |
| `bun run test`            | [Vitest](https://vitest.dev) unit + integration                       |
| `bun run test:e2e`        | [Playwright](https://playwright.dev) e2e coverage                     |
| `bun run lint` / `format` | [ESLint](https://eslint.org) and [Prettier](https://prettier.io)      |
| `just ci`                 | The full local battery, same as CI                                    |

Run `just ci` before every commit — it's the same battery
[GitHub Actions](https://docs.github.com/actions) runs before it will
deploy.

## 📖 API Reference

The public-site Worker serves the Astro output and keeps unowned `/api/*`
paths closed with `404`.

Contact submission (`POST /api/forms/contact/submit`), the public form schema,
the authenticated volunteer queue, calendar JSON, event detail, editing, and
the iCalendar subscription are owned by `cms.macon170.com`. See
[`docs/CLOUDFLARE-DEPLOYMENT.md`](docs/CLOUDFLARE-DEPLOYMENT.md) for the
data-safety and deployment model. The CMS-owned contact contract consumed by
this frontend is recorded in [`docs/openapi.yaml`](docs/openapi.yaml).

## 🏗️ Architecture

```text
src/               Astro pages, layouts, and components (the public site)
src/data/pack.ts   The single editable file for pack-specific facts
worker/            Cloudflare Worker: static assets, apex redirect, and API guard
migrations/        Legacy public-site D1 history; retained read-only and unapplied
e2e/               Playwright coverage of the branded contact form and redirects
docs/              Deployment runbook and pack research/reference material
```

## 🤝 Contributing

This is a small, volunteer-maintained pack site, but pull requests, bug
reports, and content corrections are welcome. See
[CONTRIBUTING.md](CONTRIBUTING.md) for local setup, the PR process, and
code standards. Please also read our
[Code of Conduct](CODE_OF_CONDUCT.md).

## 💬 Support

- **Bugs or feature ideas:** open a
  [GitHub issue](https://github.com/kerryhatcher/macon170.com/issues)
- **Security or data-safety concerns:** see [SECURITY.md](SECURITY.md) —
  please don't file these as public issues
- **Pack questions** (meeting times, joining, events): use the
  [contact page](https://www.macon170.com/contact) on the live site,
  not this repository

## License

MIT — see [LICENSE](LICENSE).

## 🙏 Acknowledgements

- Cub Scout Pack 170 is chartered by
  [Highland Hills Baptist Church](https://highlandhillsbaptist.org) in
  Macon's Shirley Hills neighborhood, part of the
  [Central Georgia Council](https://www.centralgeorgiacouncil.org),
  Scouting America.
- This is a volunteer-run site, not an official Scouting America or
  council communication channel. Scouting trademarks and design marks
  belong to Scouting America; no endorsement of this site or its
  non-Scouting activities is implied.
- Built with [Astro](https://astro.build) and
  [Cloudflare Workers](https://workers.cloudflare.com).
