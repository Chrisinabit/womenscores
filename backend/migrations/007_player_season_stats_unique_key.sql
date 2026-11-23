BEGIN;

WITH ranked AS (
  SELECT
    ctid,
    FIRST_VALUE(team_id) OVER (
      PARTITION BY player_id, season_id, league_id
      ORDER BY (team_id IS NOT NULL) DESC, id NULLS LAST, ctid
    ) AS merged_team_id,
    MAX(goals) OVER (
      PARTITION BY player_id, season_id, league_id
    ) AS merged_goals,
    MAX(assists) OVER (
      PARTITION BY player_id, season_id, league_id
    ) AS merged_assists,
    MAX(yellow_cards) OVER (
      PARTITION BY player_id, season_id, league_id
    ) AS merged_yellow_cards,
    MAX(red_cards) OVER (
      PARTITION BY player_id, season_id, league_id
    ) AS merged_red_cards,
    MAX(appearances) OVER (
      PARTITION BY player_id, season_id, league_id
    ) AS merged_appearances,
    ROW_NUMBER() OVER (
      PARTITION BY player_id, season_id, league_id
      ORDER BY id NULLS LAST, ctid
    ) AS duplicate_number
  FROM player_season_stats
  WHERE player_id IS NOT NULL
    AND season_id IS NOT NULL
    AND league_id IS NOT NULL
)
UPDATE player_season_stats AS stats
SET team_id = COALESCE(ranked.merged_team_id, stats.team_id),
    goals = COALESCE(ranked.merged_goals, 0),
    assists = COALESCE(ranked.merged_assists, 0),
    yellow_cards = COALESCE(ranked.merged_yellow_cards, 0),
    red_cards = COALESCE(ranked.merged_red_cards, 0),
    appearances = COALESCE(ranked.merged_appearances, 0)
FROM ranked
WHERE stats.ctid = ranked.ctid
  AND ranked.duplicate_number = 1;

WITH ranked AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (
      PARTITION BY player_id, season_id, league_id
      ORDER BY id NULLS LAST, ctid
    ) AS duplicate_number
  FROM player_season_stats
  WHERE player_id IS NOT NULL
    AND season_id IS NOT NULL
    AND league_id IS NOT NULL
)
DELETE FROM player_season_stats AS stats
USING ranked
WHERE stats.ctid = ranked.ctid
  AND ranked.duplicate_number > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'player_season_stats'::regclass
      AND contype = 'u'
      AND conkey = ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'player_season_stats'::regclass AND attname = 'player_id' AND NOT attisdropped),
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'player_season_stats'::regclass AND attname = 'season_id' AND NOT attisdropped),
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'player_season_stats'::regclass AND attname = 'league_id' AND NOT attisdropped)
      ]
  ) THEN
    EXECUTE 'ALTER TABLE player_season_stats
      ADD CONSTRAINT player_season_stats_player_season_league_key
      UNIQUE (player_id, season_id, league_id)';
  END IF;
END
$$;

COMMIT;
