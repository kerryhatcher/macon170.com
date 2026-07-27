import { env, exports } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';

declare module 'cloudflare:workers' {
  interface ProvidedEnv extends Env {
    TEST_MIGRATIONS: D1Migration[];
  }
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe('leadership_roles schema', () => {
  it('seeds eleven roles in display order', async () => {
    const result = await env.DB.prepare('SELECT slug, role, name FROM leadership_roles ORDER BY sort_order ASC').run<{
      slug: string;
      role: string;
      name: string | null;
    }>();
    expect(result.results).toHaveLength(11);
    expect(result.results[0]).toMatchObject({ slug: 'cubmaster', role: 'Cubmaster', name: 'Kerry Hatcher' });
    expect(result.results.map((row) => row.slug)).toContain('webelos-den-leader');
  });

  it('seeds known holders and leaves the rest vacant', async () => {
    const filled = await env.DB.prepare(
      "SELECT slug FROM leadership_roles WHERE name IS NOT NULL AND trim(name) <> '' ORDER BY sort_order",
    ).run<{
      slug: string;
    }>();
    expect(filled.results.map((row) => row.slug)).toEqual([
      'cubmaster',
      'committee-chair',
      'chartered-organization-representative',
      'webelos-den-leader',
    ]);
  });

  it('rejects a duplicate slug', async () => {
    await expect(
      env.DB.prepare(
        "INSERT INTO leadership_roles (id, slug, role, sort_order, updated_by) VALUES ('x', 'cubmaster', 'Dup', 999, 'test')",
      ).run(),
    ).rejects.toThrow();
  });
});
