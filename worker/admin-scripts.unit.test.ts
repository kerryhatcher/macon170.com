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

async function fetchDeskHtml(path: string): Promise<string> {
  const response = await exports.default.fetch(`http://localhost${path}`);
  expect(response.status).toBe(200);
  return response.text();
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

// The two desk pages each used to carry a private copy of their chrome, and they drifted:
// the calendar editor's skip link lost its background (invisible on focus over the dark
// header), its filter buttons fell under 44px, and its filter row lost its accessible name.
// These assert the shared chrome in desk-chrome.ts actually reaches both pages, so the
// divergence cannot come back unnoticed.
describe('shared desk chrome', () => {
  it.each([
    ['/admin', 'volunteer desk'],
    ['/admin/calendar', 'calendar editor'],
  ])('gives %s (%s) a visible skip link, 44px filters, and a scalable viewport', async (path) => {
    const html = await fetchDeskHtml(path);
    expect(html).toContain('content="width=device-width, initial-scale=1"');
    expect(html).toMatch(/\.skip\{[^}]*background:var\(--gold\)/);
    expect(html).toMatch(/\.filters button\{[^}]*min-height:44px/);
    expect(html).toContain('<nav class="desk-nav" aria-label="Desk sections">');
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
