BEGIN;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ADD COLUMN IF NOT EXISTS referee_name TEXT,
  ADD COLUMN IF NOT EXISTS tv_stations JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS statistics JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS formation_home TEXT,
  ADD COLUMN IF NOT EXISTS formation_away TEXT;

CREATE TABLE IF NOT EXISTS players (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  common_name TEXT,
  position_name TEXT,
  image_url TEXT
);

CREATE INDEX IF NOT EXISTS players_name_lower_idx
  ON players (LOWER(name));

CREATE INDEX IF NOT EXISTS players_common_name_lower_idx
  ON players (LOWER(common_name));

CREATE TABLE IF NOT EXISTS match_events (
  id BIGINT PRIMARY KEY,
  match_id BIGINT NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams (id) ON DELETE SET NULL,
  player_id BIGINT REFERENCES players (id) ON DELETE SET NULL,
  secondary_player_id BIGINT REFERENCES players (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  minute INTEGER,
  added_time INTEGER,
  detail TEXT,
  result TEXT
);

CREATE INDEX IF NOT EXISTS match_events_match_minute_idx
  ON match_events (match_id, minute, added_time);

CREATE TABLE IF NOT EXISTS match_lineups (
  id BIGINT PRIMARY KEY,
  match_id BIGINT NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams (id) ON DELETE SET NULL,
  player_id BIGINT NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  lineup_type TEXT NOT NULL,
  jersey_number INTEGER,
  position_name TEXT,
  rating NUMERIC(4, 2)
);

CREATE INDEX IF NOT EXISTS match_lineups_match_team_idx
  ON match_lineups (match_id, team_id, lineup_type);

CREATE TABLE IF NOT EXISTS player_season_stats (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  season_id BIGINT NOT NULL,
  league_id BIGINT NOT NULL REFERENCES leagues (id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams (id) ON DELETE SET NULL,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  yellow_cards INTEGER NOT NULL DEFAULT 0,
  red_cards INTEGER NOT NULL DEFAULT 0,
  appearances INTEGER NOT NULL DEFAULT 0,
  UNIQUE (player_id, season_id, league_id)
);

CREATE INDEX IF NOT EXISTS player_season_stats_league_leaders_idx
  ON player_season_stats (league_id, season_id, goals DESC, assists DESC);

CREATE TABLE IF NOT EXISTS match_polls (
  match_id BIGINT PRIMARY KEY REFERENCES matches (id) ON DELETE CASCADE,
  home_votes BIGINT NOT NULL DEFAULT 0 CHECK (home_votes >= 0),
  draw_votes BIGINT NOT NULL DEFAULT 0 CHECK (draw_votes >= 0),
  away_votes BIGINT NOT NULL DEFAULT 0 CHECK (away_votes >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
