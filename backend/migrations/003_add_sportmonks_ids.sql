BEGIN;

ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS sportmonks_id BIGINT,
  ADD COLUMN IF NOT EXISTS sportmonks_season_id BIGINT;

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS sportmonks_id BIGINT;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS sportmonks_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS leagues_sportmonks_id_uidx
  ON leagues (sportmonks_id);

CREATE UNIQUE INDEX IF NOT EXISTS teams_sportmonks_id_league_id_uidx
  ON teams (sportmonks_id, league_id);

CREATE UNIQUE INDEX IF NOT EXISTS matches_sportmonks_id_uidx
  ON matches (sportmonks_id);

COMMIT;
