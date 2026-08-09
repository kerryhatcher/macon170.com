export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === 'macon170.com') {
      const destination = new URL(request.url);
      destination.hostname = 'www.macon170.com';
      return Response.redirect(destination, 308);
    }

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return Response.json(
        { error: { code: 'not_found', message: 'Not found.' } },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store',
            'Referrer-Policy': 'no-referrer',
            'X-Content-Type-Options': 'nosniff',
          },
        },
      );
    }

    const asset = await env.ASSETS.fetch(request);

    // The magic-link token rides in this page's query string, so the response must not sit in a
    // shared cache, be indexed, or hand the token to an outbound link through the Referer header.
    // BaseLayout's `sensitive` prop emits the matching in-document tags; these headers are the half
    // a crawler or cache actually has to obey. Matching the exact path and its subtree, never a
    // prefix, so /signups/editorial/ stays an ordinary page.
    if (url.pathname === '/signups/edit' || url.pathname.startsWith('/signups/edit/')) {
      const headers = new Headers(asset.headers);
      headers.set('Referrer-Policy', 'no-referrer');
      headers.set('X-Robots-Tag', 'noindex, nofollow');
      headers.set('Cache-Control', 'no-store');
      return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
    }

    return asset;
  },
} satisfies ExportedHandler<Env>;
