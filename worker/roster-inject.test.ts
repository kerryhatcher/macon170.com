import { env } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { injectRoster, rosterMarkup } from './roster-inject';

declare module 'cloudflare:workers' {
  interface ProvidedEnv extends Env {
    TEST_MIGRATIONS: D1Migration[];
  }
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

const page = (body: string) =>
  new Response(`<!doctype html><html><body>${body}</body></html>`, { headers: { 'content-type': 'text/html' } });

describe('rosterMarkup', () => {
  it('escapes HTML in names', () => {
    const html = rosterMarkup(
      [
        {
          id: '1',
          slug: 'a',
          role: 'Cubmaster',
          name: '<script>x</script>',
          bio: null,
          sort_order: 1,
          updated_at: '',
          vacant: false,
        },
      ],
      'filled',
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders a vacancy note for the vacant view', () => {
    const html = rosterMarkup(
      [
        {
          id: '1',
          slug: 'treasurer',
          role: 'Treasurer',
          name: null,
          bio: null,
          sort_order: 1,
          updated_at: '',
          vacant: true,
        },
      ],
      'vacant',
    );
    expect(html).toContain('Treasurer');
    expect(html).toContain('This role is open');
  });
});

describe('injectRoster', () => {
  it('fills the filled view with named leaders only', async () => {
    const response = injectRoster(page('<div data-roster="filled">fallback</div>'), env);
    const html = await response.text();
    expect(html).toContain('Kerry Hatcher');
    expect(html).not.toContain('fallback');
    expect(html).not.toContain('Treasurer');
  });

  it('fills the vacant view with unfilled roles only', async () => {
    const response = injectRoster(page('<div data-roster="vacant">fallback</div>'), env);
    const html = await response.text();
    expect(html).toContain('Treasurer');
    expect(html).not.toContain('Kerry Hatcher');
  });

  it('fills a single role when given a slug', async () => {
    const response = injectRoster(page('<div data-roster="webelos-den-leader">fallback</div>'), env);
    const html = await response.text();
    expect(html).toContain('Stephanie Hatcher');
    expect(html).not.toContain('Kerry Hatcher');
  });

  it('keeps the fallback text when the database query fails', async () => {
    const broken = {
      DB: {
        prepare: () => {
          throw new Error('D1 down');
        },
      },
    } as unknown as Env;
    const response = injectRoster(page('<div data-roster="filled">Pack leadership loads from the pack database.</div>'), broken);
    const html = await response.text();
    expect(html).toContain('Pack leadership loads from the pack database.');
  });

  it('passes non-HTML responses through untouched', async () => {
    const json = new Response('{"a":1}', { headers: { 'content-type': 'application/json' } });
    expect(await injectRoster(json, env).text()).toBe('{"a":1}');
  });
});
