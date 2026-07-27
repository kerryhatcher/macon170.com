CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_at TEXT,
  archived_at TEXT,
  visibility TEXT NOT NULL DEFAULT 'draft' CHECK (visibility IN ('draft', 'published', 'archived')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'tentative', 'cancelled')),
  category TEXT NOT NULL CHECK (category IN ('pack', 'den', 'family')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  location_name TEXT,
  address TEXT,
  audience TEXT NOT NULL,
  what_to_bring TEXT,
  cost TEXT,
  registration_url TEXT,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
) STRICT;

CREATE INDEX idx_calendar_events_public_start
  ON calendar_events(visibility, starts_at);

CREATE INDEX idx_calendar_events_admin_updated
  ON calendar_events(visibility, updated_at DESC);

CREATE TABLE event_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'published', 'archived', 'restored')),
  detail TEXT,
  FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_event_audit_event
  ON event_audit_log(event_id, created_at DESC);
