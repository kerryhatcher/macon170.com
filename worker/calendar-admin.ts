import { annualProgram } from '../src/data/pack';
import { deskHead, deskHeader, escapeHtml } from './desk-chrome';

// Generated from annualProgram so the dropdown can never offer a key the worker would reject.
// Titles land straight in HTML, so they go through the same escapeHtml() used elsewhere in this page.
const milestoneOptions = [
  '<option value="">Not a milestone</option>',
  ...annualProgram.map((entry) => `<option value="${entry.key}">${escapeHtml(entry.title)}</option>`),
].join('');

export function renderCalendarAdmin(email: string, env: Env, headers: Record<string, string>): Response {
  const html = `<!doctype html><html lang="en">${deskHead('Pack 170 calendar editor', '1400px', css())}<body>
${deskHeader(email, 'calendar')}
<main id="main"><section class="intro"><div><p class="tab">Pack calendar</p><h1>Calendar editor</h1><p>Create events as drafts, complete the family logistics, then publish when the details are ready.</p></div><button class="primary" id="new-event">Create event</button></section>
<div id="status" class="status" role="status">Loading events…</div><section class="workspace"><aside><nav class="filters" aria-label="Event visibility"><button data-filter="" aria-pressed="true">All</button><button data-filter="draft">Drafts</button><button data-filter="published">Published</button><button data-filter="archived">Archived</button></nav><ul id="event-list" class="event-list" aria-label="Pack events"></ul></aside><form id="event-form" class="editor" aria-labelledby="editor-title"><input type="hidden" name="id"><div class="editor-head"><div><p class="tab" id="editor-mode">New event</p><h2 id="editor-title" tabindex="-1">Untitled event</h2></div><div class="actions"><button type="button" class="secondary" id="archive" hidden>Archive</button><button type="submit" class="primary">Save event</button></div></div>
<div class="form-grid"><label class="wide">Title<input name="title" maxlength="160" required></label><label>URL slug<input name="slug" maxlength="80" placeholder="generated-from-title"></label><label>Visibility<select name="visibility"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label>Category<select name="category"><option value="pack">Pack</option><option value="den">Den</option><option value="family">Family</option></select></label><label>Status<select name="status"><option value="scheduled">Scheduled</option><option value="tentative">Tentative</option><option value="cancelled">Cancelled</option></select></label><label>Milestone<select name="milestone">${milestoneOptions}</select></label><label>Starts<input name="startsAt" type="datetime-local" required></label><label>Ends<input name="endsAt" type="datetime-local"></label><label class="wide">Short summary<textarea name="summary" rows="2" maxlength="500" required></textarea></label><label class="wide">Full description<textarea name="description" rows="6" maxlength="8000" required></textarea></label><label class="wide">Who it is for<input name="audience" maxlength="300" required></label><label>Location name<input name="locationName" maxlength="200"></label><label>Address<input name="address" maxlength="300"></label><label class="wide">What to bring<textarea name="whatToBring" rows="3" maxlength="2000"></textarea></label><label>Cost or payment note<input name="cost" maxlength="500"></label><label>Registration link<input name="registrationUrl" type="url" maxlength="2000"></label><label>Timezone<input name="timezone" value="America/New_York" maxlength="80" required></label></div></form></section></main><script>${script(env.ADMIN_ORIGIN)}</script></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });
}

function script(adminOrigin: string): string {
  return `const ORIGIN=${JSON.stringify(adminOrigin)},API='/api/admin/events';let filter='',events=[],selected=null;const list=document.querySelector('#event-list'),form=document.querySelector('#event-form'),status=document.querySelector('#status'),archive=document.querySelector('#archive');const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));const displayDate=v=>new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));const localValue=v=>v?new Date(new Date(v).getTime()-new Date(v).getTimezoneOffset()*60000).toISOString().slice(0,16):'';
async function load(){status.textContent='Loading events…';const r=await fetch(API+(filter?'?visibility='+filter:''));if(!r.ok){status.textContent='Unable to load events.';return;}events=(await r.json()).events;renderList();status.textContent=events.length+(' event'+(events.length===1?'':'s'));}
function renderList(){list.innerHTML=events.length?events.map(e=>'<li><button type="button" class="event '+(selected===e.id?'active':'')+'" data-id="'+esc(e.id)+'"><span class="state '+esc(e.visibility)+'">'+esc(e.visibility)+'</span><b>'+esc(e.title)+'</b><small>'+displayDate(e.starts_at)+'</small><small>'+esc(e.location_name||'Location pending')+'</small></button></li>').join(''):'<li class="empty">No events in this view.</li>';list.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>edit(events.find(e=>e.id===b.dataset.id),true)));}
// moveFocus is set only when the volunteer chose a different event or started a new one. The
// editor pane swaps its whole contents, so focus follows it to the heading that names it -
// but never after a save, which would yank focus out of the form the volunteer is still in.
function reset(moveFocus){selected=null;form.reset();form.elements.timezone.value='America/New_York';form.elements.visibility.value='draft';form.elements.status.value='scheduled';form.elements.category.value='pack';document.querySelector('#editor-mode').textContent='New event';document.querySelector('#editor-title').textContent='Untitled event';archive.hidden=true;renderList();if(moveFocus)document.querySelector('#editor-title').focus();}
function edit(e,moveFocus){selected=e.id;form.elements.id.value=e.id;for(const [name,key] of Object.entries({title:'title',slug:'slug',visibility:'visibility',status:'status',category:'category',summary:'summary',description:'description',audience:'audience',locationName:'location_name',address:'address',whatToBring:'what_to_bring',cost:'cost',registrationUrl:'registration_url',timezone:'timezone',milestone:'milestone'}))form.elements[name].value=e[key]||'';form.elements.startsAt.value=localValue(e.starts_at);form.elements.endsAt.value=localValue(e.ends_at);document.querySelector('#editor-mode').textContent=e.visibility+' event';document.querySelector('#editor-title').textContent=e.title;archive.hidden=e.visibility==='archived';renderList();if(moveFocus)document.querySelector('#editor-title').focus();}
function payload(){const data=new FormData(form),value=n=>data.get(n)||null;return{title:value('title'),slug:value('slug'),visibility:value('visibility'),status:value('status'),category:value('category'),summary:value('summary'),description:value('description'),audience:value('audience'),locationName:value('locationName'),address:value('address'),whatToBring:value('whatToBring'),cost:value('cost'),registrationUrl:value('registrationUrl'),timezone:value('timezone'),milestone:value('milestone'),startsAt:new Date(String(value('startsAt'))).toISOString(),endsAt:value('endsAt')?new Date(String(value('endsAt'))).toISOString():null};}
form.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Saving event…';const id=form.elements.id.value;const r=await fetch(id?API+'/'+id:API,{method:id?'PUT':'POST',headers:{'content-type':'application/json','origin':ORIGIN},body:JSON.stringify(payload())});const body=await r.json();if(!r.ok){status.textContent=body.error||'Unable to save event.';return;}status.textContent='Event saved.';selected=body.id;await load();const saved=events.find(e=>e.id===selected);if(saved)edit(saved);});
archive.addEventListener('click',async()=>{if(!selected||!confirm('Archive this event? It will disappear from the public calendar.'))return;form.elements.visibility.value='archived';form.requestSubmit();});document.querySelector('#new-event').addEventListener('click',()=>reset(true));document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));reset();load();}));form.elements.title.addEventListener('input',()=>{document.querySelector('#editor-title').textContent=form.elements.title.value||'Untitled event';});reset();load();`;
}

// Editor-specific layout only. Shared desk chrome (tokens, header, skip link, filter buttons,
// the state chip) lives in desk-chrome.ts so it cannot drift from the inbox again.
function css(): string {
  return `.primary,.secondary{min-height:46px;padding:.65rem 1rem;border:2px solid var(--deep);border-radius:8px 8px 3px;background:var(--blue);color:white;font-weight:800;cursor:pointer}
.secondary{background:white;color:var(--deep)}
.intro{display:flex;align-items:end;justify-content:space-between;gap:2rem}
.intro h1{font-size:clamp(2.6rem,7vw,5rem);line-height:1;margin:0}
.intro p:last-child{max-width:65ch}
.workspace{display:grid;grid-template-columns:360px 1fr;min-height:720px;background:var(--page);border:1px solid var(--rule);border-radius:8px 22px 12px 8px;overflow:hidden;box-shadow:8px 10px 0 rgba(0,43,92,.12)}
aside{background:var(--wash);border-right:1px solid var(--rule)}
.filters{display:flex;gap:.4rem;padding:.8rem;overflow:auto}
.event-list{list-style:none;margin:0;padding:0}
.event{display:grid;width:100%;padding:1rem;text-align:left;border:0;border-top:1px solid var(--rule);background:transparent;color:var(--ink);cursor:pointer}
.event:hover,.event.active{background:white}
.event.active{box-shadow:inset 5px 0 var(--blue)}
.event small{color:var(--muted)}
.event .state{margin-bottom:.35rem}
.editor{padding:clamp(1.25rem,4vw,3rem)}
.editor-head{display:flex;justify-content:space-between;gap:2rem;border-bottom:3px solid var(--blue);padding-bottom:1rem;margin-bottom:1.5rem}
.editor-head h2{font-size:2rem;margin:0}
.actions{display:flex;gap:.6rem}
.form-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem}
.form-grid label{display:grid;align-content:start;gap:.35rem;color:var(--deep);font-weight:800}
.form-grid .wide{grid-column:1/-1}
.form-grid input,.form-grid select,.form-grid textarea{width:100%;padding:.7rem;border:2px solid var(--field-stroke);border-radius:7px 12px 6px;background:white;color:var(--ink);font-weight:400}
.empty{padding:1rem;color:var(--muted)}
@media(max-width:900px){.intro,.editor-head{align-items:start}.workspace{grid-template-columns:1fr}.event-list{max-height:340px;overflow:auto}aside{border-right:0}.form-grid{grid-template-columns:1fr 1fr}}
@media(max-width:600px){main{width:min(100% - 1rem,var(--shell))}.intro,.editor-head{display:grid}.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.actions{flex-wrap:wrap}}`;
}
