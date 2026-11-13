BEGIN;

ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS api_football_id BIGINT;

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS api_football_id BIGINT;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS api_football_id BIGINT,
  ADD COLUMN IF NOT EXISTS kickoff_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS leagues_api_football_id_uidx
  ON leagues (api_football_id);

CREATE UNIQUE INDEX IF NOT EXISTS teams_api_football_id_league_id_uidx
  ON teams (api_football_id, league_id);

CREATE UNIQUE INDEX IF NOT EXISTS matches_api_football_id_uidx
  ON matches (api_football_id);

CREATE UNIQUE INDEX IF NOT EXISTS standings_league_id_team_id_uidx
  ON standings (league_id, team_id);

COMMIT;
