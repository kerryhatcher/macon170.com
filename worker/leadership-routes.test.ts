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
      'lion-den-leader',
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

describe('GET /api/leadership', () => {
  it('returns every role with a computed vacant flag', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/api/leadership');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; roles: Array<{ slug: string; vacant: boolean; name: string | null }> };
    expect(body.ok).toBe(true);
    expect(body.roles).toHaveLength(11);
    expect(body.roles.find((r) => r.slug === 'cubmaster')).toMatchObject({ name: 'Kerry Hatcher', vacant: false });
    expect(body.roles.find((r) => r.slug === 'treasurer')).toMatchObject({ name: null, vacant: true });
  });

  it('treats a whitespace-only name as vacant', async () => {
    await env.DB.prepare("UPDATE leadership_roles SET name = '   ' WHERE slug = 'lion-den-leader'").run();
    const response = await exports.default.fetch('https://www.macon170.com/api/leadership');
    const body = (await response.json()) as { roles: Array<{ slug: string; vacant: boolean }> };
    expect(body.roles.find((r) => r.slug === 'lion-den-leader')?.vacant).toBe(true);
    await env.DB.prepare("UPDATE leadership_roles SET name = NULL WHERE slug = 'lion-den-leader'").run();
  });

  it('never exposes an email field', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/api/leadership');
    const text = await response.text();
    expect(text).not.toContain('@');
    const body = JSON.parse(text) as { roles: Array<Record<string, unknown>> };
    for (const role of body.roles) {
      expect(role).not.toHaveProperty('updated_by');
    }
  });
});

const localAdmin = 'http://localhost/api/admin/leadership';
const jsonInit = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
  body: JSON.stringify(body),
});

describe('admin leadership routes', () => {
  it('updates a name and bio', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'treasurer'").first<{ id: string }>();
    const response = await exports.default.fetch(
      `${localAdmin}/${row!.id}`,
      jsonInit('PUT', { role: 'Treasurer', name: 'Dana Coin', bio: 'Keeps the books.' }),
    );
    expect(response.status).toBe(200);
    const updated = await env.DB.prepare("SELECT name, bio, updated_by FROM leadership_roles WHERE slug = 'treasurer'").first();
    expect(updated).toMatchObject({ name: 'Dana Coin', bio: 'Keeps the books.', updated_by: 'local-volunteer@example.invalid' });
  });

  it('clears a name back to vacant when given an empty string', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'treasurer'").first<{ id: string }>();
    // Arrange a genuinely non-vacant starting state, independent of any other test's ordering.
    await env.DB.prepare("UPDATE leadership_roles SET name = 'Interim Treasurer', bio = 'Filling in.' WHERE slug = 'treasurer'").run();
    const response = await exports.default.fetch(`${localAdmin}/${row!.id}`, jsonInit('PUT', { role: 'Treasurer', name: '', bio: '' }));
    expect(response.status).toBe(200);
    const updated = await env.DB.prepare("SELECT name, bio FROM leadership_roles WHERE slug = 'treasurer'").first();
    expect(updated).toMatchObject({ name: null, bio: null });
  });

  it('does not change the slug when the role label is renamed', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'advancement-chair'").first<{ id: string }>();
    await exports.default.fetch(`${localAdmin}/${row!.id}`, jsonInit('PUT', { role: 'Advancement Coordinator' }));
    const updated = await env.DB.prepare('SELECT slug, role FROM leadership_roles WHERE id = ?').bind(row!.id).first();
    expect(updated).toMatchObject({ slug: 'advancement-chair', role: 'Advancement Coordinator' });
  });

  it('creates a role and derives its slug', async () => {
    const response = await exports.default.fetch(localAdmin, jsonInit('POST', { role: 'Assistant Cubmaster', sortOrder: 15 }));
    expect(response.status).toBe(201);
    const body = (await response.json()) as { slug: string; id: string };
    expect(body.slug).toBe('assistant-cubmaster');
  });

  it('rejects a duplicate role slug with 409', async () => {
    const response = await exports.default.fetch(localAdmin, jsonInit('POST', { role: 'Assistant Cubmaster' }));
    expect(response.status).toBe(409);
  });

  it('returns 409 instead of 500 when two requests race to create the same slug', async () => {
    const responses = await Promise.all([
      exports.default.fetch(localAdmin, jsonInit('POST', { role: 'Race Condition Chair' })),
      exports.default.fetch(localAdmin, jsonInit('POST', { role: 'Race Condition Chair' })),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it('replaces name and bio in full on PUT, since the admin form always submits all three fields', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'cubmaster'").first<{ id: string }>();
    const response = await exports.default.fetch(`${localAdmin}/${row!.id}`, jsonInit('PUT', { role: 'Cubmaster' }));
    expect(response.status).toBe(200);
    const updated = await env.DB.prepare("SELECT name, bio FROM leadership_roles WHERE slug = 'cubmaster'").first();
    expect(updated).toMatchObject({ name: null, bio: null });
    // Restore the seeded holder so later tests/assertions about cubmaster's name aren't affected.
    await env.DB.prepare("UPDATE leadership_roles SET name = 'Kerry Hatcher', bio = NULL WHERE slug = 'cubmaster'").run();
  });

  it('rejects a non-integer sort order', async () => {
    const response = await exports.default.fetch(localAdmin, jsonInit('POST', { role: 'Assistant Den Leader', sortOrder: '5' }));
    expect(response.status).toBe(400);
  });

  it('deletes a role', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'assistant-cubmaster'").first<{ id: string }>();
    const response = await exports.default.fetch(`${localAdmin}/${row!.id}`, {
      method: 'DELETE',
      headers: { origin: 'https://admin.macon170.com' },
    });
    expect(response.status).toBe(200);
    const gone = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'assistant-cubmaster'").first();
    expect(gone).toBeNull();
  });

  it('rejects a bio longer than 600 characters', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'cubmaster'").first<{ id: string }>();
    const response = await exports.default.fetch(`${localAdmin}/${row!.id}`, jsonInit('PUT', { role: 'Cubmaster', bio: 'x'.repeat(601) }));
    expect(response.status).toBe(400);
  });

  it('rejects a missing role label', async () => {
    const response = await exports.default.fetch(localAdmin, jsonInit('POST', { name: 'Nobody' }));
    expect(response.status).toBe(400);
  });

  it('rejects an email address typed into the name field', async () => {
    const response = await exports.default.fetch(
      localAdmin,
      jsonInit('POST', { role: 'Assistant Treasurer', name: 'reach me at a@b.com' }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain('/contact/');
  });

  it('rejects an email address typed into the bio field', async () => {
    const row = await env.DB.prepare("SELECT id FROM leadership_roles WHERE slug = 'cubmaster'").first<{ id: string }>();
    const response = await exports.default.fetch(
      `${localAdmin}/${row!.id}`,
      jsonInit('PUT', { role: 'Cubmaster', bio: 'Email me at leader@example.com with questions.' }),
    );
    expect(response.status).toBe(400);
  });

  it('requires authentication from the public hostname', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/api/admin/leadership');
    expect(response.status).toBe(404);
  });
});
