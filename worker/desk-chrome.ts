// Shared chrome for the Access-gated volunteer submissions desk.

/** Head element for a desk page. `shell` is the page's max content width. */
export function deskHead(title: string, shell: '1200px' | '1400px', pageCss: string): string {
  return `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${chromeCss(shell)}${pageCss}</style></head>`;
}

/**
 * The desk header: home-linked badge, section navigation, and verified Access identity.
 * Calendar management lives in the separately authenticated CMS.
 */
export function deskHeader(email: string): string {
  return `<a class="skip" href="#main">Skip to content</a><header><a class="brand" href="/"><span>170</span><div><b>Pack 170</b><small>Volunteer desk</small></div></a><nav class="desk-nav" aria-label="Desk sections"><a href="/" aria-current="page">Parent inquiries</a><a href="https://cms.macon170.com/admin/calendar">Calendar editor</a></nav><div class="identity"><small>Signed in with Cloudflare Access</small><strong>${escapeHtml(email)}</strong></div></header>`;
}

function chromeCss(shell: string): string {
  return `:root{--shell:${shell};--blue:#003f87;--deep:#002b5c;--gold:#fcd116;--paper:#f7f1e3;--page:#fffdf7;--ink:#272b2e;--muted:#59636b;--rule:#d7cdb8;--green:#28543f;--red:#a33c34;--wash:#f2ead9;--header-tint:#bed1e5;--field-stroke:#8794a0;color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 system-ui,sans-serif}
button,input,select,textarea{font:inherit}
:focus-visible{outline:3px solid var(--deep);outline-offset:0;box-shadow:0 0 0 7px var(--gold)}
.skip{position:fixed;top:-5rem;left:1rem;z-index:10;padding:.75rem;background:var(--gold);color:var(--deep);font-weight:800}
.skip:focus{top:1rem}
header{min-height:76px;padding:.75rem max(1rem,calc((100% - var(--shell))/2));display:flex;align-items:center;gap:1.5rem;background:var(--deep);color:white;border-bottom:6px solid var(--gold)}
.brand{display:flex;align-items:center;gap:.75rem;color:white;text-decoration:none}
.brand>span{display:grid;place-items:center;width:44px;height:44px;flex:none;border:3px solid var(--gold);border-radius:50%;color:var(--gold);font-weight:900}
.brand b,.brand small,.identity strong,.identity small{display:block}
.desk-nav{display:flex;align-self:stretch}
.desk-nav a{display:grid;place-items:center;padding:0 1rem;color:white;text-decoration:none;font-weight:700}
.desk-nav a[aria-current=page]{background:var(--gold);color:var(--deep)}
.identity{margin-left:auto;text-align:right;min-width:0}
.identity strong{overflow-wrap:anywhere}
.identity small{color:var(--header-tint)}
main{width:min(var(--shell),calc(100% - 2rem));margin:2.25rem auto}
.tab{display:inline-block;margin:0 0 .5rem;padding:.35rem .65rem;border-radius:4px 10px 10px 4px;background:var(--gold);color:var(--deep);font-size:.76rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
.status{min-height:1.5rem;margin:1.5rem 0 .7rem;color:var(--muted)}
.filters button{min-height:44px;padding:.55rem .9rem;border:2px solid var(--deep);border-radius:7px;background:var(--page);color:var(--deep);font-weight:700;white-space:nowrap}
.filters button[aria-pressed=true]{background:var(--deep);color:white}
/* The desk's one state mark, shared by event visibility and inquiry status. It always
   prints its word: DESIGN.md's "The State Reads Without Color Rule" means the fill and
   the dot reinforce the label, never replace it. Variants set only custom properties, so
   no variant introduces a colour the design system has not already named. */
.state{display:inline-flex;align-items:center;gap:.4rem;justify-self:start;padding:.2rem .5rem;border-radius:4px;background:var(--chip-fill,#ddd);color:var(--chip-ink,var(--ink));font-size:.68rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.state::before{content:'';flex:none;width:9px;height:9px;border-radius:50%;background:var(--chip-dot,#82909a)}
.state.draft{--chip-fill:#fff0ad;--chip-ink:#725c00;--chip-dot:#725c00}
.state.published{--chip-fill:#d9efdf;--chip-ink:var(--green);--chip-dot:var(--green)}
.state.archived{--chip-fill:#eee;--chip-ink:#555;--chip-dot:#555}
.state.new{--chip-dot:var(--red)}
.state.in_progress{--chip-dot:#d39b00}
.state.resolved{--chip-dot:#34815e}
/* A phone-width desk stacks the nav under the badge and drops the caption above the
   signed-in address; the address itself stays, because knowing which volunteer account
   is acting is the point of showing it. */
@media(max-width:900px){header{flex-wrap:wrap;align-items:flex-start;gap:1rem}.desk-nav{order:3;width:100%}.identity small{display:none}}`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] ?? c);
}
