// Origins the site genuinely loads from. Everything else referenced in src/ is an outbound
// anchor href, which CSP does not govern.
const TURNSTILE = 'https://challenges.cloudflare.com';
const CMS = 'https://cms.macon170.com';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' ${TURNSTILE}`,
  `frame-src ${TURNSTILE}`,
  `connect-src 'self' ${CMS}`,
  // The contact form posts straight to the CMS rather than through this Worker.
  `form-action 'self' ${CMS}`,
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

// No `preload`. Preloading is a near-irreversible commitment recorded in browser binaries,
// and it is not needed to close the audit finding.
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  // Report-Only until the two known inline-content violations are resolved: the inline style
  // attribute in SiteHeader.astro and the deliberately inline Turnstile callback script in
  // contact.astro. Enforcing before then would break the contact form.
  'Content-Security-Policy-Report-Only': CONTENT_SECURITY_POLICY,
};

// Astro content-hashes everything under /_astro/, so a changed file is a changed URL.
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
// Files copied verbatim from public/ keep stable names, so they must stay replaceable.
const STABLE_ASSET_CACHE = 'public, max-age=604800';
const STABLE_ASSET_PATHS = new Set(['/favicon.svg', '/apple-touch-icon.png', '/site.webmanifest']);

function cacheControlFor(pathname: string): string | null {
  if (pathname.startsWith('/_astro/')) return IMMUTABLE_CACHE;
  if (pathname.startsWith('/logo/') || STABLE_ASSET_PATHS.has(pathname)) return STABLE_ASSET_CACHE;
  return null;
}

export function withSiteHeaders(request: Request, response: Response): Response {
  // Responses from the ASSETS binding have immutable headers, so copy before mutating.
  const result = new Response(response.body, response);

  if ((result.headers.get('content-type') ?? '').includes('text/html')) {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      result.headers.set(name, value);
    }
  }

  const cacheControl = cacheControlFor(new URL(request.url).pathname);
  if (cacheControl) result.headers.set('Cache-Control', cacheControl);

  return result;
}
