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

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
