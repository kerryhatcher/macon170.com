import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // e2e/ holds Playwright specs (run via `bun run test:e2e`), not vitest tests -
    // vitest's default glob would otherwise pick them up and fail importing
    // '@playwright/test' globals as if they were vitest's.
    include: ['worker/**/*.test.ts', 'src/**/*.test.ts'],
  },
  plugins: [
    cloudflareTest(() => ({
      wrangler: { configPath: './wrangler.test.jsonc' },
    })),
  ],
});
