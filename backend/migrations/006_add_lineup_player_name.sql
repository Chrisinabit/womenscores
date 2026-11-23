BEGIN;

ALTER TABLE match_lineups
  ADD COLUMN IF NOT EXISTS player_name TEXT;

ALTER TABLE match_lineups
  ALTER COLUMN player_name DROP NOT NULL;

COMMIT;
