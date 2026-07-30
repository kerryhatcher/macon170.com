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
