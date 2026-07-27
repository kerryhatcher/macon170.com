install:
  bun install

# Astro dev on :4321 (fast HMR, no D1) plus the Worker on :8787 (D1, contact API, admin desk).
# The Worker takes a while to appear: dev:worker runs a full build first.
run: install
  #!/usr/bin/env bash
  set -euo pipefail
  # ponytail: trap kills the whole process group so one Ctrl-C doesn't orphan wrangler
  trap 'kill 0' EXIT
  bun run db:migrate:local
  bun start &
  bun run dev:worker &
  wait

# Same battery GitHub Actions runs before a deploy is allowed.
ci:
  bun run lint
  bun run check
  bun run format:check
  bun run test
  bun run test:e2e
