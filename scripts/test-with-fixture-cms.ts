// `bun run test` runs this instead of `bun run build && vitest run` directly.
//
// `astro build` fetches published calendar events at build time so a crawler running no
// JavaScript still sees real dates (see src/pages/calendar/index.astro and
// src/layouts/BaseLayout.astro). Pointed at the real CMS, that made `bun run test` depend on
// cms.macon170.com being reachable *and* non-empty: worker/seo-artifacts.test.ts asserts real
// event content baked into the build output, so a CMS outage failed the test step even though
// the build itself is designed to tolerate one (it logs a warning and ships a fallback instead of
// failing — see the try/catch around getCalendarEvents() in those files).
//
// This script starts a local HTTP server serving deterministic fixture events (shaped from the
// real CMS contract, but with synthetic content — see fixtures/calendar-events.json), points
// PUBLIC_CALENDAR_CMS_ORIGIN at it for the build only, then runs vitest against that build. The
// fixture server is always stopped before this script exits, including when the build or the
// tests fail, so a failed `bun run test` never leaves an orphaned port bound.
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';
import calendarEvents from './fixtures/calendar-events.json' with { type: 'json' };

const EVENTS_PATH = '/api/calendar/v1/events';
const EVENT_PATH_PREFIX = `${EVENTS_PATH}/`;

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(payload);
}

function handleRequest(request: IncomingMessage, response: ServerResponse): void {
  const url = new URL(request.url ?? '/', 'http://fixture-cms.invalid');

  if (url.pathname === EVENTS_PATH) {
    sendJson(response, 200, { version: 'v1', events: calendarEvents });
    return;
  }

  if (url.pathname.startsWith(EVENT_PATH_PREFIX)) {
    const slug = decodeURIComponent(url.pathname.slice(EVENT_PATH_PREFIX.length));
    const event = calendarEvents.find((candidate) => candidate.slug === slug);
    if (!event) {
      sendJson(response, 404, { error: { code: 'not_found' } });
      return;
    }
    sendJson(response, 200, { version: 'v1', event });
    return;
  }

  sendJson(response, 404, { error: { code: 'not_found' } });
}

function startFixtureServer(): Promise<{ origin: string; stop: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = createServer(handleRequest);
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        reject(new Error('fixture CMS server did not bind to a TCP port'));
        return;
      }
      resolve({
        origin: `http://127.0.0.1:${address.port}`,
        stop: () => new Promise((resolveStop) => server.close(() => resolveStop())),
      });
    });
  });
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env });
    child.on('error', reject);
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

async function main(): Promise<number> {
  const fixtureServer = await startFixtureServer();
  process.stderr.write(`[fixture-cms] serving ${calendarEvents.length} fixture events at ${fixtureServer.origin}\n`);

  try {
    const buildCode = await run('bun', ['run', 'build'], { ...process.env, PUBLIC_CALENDAR_CMS_ORIGIN: fixtureServer.origin });
    if (buildCode !== 0) return buildCode;

    return await run('bun', ['run', 'test:unit'], process.env);
  } finally {
    await fixtureServer.stop();
    process.stderr.write('[fixture-cms] stopped\n');
  }
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error('[fixture-cms] failed to run the build/test pipeline:', error);
    process.exit(1);
  },
);
