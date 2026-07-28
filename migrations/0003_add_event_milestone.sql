-- A calendar event may claim one homepage milestone by storing its key from
-- src/data/pack.ts `annualProgram`. Nullable: most events are not milestones.
--
-- No CHECK constraint on the allowed keys: SQLite cannot add one through ALTER TABLE, and the
-- worker validates against the same array it builds the admin dropdown from.
--
-- No UNIQUE index either: milestones recur every program year, so two Lego Derbies twelve months
-- apart both legitimately carry 'lego-derby'. The homepage resolves the pair by taking the soonest.
ALTER TABLE calendar_events ADD COLUMN milestone TEXT;
