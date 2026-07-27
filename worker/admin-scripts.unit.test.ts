import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { parse } from 'acorn';

// Unit-level guard for the admin shells' server-rendered <script> blocks. Both
// worker/index.ts (volunteer desk) and worker/calendar-admin.ts (calendar editor)
// build their client-side script as a TypeScript template literal, so any escape
// sequence written directly in that literal (e.g. \n, \t) is consumed by the
// TS/JS parser before it ever reaches the browser - turning intended regex source
// text like /\n/g into a regex containing a literal newline, which the browser
// cannot parse. That failure mode breaks the entire inline script (not just the
// line that used it) with zero server-side signal, so it needs a dedicated check
// independent of any D1 or network state.
async function extractInlineScript(path: string): Promise<string> {
  const response = await exports.default.fetch(`http://localhost${path}`);
  expect(response.status).toBe(200);
  const html = await response.text();
  const match = html.match(/<script>([\s\S]*)<\/script>/);
  if (!match) throw new Error(`No <script> block found in response for ${path}`);
  return match[1];
}

describe('admin inline scripts', () => {
  it.each([
    ['/admin', 'volunteer desk'],
    ['/admin/calendar', 'calendar editor'],
  ])('renders syntactically valid JavaScript for %s (%s)', async (path) => {
    const script = await extractInlineScript(path);
    expect(() => parse(script, { ecmaVersion: 'latest' })).not.toThrow();
  });
});
