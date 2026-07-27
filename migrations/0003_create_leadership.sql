CREATE TABLE leadership_roles (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  name TEXT,
  bio TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by TEXT NOT NULL
) STRICT;

CREATE INDEX idx_leadership_roles_order ON leadership_roles(sort_order);

-- Seeded from src/data/leadership.md as of 2026-07-27. Names are editable in the
-- admin panel afterward, so unverified entries are seeded rather than withheld.
INSERT INTO leadership_roles (id, slug, role, name, bio, sort_order, updated_by) VALUES
  ('0f1d2b4a-0001-4000-8000-000000000001', 'cubmaster', 'Cubmaster', 'Kerry Hatcher', NULL, 10, 'migration'),
  ('0f1d2b4a-0002-4000-8000-000000000002', 'committee-chair', 'Committee Chair', 'Will Roche', NULL, 20, 'migration'),
  ('0f1d2b4a-0003-4000-8000-000000000003', 'chartered-organization-representative', 'Chartered Organization Representative', 'Rev. Caitlin Childers Brown', 'Co-pastor at Highland Hills Baptist Church.', 30, 'migration'),
  ('0f1d2b4a-0004-4000-8000-000000000004', 'treasurer', 'Treasurer', NULL, NULL, 40, 'migration'),
  ('0f1d2b4a-0005-4000-8000-000000000005', 'advancement-chair', 'Advancement Chair', NULL, NULL, 50, 'migration'),
  ('0f1d2b4a-0006-4000-8000-000000000006', 'lion-den-leader', 'Lion Den Leader', NULL, NULL, 60, 'migration'),
  ('0f1d2b4a-0007-4000-8000-000000000007', 'tiger-den-leader', 'Tiger Den Leader', NULL, NULL, 70, 'migration'),
  ('0f1d2b4a-0008-4000-8000-000000000008', 'wolf-den-leader', 'Wolf Den Leader', NULL, NULL, 80, 'migration'),
  ('0f1d2b4a-0009-4000-8000-000000000009', 'bear-den-leader', 'Bear Den Leader', NULL, NULL, 90, 'migration'),
  ('0f1d2b4a-0010-4000-8000-000000000010', 'webelos-den-leader', 'Webelos Den Leader', 'Stephanie Hatcher', NULL, 100, 'migration'),
  ('0f1d2b4a-0011-4000-8000-000000000011', 'arrow-of-light-den-leader', 'Arrow of Light Den Leader', NULL, NULL, 110, 'migration');
