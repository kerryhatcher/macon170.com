# Graph Report - .  (2026-07-27)

## Corpus Check
- 44 files · ~103,097 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1334 nodes · 1509 edges · 71 communities (25 shown, 46 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.87)
- Token cost: 0 input · 408,437 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Cloudflare Workers Type Declarations|Cloudflare Workers Type Declarations]]
- [[_COMMUNITY_Site Fonts & Page Components|Site Fonts & Page Components]]
- [[_COMMUNITY_Pack 170 Canonical Facts & Design Rules|Pack 170 Canonical Facts & Design Rules]]
- [[_COMMUNITY_NPM Dev Dependencies|NPM Dev Dependencies]]
- [[_COMMUNITY_Calendar Event Routes & Schema|Calendar Event Routes & Schema]]
- [[_COMMUNITY_Worker Contact-Form Validation|Worker Contact-Form Validation]]
- [[_COMMUNITY_Astro & Build Config|Astro & Build Config]]
- [[_COMMUNITY_Worker TS Compiler Options|Worker TS Compiler Options]]
- [[_COMMUNITY_Workers Runtime Event Types|Workers Runtime Event Types]]
- [[_COMMUNITY_Contact Submission Pipeline|Contact Submission Pipeline]]
- [[_COMMUNITY_Workers Runtime Error Types|Workers Runtime Error Types]]
- [[_COMMUNITY_Calendar Admin Rendering|Calendar Admin Rendering]]
- [[_COMMUNITY_CICD Deploy Pipeline|CI/CD Deploy Pipeline]]
- [[_COMMUNITY_Brand Colors & Typography System|Brand Colors & Typography System]]
- [[_COMMUNITY_Workers Runtime Event Targets|Workers Runtime Event Targets]]
- [[_COMMUNITY_Workers Runtime Streams|Workers Runtime Streams]]
- [[_COMMUNITY_Macon Local Identity Hooks|Macon Local Identity Hooks]]
- [[_COMMUNITY_Worker TS Config Extends|Worker TS Config Extends]]
- [[_COMMUNITY_Root TS Config Extends|Root TS Config Extends]]
- [[_COMMUNITY_Custom HTTP Error Classes|Custom HTTP Error Classes]]
- [[_COMMUNITY_Image Transform Types|Image Transform Types]]
- [[_COMMUNITY_Fetch RequestResponse Types|Fetch Request/Response Types]]
- [[_COMMUNITY_Queuing Strategy Types|Queuing Strategy Types]]
- [[_COMMUNITY_Vary-Header Cache Types|Vary-Header Cache Types]]
- [[_COMMUNITY_D1 Data & Safety Model|D1 Data & Safety Model]]
- [[_COMMUNITY_Site Architecture & Purpose|Site Architecture & Purpose]]
- [[_COMMUNITY_Design Phase Handoff Status|Design Phase Handoff Status]]
- [[_COMMUNITY_Content Placeholder Policy|Content Placeholder Policy]]
- [[_COMMUNITY_Scouting America Naming Rule|Scouting America Naming Rule]]
- [[_COMMUNITY_Youth Protection & Privacy Rules|Youth Protection & Privacy Rules]]
- [[_COMMUNITY_Cub Scout Ranks & Program Restructuring|Cub Scout Ranks & Program Restructuring]]
- [[_COMMUNITY_Artifacts Repo Types|Artifacts Repo Types]]
- [[_COMMUNITY_Binary File Types|Binary File Types]]
- [[_COMMUNITY_Colo Actor Namespace Types|Colo Actor Namespace Types]]
- [[_COMMUNITY_DigestWritable Stream Types|Digest/Writable Stream Types]]
- [[_COMMUNITY_DisposableStub Base Types|Disposable/Stub Base Types]]
- [[_COMMUNITY_Durable Object Base Types|Durable Object Base Types]]
- [[_COMMUNITY_Durable Object Namespace Types|Durable Object Namespace Types]]
- [[_COMMUNITY_Email Message Types|Email Message Types]]
- [[_COMMUNITY_Bot Management Types|Bot Management Types]]
- [[_COMMUNITY_JSON Web Key Types|JSON Web Key Types]]
- [[_COMMUNITY_Process Env Types|Process Env Types]]
- [[_COMMUNITY_R2 Object Types|R2 Object Types]]
- [[_COMMUNITY_Response Tool Call Types|Response Tool Call Types]]
- [[_COMMUNITY_RPC Target Types|RPC Target Types]]
- [[_COMMUNITY_Worker Entrypoint Types|Worker Entrypoint Types]]
- [[_COMMUNITY_Workflow Entrypoint Types|Workflow Entrypoint Types]]
- [[_COMMUNITY_Worker Test Environment Types|Worker Test Environment Types]]
- [[_COMMUNITY_Elementary Adventure Design System|Elementary Adventure Design System]]
- [[_COMMUNITY_Design System Overview|Design System Overview]]
- [[_COMMUNITY_Gold-as-Marker Design Rule|Gold-as-Marker Design Rule]]
- [[_COMMUNITY_Asymmetric Grid Layout|Asymmetric Grid Layout]]
- [[_COMMUNITY_Local Accent Design Rule|Local Accent Design Rule]]
- [[_COMMUNITY_Paper-Not-Glass Design Rule|Paper-Not-Glass Design Rule]]
- [[_COMMUNITY_Parking-Lot Readability Rule|Parking-Lot Readability Rule]]
- [[_COMMUNITY_Cloudflare Access Setup|Cloudflare Access Setup]]
- [[_COMMUNITY_Deployment & Volunteer Access Guide|Deployment & Volunteer Access Guide]]
- [[_COMMUNITY_Local Dev Setup|Local Dev Setup]]
- [[_COMMUNITY_Operations Runbook|Operations Runbook]]
- [[_COMMUNITY_Interrupted Fact-Check Pass|Interrupted Fact-Check Pass]]
- [[_COMMUNITY_Completed Research Phase|Completed Research Phase]]
- [[_COMMUNITY_Base Layout Component|Base Layout Component]]
- [[_COMMUNITY_Accessibility & Inclusion|Accessibility & Inclusion]]
- [[_COMMUNITY_Two Primary Site Audiences|Two Primary Site Audiences]]
- [[_COMMUNITY_Pack 170 Favicon|Pack 170 Favicon]]
- [[_COMMUNITY_DenPack Program Structure|Den/Pack Program Structure]]
- [[_COMMUNITY_HHBC Basic Facts|HHBC Basic Facts]]
- [[_COMMUNITY_Macon, Georgia Overview|Macon, Georgia Overview]]
- [[_COMMUNITY_Project Snapshot|Project Snapshot]]

## God Nodes (most connected - your core abstractions)
1. `../layouts/BaseLayout.astro` - 21 edges
2. `pack` - 17 edges
3. `fetch()` - 15 edges
4. `handleContactSubmission()` - 15 edges
5. `scripts` - 13 edges
6. `StreamError` - 11 edges
7. `handleEventRoute()` - 10 edges
8. `parseEventInput()` - 10 edges
9. `compilerOptions` - 9 edges
10. `SiteFooter` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Astro Site Configuration` --conceptually_related_to--> `fetch()`  [INFERRED]
  astro.config.mjs → worker/index.ts
- `dependencies` --references--> `Astro Site Configuration`  [INFERRED]
  package.json → astro.config.mjs
- `dependencies` --references--> `contact_submissions table`  [INFERRED]
  package.json → migrations/0001_create_contact_submissions.sql
- `macon170.com README` --conceptually_related_to--> `macon170.com Product Record (PRODUCT.md)`  [INFERRED]
  README.md → PRODUCT.md
- `Equal Visual Authority for Join and Calendar` --shares_data_with--> `Recommended Content Architecture`  [INFERRED]
  DESIGN.md → docs/research/SYNTHESIS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Canonical Sourcing Hierarchy for macon170.com Docs** — docs_offical_info_doc, product_doc, research_synthesis_doc, research_trademark_brand_guidance_doc, research_scouting_america_doc [INFERRED 0.85]
- **Cloudflare Worker Deployment Pipeline** — workflows_deploy_doc, docs_cloudflare_deployment_doc, docs_cloudflare_deployment_d1_database, docs_cloudflare_deployment_turnstile, docs_cloudflare_deployment_cloudflare_access [INFERRED 0.85]
- **July 2026 Research Fact-Check Pass** — research_highland_hills_baptist_denomination_correction, research_scouting_america_doc, research_cub_scouting_doc, docs_handoff_factcheck_pass, research_macon_ga_doc [INFERRED 0.80]
- **Pages built on BaseLayout** — layouts_baselayout_baselayout, pages_about_about, pages_activities_activities, calendar_index_index, pages_contact_contact, events_index_index, pages_index_index, pages_join_join, pages_privacy_privacy, pages_resources_resources, pages_volunteer_volunteer [EXTRACTED 1.00]
- **Components and pages rendering pack.ts data** — data_pack_pack, components_packstrip_packstrip, components_sitefooter_sitefooter, pages_about_about, calendar_index_index, pages_contact_contact, pages_index_index, pages_join_join, pages_privacy_privacy, pages_resources_resources [INFERRED 0.95]
- **Calendar and event-detail pages consuming the events API** — calendar_index_index, events_index_index, worker_index_index [INFERRED 0.65]
- **Contact Form Submission Pipeline** — worker_index_handlecontactsubmission, worker_index_verifyturnstile, migrations_0001_create_contact_submissions_contact_submissions, worker_index_test_contactsubmissions [INFERRED 0.85]
- **Calendar Admin and Public Events Flow** — worker_index_fetch, worker_event_routes_handleeventroute, worker_calendar_admin_rendercalendaradmin, migrations_0002_create_calendar_events_calendar_events [INFERRED 0.85]
- **Worker Build, Type-check and Test Pipeline** — package_dependencies, tsconfig_worker_config, worker_configuration_d_env, vitest_config_defineconfig [INFERRED 0.80]

## Communities (71 total, 46 thin omitted)

### Community 0 - "Cloudflare Workers Type Declarations"
Cohesion: 0.00
Nodes (953): AbortController, AgentMemoryGetSummaryOptions, AgentMemoryGetSummaryResponse, AgentMemoryIncomingMemory, AgentMemoryIngestOptions, AgentMemoryListMemoriesOptions, AgentMemoryListMemoriesResult, AgentMemoryMemory (+945 more)

### Community 1 - "Site Fonts & Page Components"
Cohesion: 0.07
Nodes (48): @fontsource/source-sans-3/400.css, @fontsource/source-sans-3/500.css, @fontsource/montserrat/600.css, @fontsource/montserrat/700.css, @fontsource/montserrat/800.css, @fontsource/montserrat/900.css, Calendar index page, ../components/ChapterHero.astro (+40 more)

### Community 2 - "Pack 170 Canonical Facts & Design Rules"
Cohesion: 0.05
Nodes (46): Design Do's and Don'ts, Equal Visual Authority for Join and Calendar, Non-Negotiable Design Constraints, Session Handoff — macon170.com, BeAScout Join Link (Pack 170 Unit Pin), Central Georgia Council, BSA (Contact Info), Den Meeting Info (Canonical), SA 170 Official Info (+38 more)

### Community 3 - "NPM Dev Dependencies"
Cohesion: 0.08
Nodes (23): devDependencies, @cloudflare/vitest-pool-workers, @cloudflare/workers-types, @types/node, vitest, wrangler, name, private (+15 more)

### Community 4 - "Calendar Event Routes & Schema"
Cohesion: 0.13
Nodes (22): event_audit_log table, categories, enumValue(), EventCategory, EventInput, EventRouteContext, EventRow, EventStatus (+14 more)

### Community 5 - "Worker Contact-Form Validation"
Cohesion: 0.15
Nodes (21): AccessIdentity, ALLOWED_GRADES, ALLOWED_STATUSES, ALLOWED_TOPICS, clean(), enforceBodyLimit(), enforceSameOrigin(), handleContactSubmission() (+13 more)

### Community 6 - "Astro & Build Config"
Cohesion: 0.15
Nodes (17): Astro Site Configuration, calendar_events table, dependencies, astro, @astrojs/check, @fontsource/montserrat, @fontsource/source-sans-3, jose (+9 more)

### Community 7 - "Worker TS Compiler Options"
Cohesion: 0.17
Nodes (11): compilerOptions, lib, module, moduleResolution, noEmit, skipLibCheck, strict, target (+3 more)

### Community 8 - "Workers Runtime Event Types"
Cohesion: 0.17
Nodes (12): CloseEvent, CustomEvent, EmailEvent, ErrorEvent, Event, ExtendableEvent, FetchEvent, MessageEvent (+4 more)

### Community 9 - "Contact Submission Pipeline"
Cohesion: 0.40
Nodes (11): contact_submissions table, submission_audit_log table, adminHeaders(), fetch(), getSubmission(), json(), listSubmissions(), scheduled() (+3 more)

### Community 10 - "Workers Runtime Error Types"
Cohesion: 0.18
Nodes (11): AlreadyUploadedError, BadRequestError, ForbiddenError, InternalError, InvalidURLError, MaxFileSizeError, NotFoundError, QuotaReachedError (+3 more)

### Community 11 - "Calendar Admin Rendering"
Cohesion: 0.31
Nodes (9): css(), escapeHtml(), renderCalendarAdmin(), script(), adminCss(), adminScript(), escapeHtml(), renderAdminShell() (+1 more)

### Community 12 - "CI/CD Deploy Pipeline"
Cohesion: 0.25
Nodes (9): D1 Database: macon170-submissions, GitHub Actions Secrets, Cloudflare Turnstile Integration, Reject Incomplete Production Configuration Step, Apply D1 Migrations Step, CI Deploy Job, Deploy to Cloudflare Workers Workflow, CI Validate Job (+1 more)

### Community 13 - "Brand Colors & Typography System"
Cohesion: 0.33
Nodes (7): Design System Color Palette, Typography System (Montserrat / Source Sans 3), Brand Commitments, Macon-Inspired Color & Mood Palette, Cub Scouts Official Program Colors, Montserrat as Approved Free Typeface, Visual Identity Direction

### Community 14 - "Workers Runtime Event Targets"
Cohesion: 0.29
Nodes (7): AbortSignal, EventSource, EventTarget, MessagePort, ServiceWorkerGlobalScope, WebSocket, WorkerGlobalScope

### Community 15 - "Workers Runtime Streams"
Cohesion: 0.29
Nodes (7): CompressionStream, DecompressionStream, FixedLengthStream, IdentityTransformStream, TextDecoderStream, TextEncoderStream, TransformStream

### Community 16 - "Macon Local Identity Hooks"
Cohesion: 0.40
Nodes (5): Shirley Hills Historic Neighborhood, International Cherry Blossom Festival, Lake Tobesofkee Recreation Area, Ocmulgee Mounds National Historical Park, Local Hooks (Macon Identity)

### Community 17 - "Worker TS Config Extends"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 18 - "Root TS Config Extends"
Cohesion: 0.50
Nodes (3): exclude, extends, include

### Community 20 - "Image Transform Types"
Cohesion: 0.67
Nodes (3): BasicImageTransformations, RequestInitCfPropertiesImage, RequestInitCfPropertiesImageDraw

### Community 21 - "Fetch Request/Response Types"
Cohesion: 0.67
Nodes (3): Body, Request, Response

### Community 22 - "Queuing Strategy Types"
Cohesion: 0.67
Nodes (3): ByteLengthQueuingStrategy, CountQueuingStrategy, QueuingStrategy

### Community 23 - "Vary-Header Cache Types"
Cohesion: 0.67
Nodes (3): RequestInitCfPropertiesVaryAcceptHeader, RequestInitCfPropertiesVaryAcceptLanguageHeader, RequestInitCfPropertiesVaryHeader

## Ambiguous Edges - Review These
- `Operating Context` → `Pack 170 Charter Status (Unverified)`  [AMBIGUOUS]
  PRODUCT.md · relation: conceptually_related_to
- `Calendar index page` → `Worker entry (Cloudflare Worker, /api routes)`  [AMBIGUOUS]
  src/pages/calendar/index.astro · relation: references
- `Contact page` → `Worker entry (Cloudflare Worker, /api routes)`  [AMBIGUOUS]
  src/pages/contact.astro · relation: references
- `Event details page` → `Worker entry (Cloudflare Worker, /api routes)`  [AMBIGUOUS]
  src/pages/events/index.astro · relation: references

## Knowledge Gaps
- **1085 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+1080 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Operating Context` and `Pack 170 Charter Status (Unverified)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Calendar index page` and `Worker entry (Cloudflare Worker, /api routes)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Contact page` and `Worker entry (Cloudflare Worker, /api routes)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Event details page` and `Worker entry (Cloudflare Worker, /api routes)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `Env` connect `Astro & Build Config` to `Cloudflare Workers Type Declarations`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Astro & Build Config` to `Contact Submission Pipeline`, `NPM Dev Dependencies`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `contact_submissions table` connect `Contact Submission Pipeline` to `Worker Contact-Form Validation`, `Astro & Build Config`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._