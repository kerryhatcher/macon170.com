import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      '.wrangler/**',
      'graphify-out/**',
      'worker-configuration.d.ts',
      'test-results/**',
      'playwright-report/**',
      // Git worktrees live inside the repo, so linting them would lint a second
      // full copy of src/ and worker/ and report every finding twice.
      '.claude/worktrees/**',
      // Vendored agent-skill scripts: third-party Node files we do not author or fix.
      '.claude/skills/**',
      '.agents/skills/**',
      '.github/skills/**',
    ],
  },
  {
    extends: [js.configs.recommended, tseslint.configs.recommended, astro.configs.recommended],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.test.ts', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
]);
