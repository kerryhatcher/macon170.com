install:
  bun install

run: install
  bun start

# Same battery GitHub Actions runs before a deploy is allowed.
ci:
  bun run lint
  bun run check
  bun run format:check
  bun run test
  bun run test:e2e
