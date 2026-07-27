export type LeadershipRow = {
  id: string;
  slug: string;
  role: string;
  name: string | null;
  bio: string | null;
  sort_order: number;
  updated_at: string;
  updated_by: string;
};

export type PublicRole = LeadershipRow & { vacant: boolean };

type LeadershipRouteContext = {
  request: Request;
  env: Env;
  url: URL;
  requireAccess: (request: Request, env: Env) => Promise<{ email?: string }>;
  enforceSameOrigin: (request: Request, origin: string) => void;
  json: (data: unknown, status?: number, headers?: HeadersInit) => Response;
  publicHeaders: (request: Request) => Record<string, string>;
  adminHeaders: (env: Env) => Record<string, string>;
};

const fields = 'id, slug, role, name, bio, sort_order, updated_at, updated_by';

export class LeadershipRouteError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Shared by the public endpoint and the HTMLRewriter injection so both agree on
// what "vacant" means.
export async function readRoster(db: D1Database): Promise<PublicRole[]> {
  const result = await db.prepare(`SELECT ${fields} FROM leadership_roles ORDER BY sort_order ASC`).run<LeadershipRow>();
  return result.results.map((row) => ({ ...row, vacant: !row.name || row.name.trim() === '' }));
}

export async function handleLeadershipRoute(context: LeadershipRouteContext): Promise<Response | null> {
  const { request, env, url } = context;

  if (url.pathname === '/api/leadership' && request.method === 'GET') {
    const roles = await readRoster(env.DB);
    return context.json({ ok: true, roles }, 200, context.publicHeaders(request));
  }

  return null;
}
