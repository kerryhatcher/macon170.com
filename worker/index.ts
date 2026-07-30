import { withSiteHeaders } from './headers';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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

    return withSiteHeaders(request, await env.ASSETS.fetch(request));
  },
} satisfies ExportedHandler<Env>;
