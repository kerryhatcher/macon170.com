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

describe('calendar events', () => {
  const eventPayload = {
    title: 'Pack Meeting',
    slug: 'pack-meeting-january',
    summary: 'The whole pack gathers for an evening of activities and announcements.',
    description: 'Families gather at Highland Hills Baptist Church for the monthly pack program.',
    category: 'pack',
    status: 'scheduled',
    visibility: 'draft',
    startsAt: '2027-01-12T23:30:00.000Z',
    endsAt: '2027-01-13T00:30:00.000Z',
    timezone: 'America/New_York',
    locationName: 'Highland Hills Baptist Church',
    address: '1370 Briarcliff Rd, Macon, GA 31211',
    audience: 'All Pack 170 families',
    whatToBring: 'A water bottle',
    cost: 'No cost',
    registrationUrl: null,
  };

  it('keeps drafts private and publishes through the admin API', async () => {
    const created = await exports.default.fetch('http://localhost/api/admin/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify(eventPayload),
    });
    expect(created.status).toBe(201);
    const { id } = await created.json<{ id: string }>();
    const storedDraft = await env.DB.prepare('SELECT visibility FROM calendar_events WHERE id = ?')
      .bind(id)
      .first<{ visibility: string }>();
    expect(storedDraft?.visibility).toBe('draft');

    let publicList = await exports.default.fetch('https://www.macon170.com/api/events');
    expect((await publicList.json<{ events: unknown[] }>()).events).toHaveLength(0);

    const published = await exports.default.fetch(`http://localhost/api/admin/events/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, visibility: 'published' }),
    });
    expect(published.status).toBe(200);

    publicList = await exports.default.fetch('https://www.macon170.com/api/events');
    const body = await publicList.json<{ events: Array<Record<string, unknown> & { slug: string }> }>();
    expect(body.events[0].slug).toBe('pack-meeting-january');
    expect(body.events[0]).not.toHaveProperty('created_by');
    expect(body.events[0]).not.toHaveProperty('updated_by');
    expect(body.events[0]).not.toHaveProperty('id');

    const detail = await exports.default.fetch('https://www.macon170.com/api/events/pack-meeting-january');
    expect(detail.status).toBe(200);
  });

  it('rejects admin event APIs on the public hostname', async () => {
    const response = await exports.default.fetch('https://www.macon170.com/api/admin/events');
    expect(response.status).toBe(404);
  });

  it('requires the exact admin origin for mutations', async () => {
    const response = await exports.default.fetch('http://localhost/api/admin/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(eventPayload),
    });
    expect(response.status).toBe(403);
  });

  it('archives rather than deleting an event', async () => {
    const row = await env.DB.prepare("SELECT id FROM calendar_events WHERE slug = 'pack-meeting-january'").first<{ id: string }>();
    expect(row).not.toBeNull();
    const response = await exports.default.fetch(`http://localhost/api/admin/events/${row!.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, visibility: 'archived' }),
    });
    expect(response.status).toBe(200);
    const stored = await env.DB.prepare('SELECT visibility, archived_at FROM calendar_events WHERE id = ?').bind(row!.id).first();
    expect(stored?.visibility).toBe('archived');
    expect(stored?.archived_at).toBeTruthy();
    const publicDetail = await exports.default.fetch('https://www.macon170.com/api/events/pack-meeting-january');
    expect(publicDetail.status).toBe(404);
  });

  it('round-trips a milestone key through the public API', async () => {
    const created = await exports.default.fetch('http://localhost/api/admin/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, slug: 'lego-derby-cookout', milestone: 'lego-derby' }),
    });
    expect(created.status).toBe(201);
    const { id } = await created.json<{ id: string }>();

    const published = await exports.default.fetch(`http://localhost/api/admin/events/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, slug: 'lego-derby-cookout', milestone: 'lego-derby', visibility: 'published' }),
    });
    expect(published.status).toBe(200);

    const list = await exports.default.fetch('https://www.macon170.com/api/events');
    const body = await list.json<{ events: Array<{ slug: string; milestone: string | null }> }>();
    const event = body.events.find((candidate) => candidate.slug === 'lego-derby-cookout');
    expect(event?.milestone).toBe('lego-derby');
  });

  it('rejects a milestone key that is not in the program', async () => {
    const response = await exports.default.fetch('http://localhost/api/admin/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, slug: 'not-a-milestone', milestone: 'summer-camp' }),
    });
    expect(response.status).toBe(400);
  });

  it('treats an absent or cleared milestone as null', async () => {
    const created = await exports.default.fetch('http://localhost/api/admin/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, slug: 'ordinary-pack-meeting' }),
    });
    expect(created.status).toBe(201);
    const { id } = await created.json<{ id: string }>();
    const stored = await env.DB.prepare('SELECT milestone FROM calendar_events WHERE id = ?')
      .bind(id)
      .first<{ milestone: string | null }>();
    expect(stored?.milestone).toBeNull();

    const cleared = await exports.default.fetch(`http://localhost/api/admin/events/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: 'https://admin.macon170.com' },
      body: JSON.stringify({ ...eventPayload, slug: 'ordinary-pack-meeting', milestone: '', visibility: 'draft' }),
    });
    expect(cleared.status).toBe(200);
    const after = await env.DB.prepare('SELECT milestone FROM calendar_events WHERE id = ?')
      .bind(id)
      .first<{ milestone: string | null }>();
    expect(after?.milestone).toBeNull();
  });
});

describe('volunteer desk', () => {
  it('serves the authenticated local admin shell', async () => {
    const response = await exports.default.fetch('http://localhost/admin');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Volunteer desk');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('serves the calendar editor in local authenticated mode', async () => {
    const response = await exports.default.fetch('http://localhost/admin/calendar');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Calendar editor');
  });

  it('offers every pack-year milestone in the editor dropdown', async () => {
    const response = await exports.default.fetch('http://localhost/admin/calendar');
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('<select name="milestone">');
    expect(html).toContain('<option value="">Not a milestone</option>');
    expect(html).toContain('<option value="lego-derby">Lego Pinewood Derby</option>');
    expect(html).toContain('<option value="blue-gold">Blue &amp; Gold Banquet</option>');
  });

  it('lists submissions in local authenticated mode', async () => {
    const response = await exports.default.fetch('http://localhost/api/admin/submissions');
    expect(response.status).toBe(200);
    const body = await response.json<{ submissions: unknown[] }>();
    expect(body.submissions.length).toBeGreaterThan(0);
  });
});
