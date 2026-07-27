import { env, exports } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

declare module 'cloudflare:workers' {
  interface ProvidedEnv extends Env {
    TEST_MIGRATIONS: D1Migration[];
  }
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

// `age` is a SQLite time modifier, e.g. '-400 days'. Rows are written in the exact
// text format the schema default produces, so the job's cutoff compare is realistic.
async function seedSubmission(id: string, age: string) {
  await env.DB.prepare(
    `INSERT INTO contact_submissions (id, created_at, updated_at, parent_name, email, topic, message)
     VALUES (?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?), 'Test Parent', 'parent@example.com', 'Planning a first visit', 'Seeded for the retention test.')`,
  )
    .bind(id, age, age)
    .run();
}

async function seedAuditRow(submissionId: string, age: string) {
  await env.DB.prepare(
    `INSERT INTO submission_audit_log (submission_id, created_at, actor_email, action)
     VALUES (?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?), 'volunteer@example.com', 'viewed')`,
  )
    .bind(submissionId, age)
    .run();
}

const runRetentionJob = () => exports.default.scheduled();

const submissionIds = async () => {
  const { results } = await env.DB.prepare('SELECT id FROM contact_submissions ORDER BY id').all<{ id: string }>();
  return results.map((row) => row.id);
};

const auditCountFor = async (submissionId: string) => {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM submission_audit_log WHERE submission_id = ?')
    .bind(submissionId)
    .first<{ n: number }>();
  return row!.n;
};

describe('365-day retention job', () => {
  beforeEach(async () => {
    await env.DB.batch([env.DB.prepare('DELETE FROM submission_audit_log'), env.DB.prepare('DELETE FROM contact_submissions')]);
  });

  it('deletes submissions past the retention window and keeps the rest', async () => {
    await seedSubmission('old-submission', '-400 days');
    await seedSubmission('recent-submission', '-30 days');

    await runRetentionJob();

    expect(await submissionIds()).toEqual(['recent-submission']);
  });

  it('deletes audit rows past the retention window and keeps the rest', async () => {
    await seedSubmission('live-submission', '-10 days');
    await seedAuditRow('live-submission', '-400 days');
    await seedAuditRow('live-submission', '-5 days');

    await runRetentionJob();

    // The submission itself is inside the window, so only its stale audit row goes.
    expect(await submissionIds()).toEqual(['live-submission']);
    expect(await auditCountFor('live-submission')).toBe(1);
  });

  it('takes a purged submission’s audit trail with it, even recent entries', async () => {
    await seedSubmission('old-submission', '-400 days');
    await seedAuditRow('old-submission', '-1 day');

    await runRetentionJob();

    expect(await submissionIds()).toEqual([]);
    // ON DELETE CASCADE: no audit record may outlive the submission it describes.
    expect(await auditCountFor('old-submission')).toBe(0);
  });

  it('cuts at 365 days, not a day either side', async () => {
    await seedSubmission('just-inside', '-364 days');
    await seedSubmission('just-outside', '-366 days');

    await runRetentionJob();

    expect(await submissionIds()).toEqual(['just-inside']);
  });

  // Regression: the cutoff must be rendered as '...THH:MM:SS.sssZ' like the stored
  // values. datetime() puts a space where the 'T' goes, and 'T' > ' ' in a text
  // compare, so a row on the boundary day used to survive an extra day.
  it('purges a row that is past the cutoff by only hours', async () => {
    await seedSubmission('twelve-hours-past', '-8772 hours'); // 365 days + 12h
    await seedSubmission('twelve-hours-short', '-8748 hours'); // 364 days + 12h

    await runRetentionJob();

    expect(await submissionIds()).toEqual(['twelve-hours-short']);
  });

  it('is safe to run when there is nothing to purge', async () => {
    await seedSubmission('recent-submission', '-1 day');

    await runRetentionJob();
    await runRetentionJob();

    expect(await submissionIds()).toEqual(['recent-submission']);
  });
});
