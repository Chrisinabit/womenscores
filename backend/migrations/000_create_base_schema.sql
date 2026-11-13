BEGIN;

CREATE TABLE IF NOT EXISTS leagues (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  logo_url TEXT
);

CREATE TABLE IF NOT EXISTS teams (
  id BIGSERIAL PRIMARY KEY,
  league_id BIGINT REFERENCES leagues (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  crest_url TEXT,
  UNIQUE (league_id, name)
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  league_id BIGINT REFERENCES leagues (id) ON DELETE CASCADE,
  home_team_id BIGINT REFERENCES teams (id) ON DELETE CASCADE,
  away_team_id BIGINT REFERENCES teams (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  minute INTEGER,
  home_score INTEGER,
  away_score INTEGER,
  match_time TIME,
  kickoff_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS standings (
  id BIGSERIAL PRIMARY KEY,
  league_id BIGINT NOT NULL REFERENCES leagues (id) ON DELETE CASCADE,
  team_id BIGINT NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  rank INTEGER,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  form TEXT
);

COMMIT;
