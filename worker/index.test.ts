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

describe('contact submissions', () => {
  it('stores a valid parent submission', async () => {
    const form = new FormData();
    form.set('parentName', 'Jordan Parent');
    form.set('email', 'jordan@example.com');
    form.set('phone', '478-555-0100');
    form.set('childGrade', '3rd grade');
    form.set('topic', 'Planning a first visit');
    form.set('message', 'We would like to visit the next confirmed pack meeting.');
    form.set('cf-turnstile-response', 'XXXX.DUMMY.TOKEN.XXXX');

    const response = await exports.default.fetch('https://www.macon170.com/api/contact', {
      method: 'POST',
      headers: { origin: 'https://www.macon170.com' },
      body: form,
      redirect: 'manual',
    });

    expect(response.status).toBe(303);
    const row = await env.DB.prepare('SELECT parent_name, email, phone, child_grade, status FROM contact_submissions').first();
    expect(row).toMatchObject({
      parent_name: 'Jordan Parent',
      email: 'jordan@example.com',
      phone: '478-555-0100',
      child_grade: '3rd grade',
      status: 'new',
    });
  });

  it('rejects invalid submissions before storage', async () => {
    const form = new FormData();
    form.set('parentName', 'J');
    form.set('email', 'not-email');
    form.set('topic', 'Unknown');
    form.set('message', 'short');
    form.set('cf-turnstile-response', 'XXXX.DUMMY.TOKEN.XXXX');
    const response = await exports.default.fetch('https://www.macon170.com/api/contact', {
      method: 'POST',
      headers: { origin: 'https://www.macon170.com' },
      body: form,
    });
    expect(response.status).toBe(400);
  });
});

describe('retired calendar routes', () => {
  it.each([
    ['GET', 'https://www.macon170.com/api/events'],
    ['GET', 'https://www.macon170.com/api/events/pack-meeting'],
    ['GET', 'https://www.macon170.com/api/calendar.ics'],
    ['HEAD', 'https://www.macon170.com/api/calendar.ics'],
    ['GET', 'http://localhost/api/admin/events'],
    ['POST', 'http://localhost/api/admin/events'],
  ])('returns 404 for %s %s', async (method, url) => {
    const response = await exports.default.fetch(url, { method });
    expect(response.status).toBe(404);
  });

  it('retains the legacy calendar tables as inaccessible history', async () => {
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('calendar_events', 'event_audit_log') ORDER BY name",
    ).all<{ name: string }>();
    expect(tables.results.map((row) => row.name)).toEqual(['calendar_events', 'event_audit_log']);
  });
});

describe('volunteer desk', () => {
  it('serves the authenticated local admin shell', async () => {
    const response = await exports.default.fetch('http://localhost/admin');
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('Volunteer desk');
    expect(html).toContain('href="https://cms.macon170.com/admin/calendar"');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('does not serve the retired calendar editor', async () => {
    const response = await exports.default.fetch('http://localhost/admin/calendar');
    expect(response.status).toBe(404);
  });

  it('lists submissions in local authenticated mode', async () => {
    const response = await exports.default.fetch('http://localhost/api/admin/submissions');
    expect(response.status).toBe(200);
    const body = await response.json<{ submissions: unknown[] }>();
    expect(body.submissions.length).toBeGreaterThan(0);
  });
});
