---
name: calendar-api
description: Manage Pack 170 calendar events through the macon170.com REST API. Use this skill whenever a user asks to list, inspect, create, edit, publish, archive, restore, or otherwise manage Pack 170 calendar events programmatically.
---

# Pack 170 Calendar API

Use the admin API to manage calendar events. Treat mutations carefully: list or
fetch the relevant event first, create new events as drafts, and get explicit
confirmation before publishing, archiving, or overwriting an existing event
when the user has not already asked for that action.

## Authentication and base URLs

For programmatic access, use the API host and a bearer token:

```bash
export CALENDAR_API_KEY='…' # do not print, commit, or include this value in output
curl -H "Authorization: Bearer $CALENDAR_API_KEY" \
  'https://api.macon170.com/api/admin/events'
```

The API key is the `CALENDAR_API_KEY` Cloudflare secret. It is accepted as an
`Authorization: Bearer <key>` header; `X-API-Key` is not supported.

The browser-based calendar admin at `https://admin.macon170.com/calendar` uses
Cloudflare Access automatically. Do not try to copy its Access JWT into a
script. Use `https://api.macon170.com` for API-key requests.

## Read events first

```bash
# All events, optionally filtered by draft, published, or archived
curl -H "Authorization: Bearer $CALENDAR_API_KEY" \
  'https://api.macon170.com/api/admin/events?visibility=draft'

# A single event, including its audit history
curl -H "Authorization: Bearer $CALENDAR_API_KEY" \
  'https://api.macon170.com/api/admin/events/EVENT_UUID'
```

`GET /api/admin/events` returns up to 300 events ordered by start time.
`GET /api/admin/events/{id}` returns `{ ok, event, audit }`; use the returned
event to build a full update payload.

## Create a draft

`POST /api/admin/events` always creates a `draft`; any supplied `visibility`
is ignored. Required fields are `title`, `summary`, `description`, `startsAt`,
`audience`, `category`, and `status`.

```bash
curl -X POST 'https://api.macon170.com/api/admin/events' \
  -H "Authorization: Bearer $CALENDAR_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "title": "Spring Campout",
    "summary": "An overnight campout at the state park.",
    "description": "Bring a tent, sleeping bag, flashlight, and water bottle.",
    "startsAt": "2027-04-10T16:00:00-04:00",
    "endsAt": "2027-04-11T10:00:00-04:00",
    "audience": "All scouts and families",
    "category": "pack",
    "status": "scheduled",
    "locationName": "Macon State Park",
    "address": "456 Park Rd, Macon, GA",
    "whatToBring": "Tent, sleeping bag, flashlight, water bottle",
    "cost": "$10 per family",
    "milestone": null
  }'
```

The response contains the generated `id` and `slug`. Fetch the event afterward
to review the stored values before publishing it.

## Update, publish, archive, or restore

`PUT /api/admin/events/{id}` replaces the event fields. Fetch the event first,
then send a complete payload in the API's camelCase field names. To publish,
archive, or restore, change only `visibility` to `published`, `archived`, or
`draft` respectively and preserve the other fields.

**`milestone` is one of those fields you must preserve.** Because PUT
replaces the whole row, an omitted `milestone` is stored as NULL — it does
not leave the existing value alone. If the event you fetched has
`"milestone": "blue-gold"` and your update payload leaves `milestone` out,
the update **silently clears the association** and the homepage milestone
strip reverts to its placeholder text. There is no error and no warning; the
audit log only shows a generic `updated` entry. Always echo back the
`milestone` value from the GET response in every PUT, even when the update
is unrelated to milestones (a time change, a `visibility` flip, etc.).

```bash
curl -X PUT 'https://api.macon170.com/api/admin/events/EVENT_UUID' \
  -H "Authorization: Bearer $CALENDAR_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "title": "Spring Campout",
    "slug": "spring-campout",
    "summary": "An overnight campout at the state park.",
    "description": "Bring a tent, sleeping bag, flashlight, and water bottle.",
    "startsAt": "2027-04-10T20:00:00.000Z",
    "endsAt": "2027-04-11T14:00:00.000Z",
    "audience": "All scouts and families",
    "category": "pack",
    "status": "scheduled",
    "visibility": "published",
    "timezone": "America/New_York",
    "locationName": "Macon State Park",
    "address": "456 Park Rd, Macon, GA",
    "whatToBring": "Tent, sleeping bag, flashlight, water bottle",
    "cost": "$10 per family",
    "registrationUrl": "",
    "milestone": null
  }'
```

Use `null` or `""` for optional fields that should be cleared. A missing
`slug` is derived from the title, but include the current slug to avoid an
unintended URL change.

## Field rules

| Field                                            | Rules                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `title`                                          | 3–160 characters                                                 |
| `slug`                                           | Optional; 2–80 lowercase URL-safe characters after normalization |
| `summary`                                        | 10–500 characters                                                |
| `description`                                    | 10–8,000 characters                                              |
| `startsAt`, `endsAt`                             | ISO 8601; `endsAt` is optional but must be after `startsAt`      |
| `audience`                                       | 2–300 characters                                                 |
| `category`                                       | `pack`, `den`, or `family`                                       |
| `status`                                         | `scheduled`, `tentative`, or `cancelled`                         |
| `visibility`                                     | Update only: `draft`, `published`, or `archived`                 |
| `timezone`                                       | Optional, but if supplied must be `America/New_York`             |
| `locationName`, `address`, `whatToBring`, `cost` | Optional text fields                                             |
| `registrationUrl`                                | Optional `http` or `https` URL                                   |
| `milestone`                                      | Optional; a key from `annualProgram` in `src/data/pack.ts`, or `null`/omitted for a non-milestone event; any other value is a 400 |

API responses use database-style names such as `starts_at` and
`location_name`; request bodies use camelCase such as `startsAt` and
`locationName`. `milestone` is the same spelling on both sides.

`milestone` associates an event with one of the pack's four recurring annual
milestones so the homepage strip can fill in that milestone's row with the
event's real date instead of its placeholder text. Empty string, `null`, and
omission all store SQL NULL (no milestone). The valid keys live in
`annualProgram` in `src/data/pack.ts` — treat that file as the source of
truth, since the list below can go stale:

- `lego-derby` — Lego Pinewood Derby
- `fall-camp` — Fall camp
- `pinewood-derby` — Pinewood Derby
- `blue-gold` — Blue & Gold Banquet

## Public read-only endpoints

No authentication is required for published, upcoming events:

```text
GET https://www.macon170.com/api/events
GET https://www.macon170.com/api/events/{slug}
```

The public API excludes drafts, archived events, and events that have ended.
