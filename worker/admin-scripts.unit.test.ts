import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { parse } from 'acorn';

// Unit-level guard for the volunteer desk's server-rendered <script> block.
// worker/index.ts builds its client-side script as a TypeScript template literal, so any escape
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

async function fetchDeskHtml(path: string): Promise<string> {
  const response = await exports.default.fetch(`http://localhost${path}`);
  expect(response.status).toBe(200);
  return response.text();
}

describe('admin inline scripts', () => {
  it('renders syntactically valid JavaScript', async () => {
    const script = await extractInlineScript('/admin');
    expect(() => parse(script, { ecmaVersion: 'latest' })).not.toThrow();
  });
});

describe('desk chrome', () => {
  it('gives the desk a visible skip link, 44px filters, and a scalable viewport', async () => {
    const html = await fetchDeskHtml('/admin');
    expect(html).toContain('content="width=device-width, initial-scale=1"');
    expect(html).toMatch(/\.skip\{[^}]*background:var\(--gold\)/);
    expect(html).toMatch(/\.filters button\{[^}]*min-height:44px/);
    expect(html).toContain('<nav class="desk-nav" aria-label="Desk sections">');
    expect(html).toContain('href="https://cms.macon170.com/admin/calendar"');
    // Every list the volunteer scans is a real list with a name, not an aria-labelled div.
    expect(html).toMatch(/<ul id="(list|event-list)"[^>]*aria-label="[^"]+"/);
  });

  it('states inquiry status in words, never in colour alone', async () => {
    const html = await fetchDeskHtml('/admin');
    const script = await extractInlineScript('/admin');
    // The old bare mark: an empty span whose only signal was its background colour.
    expect(script).not.toContain('<span class="dot ');
    expect(script).toContain('STATUS_LABEL');
    for (const label of ['New', 'In progress', 'Resolved', 'Spam']) {
      expect(script).toContain(`'${label}'`);
    }
    // The chip's fill and dot reinforce the label; they must not be its only carrier.
    expect(html).toMatch(/\.state\{[^}]*display:inline-flex/);
  });
});
