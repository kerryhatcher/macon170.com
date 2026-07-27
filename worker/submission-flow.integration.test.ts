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

// Integration coverage for the exact user-facing flow that broke in production:
// a parent submits the public contact form, and a volunteer expects to see it in
// the admin desk. worker/index.test.ts exercises submission and listing as
// separate concerns; this suite chains them so a regression in either the write
// path or the read path (or the join between them) fails a single test instead
// of passing two unrelated ones while the real flow is broken.
describe('submission flow: public form to volunteer desk', () => {
  it('makes a submitted parent question visible, readable, and updatable in the admin desk', async () => {
    const message = 'We would like to visit.\nCan we bring a sibling too?';
    const form = new FormData();
    form.set('parentName', 'Riley Guardian');
    form.set('email', 'riley@example.com');
    form.set('phone', '478-555-0199');
    form.set('childGrade', '2nd grade');
    form.set('topic', 'Planning a first visit');
    form.set('message', message);
    form.set('cf-turnstile-response', 'XXXX.DUMMY.TOKEN.XXXX');

    const submitResponse = await exports.default.fetch('https://www.macon170.com/api/contact', {
      method: 'POST',
      headers: { origin: 'https://www.macon170.com' },
      body: form,
      redirect: 'manual',
    });
    expect(submitResponse.status).toBe(303);

    const listResponse = await exports.default.fetch('http://localhost/api/admin/submissions');
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json<{ submissions: { id: string; parent_name: string; status: string }[] }>();
    const listed = listBody.submissions.find((row) => row.parent_name === 'Riley Guardian');
    expect(listed).toBeDefined();
    expect(listed?.status).toBe('new');

    const detailResponse = await exports.default.fetch(`http://localhost/api/admin/submissions/${listed!.id}`);
    expect(detailResponse.status).toBe(200);
    const detailBody = await detailResponse.json<{ submission: { message: string; email: string } }>();
    expect(detailBody.submission.message).toBe(message);
    expect(detailBody.submission.email).toBe('riley@example.com');

    const patchResponse = await exports.default.fetch(`http://localhost/api/admin/submissions/${listed!.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', origin: env.ADMIN_ORIGIN },
      body: JSON.stringify({ status: 'in_progress' }),
    });
    expect(patchResponse.status).toBe(200);

    const resolvedFilterResponse = await exports.default.fetch('http://localhost/api/admin/submissions?status=in_progress');
    const resolvedFilterBody = await resolvedFilterResponse.json<{ submissions: { id: string }[] }>();
    expect(resolvedFilterBody.submissions.some((row) => row.id === listed!.id)).toBe(true);

    const newFilterResponse = await exports.default.fetch('http://localhost/api/admin/submissions?status=new');
    const newFilterBody = await newFilterResponse.json<{ submissions: { id: string }[] }>();
    expect(newFilterBody.submissions.some((row) => row.id === listed!.id)).toBe(false);
  });
});
