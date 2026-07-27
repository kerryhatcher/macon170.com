CREATE TABLE contact_submissions (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  child_grade TEXT,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  source_path TEXT NOT NULL DEFAULT '/contact/',
  user_agent TEXT,
  country_code TEXT,
  turnstile_hostname TEXT,
  turnstile_challenge_ts TEXT,
  assigned_to TEXT,
  resolved_at TEXT,
  last_viewed_at TEXT
) STRICT;

CREATE INDEX idx_contact_submissions_status_created
  ON contact_submissions(status, created_at DESC);

CREATE INDEX idx_contact_submissions_created
  ON contact_submissions(created_at DESC);

CREATE TABLE submission_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('viewed', 'status_changed')),
  detail TEXT,
  FOREIGN KEY (submission_id) REFERENCES contact_submissions(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_submission_audit_submission
  ON submission_audit_log(submission_id, created_at DESC);
