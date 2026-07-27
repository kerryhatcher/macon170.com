# Pack 170 Calendar Admin API

CRUD the Pack 170 event calendar via REST. Use this skill when an AI agent needs to create, read, update, or manage calendar events for macon170.com.

## Authentication

All admin endpoints require one of:

- **Cloudflare Access JWT** — set by the browser at `admin.macon170.com` automatically (`cf-access-jwt-assertion` header)
- **API Key** — pass `X-API-Key: <key>` header (set via `wrangler secret put CALENDAR_API_KEY`)

When using the API key, same-origin checks are skipped so `curl` works directly.

## Base URL

```
https://admin.macon170.com
```

## Endpoints

### List all events (admin)

```
GET /api/admin/events?visibility=draft|published|archived
```

Returns all events regardless of visibility. Optional `visibility` filter.

**curl:**
```bash
curl -H "X-API-Key: $CALENDAR_API_KEY" \
  "https://admin.macon170.com/api/admin/events?visibility=published"
```

**Response:**
```json
{
  "ok": true,
  "events": [
    {
      "id": "uuid",
      "slug": "pinewood-derby-2026",
      "visibility": "published",
      "status": "scheduled",
      "category": "pack",
      "title": "Pinewood Derby",
      "summary": "Annual pinewood derby race",
      "description": "Full description...",
      "starts_at": "2026-03-15T14:00:00.000Z",
      "ends_at": "2026-03-15T17:00:00.000Z",
      "timezone": "America/New_York",
      "location_name": "Highland Hills Baptist Church",
      "address": "123 Main St, Macon, GA",
      "audience": "All scouts and families",
      "what_to_bring": "Pinewood derby car",
      "cost": "$5 per scout",
      "registration_url": null,
      "created_by": "api-key",
      "updated_by": "api-key",
      "created_at": "...",
      "updated_at": "...",
      "published_at": "...",
      "archived_at": null
    }
  ]
}
```

### Get single event with audit log

```
GET /api/admin/events/{id}
```

Returns the full event plus its audit trail.

**curl:**
```bash
curl -H "X-API-Key: $CALENDAR_API_KEY" \
  "https://admin.macon170.com/api/admin/events/550e8400-e29b-41d4-a716-446655440000"
```

**Response:**
```json
{
  "ok": true,
  "event": { /* full event object */ },
  "audit": [
    {
      "created_at": "...",
      "actor_email": "api-key",
      "action": "published",
      "detail": "draft -> published"
    }
  ]
}
```

### Create event

```
POST /api/admin/events
Content-Type: application/json
```

New events always start as `draft` visibility. The `visibility` field in the request body is ignored on create.

**Required fields:** `title`, `summary`, `description`, `startsAt`, `audience`

**curl:**
```bash
curl -X POST \
  -H "X-API-Key: $CALENDAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spring Campout",
    "summary": "Overnight campout at the state park",
    "description": "Bring tents, sleeping bags, and a flashlight...",
    "startsAt": "2026-04-10T16:00:00-04:00",
    "endsAt": "2026-04-11T10:00:00-04:00",
    "audience": "All scouts and families",
    "category": "pack",
    "status": "scheduled",
    "locationName": "Macon State Park",
    "address": "456 Park Rd, Macon, GA",
    "whatToBring": "Tent, sleeping bag, flashlight, water bottle",
    "cost": "$10 per family"
  }' \
  "https://admin.macon170.com/api/admin/events"
```

**Response (201):**
```json
{
  "ok": true,
  "id": "generated-uuid",
  "slug": "spring-campout"
}
```

### Update event

```
PUT /api/admin/events/{id}
Content-Type: application/json
```

Updates an existing event. All fields are required (send the full object). This is also how you publish, archive, or restore an event by changing `visibility`.

**curl:**
```bash
curl -X PUT \
  -H "X-API-Key: $CALENDAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Spring Campout",
    "slug": "spring-campout",
    "summary": "Overnight campout at the state park",
    "description": "Bring tents, sleeping bags, and a flashlight...",
    "startsAt": "2026-04-10T16:00:00.000Z",
    "endsAt": "2026-04-11T10:00:00.000Z",
    "audience": "All scouts and families",
    "category": "pack",
    "status": "scheduled",
    "visibility": "published",
    "locationName": "Macon State Park",
    "address": "456 Park Rd, Macon, GA",
    "whatToBring": "Tent, sleeping bag, flashlight, water bottle",
    "cost": "$10 per family",
    "registrationUrl": "",
    "timezone": "America/New_York"
  }' \
  "https://admin.macon170.com/api/admin/events/550e8400-e29b-41d4-a716-446655440000"
```

**Response (200):**
```json
{
  "ok": true,
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "spring-campout"
}
```

## Field Reference

| JSON field | Type | Required | Max | Notes |
|---|---|---|---|---|
| `title` | string | create, update | 160 | |
| `slug` | string | update | 80 | Auto-generated from title on create; lowercase, hyphens |
| `summary` | string | create, update | 500 | Short description for cards |
| `description` | string | create, update | 8000 | Full event details, newlines allowed |
| `startsAt` | ISO 8601 | create, update | — | e.g. `2026-04-10T16:00:00-04:00` |
| `endsAt` | ISO 8601 | optional | — | Must be after `startsAt` |
| `audience` | string | create, update | 300 | Who the event is for |
| `category` | enum | create, update | — | `pack`, `den`, or `family` |
| `status` | enum | create, update | — | `scheduled`, `tentative`, or `cancelled` |
| `visibility` | enum | update only | — | `draft`, `published`, or `archived` (always `draft` on create) |
| `locationName` | string | optional | 200 | |
| `address` | string | optional | 300 | |
| `whatToBring` | string | optional | 2000 | |
| `cost` | string | optional | 500 | |
| `registrationUrl` | string | optional | 2000 | Must be http/https if supplied |
| `timezone` | string | optional | 80 | Always `America/New_York` |

## Workflow: Draft → Publish

```bash
# 1. Create as draft
curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"title":"Blue & Gold Banquet","summary":"...","description":"...","startsAt":"2026-02-20T18:00:00-05:00","audience":"All scouts and families","category":"pack","status":"scheduled","locationName":"Highland Hills Baptist Church"}' \
  "https://admin.macon170.com/api/admin/events"

# 2. Review it (copy the id from the response)
curl -H "X-API-Key: $KEY" \
  "https://admin.macon170.com/api/admin/events/{id}"

# 3. Publish it (GET the event, change visibility to "published", PUT it back)
curl -X PUT -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"title":"Blue & Gold Banquet","slug":"blue-gold-banquet","summary":"...","description":"...","startsAt":"2026-02-20T23:00:00.000Z","audience":"All scouts and families","category":"pack","status":"scheduled","visibility":"published","locationName":"Highland Hills Baptist Church","address":"","whatToBring":"","cost":"","registrationUrl":"","timezone":"America/New_York"}' \
  "https://admin.macon170.com/api/admin/events/{id}"
```

## Public API (read-only, no auth)

```
GET /api/events              # Published, upcoming events only
GET /api/events/{slug}       # Single published event by slug
```

## Setup

The `CALENDAR_API_KEY` secret must be set in Cloudflare:

```bash
# Generate a key
openssl rand -hex 32

# Set it in production
wrangler secret put CALENDAR_API_KEY

# For local dev, add to .dev.vars:
# CALENDAR_API_KEY=your-key-here
```
