import { createSonicJSApp, registerCollections } from '@sonicjs-cms/core'
import type { Bindings, SonicJSConfig } from '@sonicjs-cms/core'

import leadershipRosterCollection from './collections/leadership-roster.collection'

registerCollections([
  leadershipRosterCollection,
])

const config: SonicJSConfig = {
  collections: {
    autoSync: true,
  },
  plugins: {
    directory: './src/plugins',
    autoLoad: false,
  },
  adminAccessRoles: ['admin'],
  name: 'Pack 170 CMS',
}

const app = createSonicJSApp(config)
const disabledAuthPaths = new Set(['/auth/seed-admin', '/auth/register', '/auth/register/form'])
const publicCmsOrigins = new Set([
  'https://www.macon170.com',
  'http://localhost:41771',
  'http://kudzu:41771',
])

/**
 * Keep SonicJS's development account bootstrap and public registration routes
 * outside the application entirely. This check deliberately runs before the
 * framework so those endpoints cannot mutate the CMS database.
 */
export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (disabledAuthPaths.has(pathname)) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const response = await app.fetch(request, env, ctx)
    const origin = request.headers.get('Origin')
    if (origin && publicCmsOrigins.has(origin) && pathname.startsWith('/api/collections/')) {
      const headers = new Headers(response.headers)
      headers.set('Access-Control-Allow-Origin', origin)
      headers.append('Vary', 'Origin')
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    }

    return response
  },
}
