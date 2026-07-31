import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

const ORIGIN = 'https://www.macon170.com';

async function sitemapUrls(): Promise<string[]> {
  const index = await exports.default.fetch(`${ORIGIN}/sitemap-index.xml`);
  expect(index.status, 'sitemap index must be published').toBe(200);

  const childPaths = [...(await index.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const urls: string[] = [];

  for (const childPath of childPaths) {
    const child = await exports.default.fetch(childPath);
    expect(child.status, `${childPath} must be published`).toBe(200);
    urls.push(...[...(await child.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  }

  return urls;
}

describe('sitemap', () => {
  it('lists every indexable page exactly once', async () => {
    const urls = await sitemapUrls();

    // 13 static routes + 6 den pages generated from `ranks` in pack.ts, minus /events/.
    expect(urls).toHaveLength(18);
    expect(new Set(urls).size).toBe(18);
  });

  it('covers the den pages generated from the ranks data', async () => {
    const urls = await sitemapUrls();

    for (const den of ['lion', 'tiger', 'wolf', 'bear', 'webelos', 'arrow-of-light']) {
      expect(urls, `den page ${den} should be listed`).toContain(`${ORIGIN}/dens/${den}/`);
    }
  });

  it('excludes the client-rendered event shell', async () => {
    const urls = await sitemapUrls();

    // /events/ renders nothing without an ?event= query, so indexing it would publish a blank page.
    expect(urls.some((url) => url.includes('/events/'))).toBe(false);
  });

  it('uses the canonical origin for every entry', async () => {
    const urls = await sitemapUrls();

    for (const url of urls) {
      expect(url.startsWith(`${ORIGIN}/`), `${url} should use the canonical origin`).toBe(true);
    }
  });
});

describe('robots.txt', () => {
  it('is served from this repository rather than the Cloudflare edge default', async () => {
    const response = await exports.default.fetch(`${ORIGIN}/robots.txt`);

    expect(response.status).toBe(200);
    // Cloudflare's managed file is entirely comments and defines no directives.
    expect(await response.text()).toContain('User-agent: *');
  });

  it('points crawlers at the sitemap index', async () => {
    const body = await (await exports.default.fetch(`${ORIGIN}/robots.txt`)).text();

    // @astrojs/sitemap emits an index plus numbered children; nothing exists at /sitemap.xml.
    expect(body).toContain(`Sitemap: ${ORIGIN}/sitemap-index.xml`);
  });

  it('declares the pack content signals explicitly', async () => {
    const body = await (await exports.default.fetch(`${ORIGIN}/robots.txt`)).text();

    expect(body).toContain('Content-Signal: search=yes, ai-input=yes, ai-train=no');
  });

  it('never disallows a path that relies on a noindex tag', async () => {
    const body = await (await exports.default.fetch(`${ORIGIN}/robots.txt`)).text();

    // A disallowed page is never fetched, so its noindex is never read, and the URL can still
    // surface as a bare link. Disallow and noindex are mutually exclusive tools.
    expect(body).not.toContain('Disallow: /events/');
    expect(body).not.toContain('Disallow: /');
  });
});

describe('indexability', () => {
  it('marks the client-rendered event shell noindex', async () => {
    const response = await exports.default.fetch(`${ORIGIN}/events/`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<meta name="robots" content="noindex"');
  });

  it('keeps the event shell crawlable so the noindex tag can be read', async () => {
    const robots = await (await exports.default.fetch(`${ORIGIN}/robots.txt`)).text();

    expect(robots).not.toContain('Disallow: /events/');
  });

  it('leaves genuinely indexable pages unmarked', async () => {
    for (const path of ['/', '/join/', '/calendar/', '/about/', '/dens/lion/']) {
      const html = await (await exports.default.fetch(`${ORIGIN}${path}`)).text();
      expect(html, `${path} must stay indexable`).not.toContain('name="robots"');
    }
  });
});

describe('structured data', () => {
  async function jsonLdBlocks(path: string): Promise<Record<string, unknown>[]> {
    const html = await (await exports.default.fetch(`${ORIGIN}${path}`)).text();
    return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  }

  it('publishes Organization schema on every page', async () => {
    for (const path of ['/', '/about/', '/calendar/', '/dens/lion/']) {
      const org = (await jsonLdBlocks(path)).find((s) => s['@type'] === 'Organization');
      expect(org, `${path} should carry Organization schema`).toBeDefined();
      expect(org?.['@id']).toBe(`${ORIGIN}/#organization`);
    }
  });

  it('emits JSON-LD that parses as valid JSON, not HTML-escaped text', async () => {
    // A missing set:html directive produces &quot; entities that break every consumer.
    const html = await (await exports.default.fetch(`${ORIGIN}/`)).text();
    expect(html).not.toContain('&quot;@context&quot;');
  });

  it('serves Event schema for the published calendar', async () => {
    const events = (await jsonLdBlocks('/calendar/')).filter((s) => s['@type'] === 'Event');

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.startDate, 'every Event needs a startDate').toBeTruthy();
      expect(event.organizer).toEqual({ '@id': `${ORIGIN}/#organization` });
      expect(event.endDate ?? 'absent').not.toBeNull();
    }
  });

  it('puts real event dates in the calendar HTML, not just in JavaScript', async () => {
    const html = await (await exports.default.fetch(`${ORIGIN}/calendar/`)).text();

    // The whole point of the build-time fetch: a crawler that runs no JS still sees the dates.
    expect(html).toContain('timeline__row');
    expect(html).not.toContain('No milestone dates are published yet');
  });

  it('names the real next event in server-rendered HTML on every page', async () => {
    for (const path of ['/', '/join/', '/about/']) {
      const html = await (await exports.default.fetch(`${ORIGIN}${path}`)).text();
      expect(html, `${path} should not ship the placeholder`).not.toContain('The next date is being added');
      expect(html, `${path} should link the next event`).toContain('/events/?event=');
    }
  });

  it('publishes a three-step breadcrumb on every den page', async () => {
    for (const den of ['lion', 'tiger', 'wolf', 'bear', 'webelos', 'arrow-of-light']) {
      const crumb = (await jsonLdBlocks(`/dens/${den}/`)).find((s) => s['@type'] === 'BreadcrumbList');
      expect(crumb, `${den} should carry a breadcrumb`).toBeDefined();
      const items = crumb?.itemListElement as Array<Record<string, unknown>>;
      expect(items).toHaveLength(3);
      expect(items[2].item).toBe(`${ORIGIN}/dens/${den}/`);
    }
  });
});
