import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { EventRouteError, handleEventRoute } from './event-routes';
import { renderCalendarAdmin } from './calendar-admin';

type WorkerEnv = Env & { TURNSTILE_SECRET: string };
type SubmissionStatus = 'new' | 'in_progress' | 'resolved' | 'spam';

type SubmissionRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: SubmissionStatus;
  parent_name: string;
  email: string;
  phone: string | null;
  child_grade: string | null;
  topic: string;
  message: string;
  source_path: string;
  country_code: string | null;
  assigned_to: string | null;
  resolved_at: string | null;
  last_viewed_at: string | null;
};

type AccessIdentity = JWTPayload & { email?: string };

type TurnstileResult = {
  success: boolean;
  hostname?: string;
  challenge_ts?: string;
  action?: string;
  'error-codes'?: string[];
};

const MAX_FORM_BYTES = 24_000;
const ALLOWED_TOPICS = new Set([
  'Planning a first visit',
  'Calendar or event detail',
  'Finding my child’s den',
  'Volunteering',
  'Website or privacy question',
  'Something else',
]);
const ALLOWED_GRADES = new Set(['', 'Kindergarten', '1st grade', '2nd grade', '3rd grade', '4th grade', '5th grade']);
const ALLOWED_STATUSES = new Set<SubmissionStatus>(['new', 'in_progress', 'resolved', 'spam']);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const runtimeEnv = env as WorkerEnv;
    const url = new URL(request.url);

    try {
      if (url.hostname === 'macon170.com') {
        const destination = new URL(request.url);
        destination.hostname = 'www.macon170.com';
        return Response.redirect(destination.toString(), 308);
      }

      if (url.pathname === '/api/contact' && request.method === 'POST') {
        return await handleContactSubmission(request, runtimeEnv);
      }

      const adminHostname = new URL(env.ADMIN_ORIGIN).hostname;
      const localAdmin = String(env.ENVIRONMENT) === 'development' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
      if (url.pathname.startsWith('/api/admin/') && url.hostname !== adminHostname && !localAdmin) {
        throw new HttpError(404, 'Not found.');
      }

      const eventResponse = await handleEventRoute({
        request,
        env,
        url,
        requireAccess,
        enforceSameOrigin,
        json,
        publicHeaders,
        adminHeaders,
      });
      if (eventResponse) return eventResponse;

      if (url.pathname === '/api/admin/submissions' && request.method === 'GET') {
        const identity = await requireAccess(request, env);
        return await listSubmissions(request, env, identity);
      }

      const submissionMatch = url.pathname.match(/^\/api\/admin\/submissions\/([0-9a-f-]{36})$/i);
      if (submissionMatch && request.method === 'GET') {
        const identity = await requireAccess(request, env);
        return await getSubmission(submissionMatch[1], env, identity);
      }
      if (submissionMatch && request.method === 'PATCH') {
        const identity = await requireAccess(request, env);
        return await updateSubmission(request, submissionMatch[1], env, identity);
      }

      if (url.hostname === new URL(env.ADMIN_ORIGIN).hostname || url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
        const identity = await requireAccess(request, env);
        if (url.pathname === '/calendar' || url.pathname === '/admin/calendar') {
          return renderCalendarAdmin(identity.email ?? 'Authorized volunteer', env, adminHeaders(env));
        }
        return renderAdminShell(identity.email ?? 'Authorized volunteer', env);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      if (error instanceof HttpError || error instanceof EventRouteError) {
        return json({ ok: false, error: error.message }, error.status, securityHeaders());
      }
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed: calendar_events.slug')) {
        return json({ ok: false, error: 'Another event already uses that URL slug.' }, 409, securityHeaders());
      }
      console.error(JSON.stringify({ event: 'request_failed', path: url.pathname, error: error instanceof Error ? error.message : 'Unknown error' }));
      return json({ ok: false, error: 'Something went wrong. Please try again.' }, 500, securityHeaders());
    }
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const retentionDays = 365;
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM submission_audit_log WHERE created_at < datetime('now', ?)`)
        .bind(`-${retentionDays} days`),
      env.DB.prepare(`DELETE FROM contact_submissions WHERE created_at < datetime('now', ?)`)
        .bind(`-${retentionDays} days`),
    ]);
    console.log(JSON.stringify({ event: 'retention_cleanup', retentionDays }));
  },
} satisfies ExportedHandler<Env>;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function handleContactSubmission(request: Request, env: WorkerEnv): Promise<Response> {
  enforceSameOrigin(request, env.PUBLIC_SITE_ORIGIN);
  enforceBodyLimit(request, MAX_FORM_BYTES);

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/x-www-form-urlencoded') && !contentType.includes('multipart/form-data')) {
    throw new HttpError(415, 'Please submit the contact form normally.');
  }

  const form = await readBoundedFormData(request, MAX_FORM_BYTES);
  if (clean(form.get('website'), 100)) {
    return redirectToContact('success');
  }

  const parentName = required(form.get('parentName'), 'Parent or guardian name', 2, 120);
  const email = required(form.get('email'), 'Email', 5, 254).toLowerCase();
  const phone = optional(form.get('phone'), 40);
  const childGrade = optional(form.get('childGrade'), 30);
  const topic = required(form.get('topic'), 'Topic', 2, 80);
  const message = required(form.get('message'), 'Question', 10, 4_000);
  const turnstileToken = required(form.get('cf-turnstile-response'), 'Security check', 1, 2_048);

  if (!isEmail(email)) throw new HttpError(400, 'Enter a valid parent or guardian email address.');
  if (!ALLOWED_TOPICS.has(topic)) throw new HttpError(400, 'Choose a valid topic.');
  if (!ALLOWED_GRADES.has(childGrade ?? '')) throw new HttpError(400, 'Choose a valid grade.');

  const rateKey = await stableHash(`${email}|${request.headers.get('cf-connecting-ip') ?? 'unknown'}`);
  const rateLimit = await env.CONTACT_RATE_LIMITER.limit({ key: rateKey });
  if (!rateLimit.success) throw new HttpError(429, 'Too many messages were submitted. Please wait a minute and try again.');

  const verification = await verifyTurnstile(turnstileToken, request, env);
  if (!verification.success) {
    console.warn(JSON.stringify({ event: 'turnstile_rejected', codes: verification['error-codes'] ?? [] }));
    throw new HttpError(400, 'The security check expired or failed. Refresh the page and try again.');
  }

  const expectedHosts = env.TURNSTILE_EXPECTED_HOSTNAMES.split(',').map((value) => value.trim());
  const isDevelopment = String(env.ENVIRONMENT) === 'development';
  if (verification.hostname && !expectedHosts.includes(verification.hostname) && !isDevelopment) {
    throw new HttpError(400, 'The security check was issued for a different website.');
  }
  if (verification.action && verification.action !== 'turnstile-spin-v2' && !isDevelopment) {
    throw new HttpError(400, 'The security check did not match this form.');
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO contact_submissions (
      id, parent_name, email, phone, child_grade, topic, message,
      source_path, user_agent, country_code, turnstile_hostname, turnstile_challenge_ts
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    parentName,
    email,
    phone,
    childGrade,
    topic,
    message,
    '/contact/',
    truncate(request.headers.get('user-agent'), 500),
    truncate(request.headers.get('cf-ipcountry'), 2),
    verification.hostname ?? null,
    verification.challenge_ts ?? null,
  ).run();

  console.log(JSON.stringify({ event: 'contact_created', id, topic, country: request.headers.get('cf-ipcountry') ?? null }));
  return redirectToContact('success');
}

async function listSubmissions(request: Request, env: Env, identity: AccessIdentity): Promise<Response> {
  const url = new URL(request.url);
  const rawStatus = url.searchParams.get('status') ?? '';
  const status = ALLOWED_STATUSES.has(rawStatus as SubmissionStatus) ? rawStatus as SubmissionStatus : null;
  const page = Math.max(1, Math.min(1_000, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1));
  const limit = 25;
  const offset = (page - 1) * limit;

  const where = status ? 'WHERE status = ?' : '';
  const statement = env.DB.prepare(`
    SELECT id, created_at, updated_at, status, parent_name, email, phone, child_grade,
           topic, message, source_path, country_code, assigned_to, resolved_at, last_viewed_at
    FROM contact_submissions ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  const bound = status ? statement.bind(status, limit, offset) : statement.bind(limit, offset);
  const result = await bound.all<SubmissionRow>();

  console.log(JSON.stringify({ event: 'admin_list', actor: identity.email ?? 'unknown', status, page, count: result.results.length }));
  return json({ ok: true, submissions: result.results, page, hasMore: result.results.length === limit }, 200, adminHeaders(env));
}

async function getSubmission(id: string, env: Env, identity: AccessIdentity): Promise<Response> {
  const submission = await env.DB.prepare(`
    SELECT id, created_at, updated_at, status, parent_name, email, phone, child_grade,
           topic, message, source_path, country_code, assigned_to, resolved_at, last_viewed_at
    FROM contact_submissions WHERE id = ?
  `).bind(id).first<SubmissionRow>();
  if (!submission) throw new HttpError(404, 'Submission not found.');

  const actor = identity.email ?? 'unknown';
  await env.DB.batch([
    env.DB.prepare("UPDATE contact_submissions SET last_viewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").bind(id),
    env.DB.prepare("INSERT INTO submission_audit_log (submission_id, actor_email, action) VALUES (?, ?, 'viewed')").bind(id, actor),
  ]);

  return json({ ok: true, submission }, 200, adminHeaders(env));
}

async function updateSubmission(request: Request, id: string, env: Env, identity: AccessIdentity): Promise<Response> {
  enforceSameOrigin(request, env.ADMIN_ORIGIN);
  enforceBodyLimit(request, 2_000);

  const body = await request.json<{ status?: string }>();
  if (!body.status || !ALLOWED_STATUSES.has(body.status as SubmissionStatus)) {
    throw new HttpError(400, 'Choose a valid submission status.');
  }

  const existing = await env.DB.prepare('SELECT status FROM contact_submissions WHERE id = ?').bind(id).first<{ status: SubmissionStatus }>();
  if (!existing) throw new HttpError(404, 'Submission not found.');

  const actor = identity.email ?? 'unknown';
  const resolvedAt = body.status === 'resolved' ? new Date().toISOString() : null;
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE contact_submissions
      SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), resolved_at = ?
      WHERE id = ?
    `).bind(body.status, resolvedAt, id),
    env.DB.prepare(`
      INSERT INTO submission_audit_log (submission_id, actor_email, action, detail)
      VALUES (?, ?, 'status_changed', ?)
    `).bind(id, actor, `${existing.status} -> ${body.status}`),
  ]);

  console.log(JSON.stringify({ event: 'admin_status_changed', actor, id, from: existing.status, to: body.status }));
  return json({ ok: true, status: body.status }, 200, adminHeaders(env));
}

async function verifyTurnstile(token: string, request: Request, env: WorkerEnv): Promise<TurnstileResult> {
  const form = new FormData();
  form.set('secret', env.TURNSTILE_SECRET);
  form.set('response', token);
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) form.set('remoteip', ip);
  form.set('idempotency_key', crypto.randomUUID());

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  if (!response.ok) return { success: false, 'error-codes': ['siteverify-unavailable'] };
  return response.json<TurnstileResult>();
}

async function requireAccess(request: Request, env: Env): Promise<AccessIdentity> {
  const hostname = new URL(request.url).hostname;
  if (String(env.ENVIRONMENT) === 'development' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    return { email: 'local-volunteer@example.invalid', sub: 'local-development' };
  }
  if (env.ACCESS_TEAM_DOMAIN.includes('REPLACE-ME') || env.ACCESS_AUD.includes('REPLACE_')) {
    throw new HttpError(503, 'Cloudflare Access is not configured yet.');
  }

  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) throw new HttpError(403, 'A valid Cloudflare Access session is required.');

  const teamDomain = env.ACCESS_TEAM_DOMAIN.replace(/\/$/, '');
  const jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: teamDomain, audience: env.ACCESS_AUD });
    if (typeof payload.email !== 'string' || !isEmail(payload.email)) {
      throw new Error('Missing verified email claim');
    }
    return payload as AccessIdentity;
  } catch {
    throw new HttpError(403, 'Your Cloudflare Access session is invalid or expired.');
  }
}

function renderAdminShell(email: string, env: Env): Response {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Pack 170 volunteer desk</title><style>${adminCss()}</style></head>
<body><a class="skip" href="#main">Skip to submissions</a><header><div class="brand"><span>170</span><div><b>Pack 170</b><small>Volunteer desk</small></div></div><nav class="admin-nav"><a aria-current="page" href="/">Parent inquiries</a><a href="/calendar">Calendar editor</a></nav><div class="identity"><small>Signed in with Cloudflare Access</small><strong>${escapeHtml(email)}</strong></div></header>
<main id="main"><section class="intro"><div><p class="tab">Parent inquiries</p><h1>Volunteer desk</h1><p>Read parent questions, follow up through approved adult channels, and keep the queue current.</p></div><div class="safety"><b>Youth safety</b><span>These are parent-to-adult messages. Do not move a conversation into a private adult–youth channel.</span></div></section>
<nav class="filters" aria-label="Submission status"><button data-status="" aria-pressed="true">All</button><button data-status="new">New</button><button data-status="in_progress">In progress</button><button data-status="resolved">Resolved</button><button data-status="spam">Spam</button></nav>
<div id="status" class="status" role="status">Loading submissions…</div><section class="desk"><div id="list" class="list" aria-label="Submissions"></div><article id="detail" class="detail"><div class="empty"><b>Select a message</b><span>Parent contact details and the full question will appear here.</span></div></article></section></main>
<script>${adminScript(env.ADMIN_ORIGIN)}</script></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', ...adminHeaders(env) } });
}

function adminScript(adminOrigin: string): string {
  return `const ADMIN_ORIGIN=${JSON.stringify(adminOrigin)};
const API='/api/admin/submissions';
let currentStatus='';let selectedId=null;
const list=document.querySelector('#list');const detail=document.querySelector('#detail');const status=document.querySelector('#status');
const esc=(v)=>{const s=String(v??'');return s.replace(/[&<>"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/'/g,'&#039;');};
const fmt=(v)=>new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));
async function load(){status.textContent='Loading submissions…';try{const r=await fetch(API+(currentStatus?'?status='+encodeURIComponent(currentStatus):''));if(!r.ok){const txt=await r.text();throw new Error('Unable to load submissions. ('+r.status+': '+txt.slice(0,120)+')');}const data=await r.json();renderList(data.submissions);status.textContent=data.submissions.length?data.submissions.length+' message'+(data.submissions.length===1?'':'s')+' shown':'No messages in this view.';}catch(e){status.textContent=e instanceof Error?e.message:'Unable to load submissions.';}}
function renderList(rows){list.innerHTML=rows.map((row)=>'<button class="row '+(row.id===selectedId?'active':'')+'" data-id="'+esc(row.id)+'"><span class="dot '+esc(row.status)+'"></span><span><b>'+esc(row.parent_name)+'</b><small>'+esc(row.topic)+'</small><small>'+fmt(row.created_at)+'</small></span></button>').join('');list.querySelectorAll('[data-id]').forEach((button)=>button.addEventListener('click',()=>openOne(button.dataset.id)));}
async function openOne(id){selectedId=id;renderListSelection();detail.innerHTML='<div class="empty">Loading message…</div>';const r=await fetch(API+'/'+encodeURIComponent(id));if(!r.ok){detail.innerHTML='<div class="empty">Unable to load this message.</div>';return;}const data=await r.json();renderDetail(data.submission);}
function renderListSelection(){list.querySelectorAll('[data-id]').forEach((button)=>button.classList.toggle('active',button.dataset.id===selectedId));}
function renderDetail(s){const phone=s.phone?'<a href="tel:'+esc(s.phone)+'">'+esc(s.phone)+'</a>':'Not supplied';const grade=s.child_grade?esc(s.child_grade):'Not supplied';detail.innerHTML='<div class="detail-head"><div><p class="tab">'+esc(s.topic)+'</p><h2>'+esc(s.parent_name)+'</h2><p>'+fmt(s.created_at)+'</p></div><select id="submission-status" aria-label="Submission status"><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="spam">Spam</option></select></div><dl><div><dt>Email</dt><dd><a href="mailto:'+esc(s.email)+'">'+esc(s.email)+'</a></dd></div><div><dt>Phone</dt><dd>'+phone+'</dd></div><div><dt>Child grade</dt><dd>'+grade+'</dd></div><div><dt>Country</dt><dd>'+esc(s.country_code||'Not available')+'</dd></div></dl><section class="message"><h3>Parent question</h3><p>'+esc(s.message).replace(/\\n/g,'<br>')+'</p></section><p class="privacy">Use these details only to respond to this pack inquiry. Do not copy them into unapproved systems.</p>';const select=document.querySelector('#submission-status');select.value=s.status;select.addEventListener('change',()=>updateStatus(s.id,select.value,select));}
async function updateStatus(id,next,select){select.disabled=true;status.textContent='Saving status…';try{const r=await fetch(API+'/'+encodeURIComponent(id),{method:'PATCH',headers:{'content-type':'application/json','origin':ADMIN_ORIGIN},body:JSON.stringify({status:next})});if(!r.ok)throw new Error('Unable to save status.');status.textContent='Status saved.';await load();}catch(e){status.textContent=e instanceof Error?e.message:'Unable to save status.';}finally{select.disabled=false;}}
document.querySelectorAll('[data-status]').forEach((button)=>button.addEventListener('click',()=>{currentStatus=button.dataset.status||'';selectedId=null;document.querySelectorAll('[data-status]').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));detail.innerHTML='<div class="empty"><b>Select a message</b><span>Parent contact details and the full question will appear here.</span></div>';load();}));load();`;
}

function adminCss(): string {
  return `:root{--blue:#003f87;--deep:#002b5c;--gold:#fcd116;--paper:#f7f1e3;--page:#fffdf7;--ink:#272b2e;--muted:#59636b;--rule:#d7cdb8;--green:#28543f;--red:#a33c34}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,sans-serif}button,select{font:inherit}:focus-visible{outline:4px solid var(--gold);outline-offset:3px}.skip{position:fixed;top:-5rem;left:1rem;background:var(--gold);color:var(--deep);padding:.75rem;z-index:10}.skip:focus{top:1rem}header{min-height:76px;padding:.75rem max(1rem,calc((100% - 1200px)/2));display:flex;justify-content:space-between;align-items:center;gap:1rem;background:var(--deep);color:white;border-bottom:6px solid var(--gold)}.brand,.identity{display:flex;align-items:center;gap:.75rem}.brand>span{display:grid;place-items:center;width:44px;height:44px;border:3px solid var(--gold);border-radius:50%;color:var(--gold);font-weight:900}.brand b,.brand small,.identity strong,.identity small{display:block}.admin-nav{display:flex;align-self:stretch}.admin-nav a{display:grid;place-items:center;padding:0 1rem;color:white;text-decoration:none;font-weight:700}.admin-nav a[aria-current=page]{background:var(--gold);color:var(--deep)}.identity{margin-left:auto;text-align:right}.identity small{color:#bed1e5}.tab{display:inline-block;margin:0 0 .5rem;padding:.35rem .65rem;border-radius:4px 10px 10px 4px;background:var(--gold);color:var(--deep);font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em}main{width:min(1200px,calc(100% - 2rem));margin:2.5rem auto}.intro{display:grid;grid-template-columns:1fr 360px;gap:3rem;align-items:end}.intro h1{font-size:clamp(2.5rem,7vw,4.8rem);line-height:1;margin:0}.intro>div>p:last-child{max-width:60ch;font-size:1.1rem}.safety{display:grid;gap:.35rem;padding:1.25rem;background:var(--green);color:white;border-radius:6px 18px 8px 6px;box-shadow:5px 7px 0 rgba(0,43,92,.16)}.filters{display:flex;gap:.5rem;margin:2rem 0 1rem;overflow:auto;padding-bottom:.25rem}.filters button{min-height:44px;padding:.55rem .9rem;border:2px solid var(--deep);border-radius:7px;background:var(--page);color:var(--deep);font-weight:700;white-space:nowrap}.filters button[aria-pressed=true]{background:var(--deep);color:white}.status{min-height:1.5rem;margin-bottom:.75rem;color:var(--muted)}.desk{display:grid;grid-template-columns:370px 1fr;min-height:570px;border:1px solid var(--rule);border-radius:8px 22px 12px 8px;overflow:hidden;background:var(--page);box-shadow:8px 10px 0 rgba(0,43,92,.12),0 18px 42px rgba(39,43,46,.12)}.list{border-right:1px solid var(--rule);background:#f2ead9}.row{display:grid;grid-template-columns:auto 1fr;gap:.8rem;width:100%;padding:1rem;text-align:left;border:0;border-bottom:1px solid var(--rule);background:transparent;color:var(--ink);cursor:pointer}.row:hover,.row.active{background:white}.row.active{box-shadow:inset 5px 0 var(--blue)}.row b,.row small{display:block}.row small{color:var(--muted);margin-top:.15rem}.dot{width:12px;height:12px;margin-top:.35rem;border-radius:50%;background:#82909a}.dot.new{background:var(--red)}.dot.in_progress{background:#d39b00}.dot.resolved{background:#34815e}.detail{padding:clamp(1.5rem,4vw,3rem)}.empty{display:grid;place-items:center;align-content:center;gap:.4rem;min-height:400px;text-align:center;color:var(--muted)}.empty b{color:var(--deep);font-size:1.3rem}.detail-head{display:flex;justify-content:space-between;gap:2rem;align-items:start;padding-bottom:1.5rem;border-bottom:3px solid var(--blue)}.detail-head h2{font-size:2rem;margin:0}.detail-head p:last-child{margin:.35rem 0 0;color:var(--muted)}select{min-height:44px;padding:.5rem;border:2px solid var(--blue);border-radius:7px;background:white}.detail dl{margin:1.5rem 0}.detail dl div{display:grid;grid-template-columns:130px 1fr;padding:.65rem 0;border-bottom:1px solid var(--rule)}dt{font-weight:800;color:var(--deep)}dd{margin:0}.detail a{color:var(--blue)}.message{margin-top:2rem;padding:1.5rem;background:#f7f1e3;border-radius:6px 16px 8px 6px}.message h3{margin-top:0;color:var(--deep)}.privacy{margin-top:2rem;color:var(--muted);font-size:.9rem}@media(max-width:800px){header{align-items:flex-start}.identity small{display:none}.intro,.desk{grid-template-columns:1fr}.intro{gap:1rem}.desk{overflow:visible}.list{border-right:0;max-height:360px;overflow:auto}.detail{border-top:1px solid var(--rule)}.detail-head{display:grid}.detail dl div{grid-template-columns:1fr}dt{margin-bottom:.2rem}}`;
}

function enforceBodyLimit(request: Request, maximum: number): void {
  const rawLength = request.headers.get('content-length');
  if (!rawLength) return;
  const length = Number.parseInt(rawLength, 10);
  if (!Number.isFinite(length) || length < 0 || length > maximum) throw new HttpError(413, 'That message is too large.');
}

async function readBoundedFormData(request: Request, maximum: number): Promise<FormData> {
  if (!request.body) throw new HttpError(400, 'The form was empty.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximum) {
      await reader.cancel('Form body exceeded limit');
      throw new HttpError(413, 'That message is too large.');
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const boundedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body,
  });
  return boundedRequest.formData();
}

function enforceSameOrigin(request: Request, allowedOrigin: string): void {
  const origin = request.headers.get('origin');
  if (origin !== allowedOrigin) throw new HttpError(403, 'This request came from an unexpected website.');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') throw new HttpError(403, 'Cross-site changes are not allowed.');
}

function required(value: FormDataEntryValue | null, label: string, minimum: number, maximum: number): string {
  const result = clean(value, maximum);
  if (result.length < minimum) throw new HttpError(400, `${label} is required.`);
  return result;
}

function optional(value: FormDataEntryValue | null, maximum: number): string | null {
  const result = clean(value, maximum);
  return result || null;
}

function clean(value: FormDataEntryValue | null, maximum: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\r\n/g, '\n').slice(0, maximum);
}

function truncate(value: string | null, maximum: number): string | null {
  return value ? value.slice(0, maximum) : null;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function stableHash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function redirectToContact(state: 'success'): Response {
  return new Response(null, { status: 303, headers: { location: `/contact/?submitted=${state}#contact-form`, ...securityHeaders() } });
}

function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store', ...headers } });
}

function publicHeaders(): Record<string, string> {
  return {
    ...securityHeaders(),
    'cache-control': 'public, max-age=30, s-maxage=60',
    'access-control-allow-origin': 'https://www.macon170.com',
  };
}

function securityHeaders(): Record<string, string> {
  return {
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'DENY',
  };
}

function adminHeaders(env: Env): Record<string, string> {
  return {
    ...securityHeaders(),
    'cache-control': 'no-store, private, must-revalidate',
    'cdn-cache-control': 'no-cache, no-store, must-revalidate',
    'content-security-policy': `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self' ${env.ADMIN_ORIGIN}; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character);
}