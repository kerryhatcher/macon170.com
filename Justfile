default:
    just --list

# Full local battery: same checks GitHub Actions runs before deploy.
ci: lint check format test test-e2e

lint:
    npm run lint

check:
    npm run check

format:
    npm run format:check

fmt:
    npm run format

test:
    npm run test

test-e2e:
    npm run test:e2e
