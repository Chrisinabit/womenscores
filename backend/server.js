import 'dotenv/config'
import { timingSafeEqual } from 'node:crypto'
import express from 'express'
import cors from 'cors'
import pool from './db.js'
import {
  isSyncInProgress,
  startAdaptiveLiveSyncLoop,
  syncAllFootballData,
} from './services/footballSync.js'

const app = express()
const port = Number(process.env.PORT || 3000)

app.use(cors())
app.use(express.json())

function positiveId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

app.post(['/api/sync', '/api/sync/enrich'], async (request, response, next) => {
  if (process.env.NODE_ENV === 'production') {
    const expectedToken = process.env.SYNC_API_SECRET
    const authorization = request.get('authorization') || ''

    if (!expectedToken) {
      response.status(404).json({ error: 'Not found' })
      return
    }

    const suppliedToken = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : ''
    const expectedBuffer = Buffer.from(expectedToken)
    const suppliedBuffer = Buffer.from(suppliedToken)

    if (
      expectedBuffer.length !== suppliedBuffer.length
      || !timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      response.status(401).json({ error: 'Unauthorized' })
      return
    }
  }

  if (isSyncInProgress()) {
    response.status(409).json({ error: 'A football data sync is already running' })
    return
  }

  try {
    const result = await syncAllFootballData()
    const message = request.path.endsWith('/enrich')
      ? 'Football enrichment sync completed'
      : 'Football data sync completed'
    response.json({ message, ...result })
  } catch (error) {
    next(error)
  }
})

app.get('/api/matches', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        m.id::int AS "matchId",
        m.status,
        m.match_time AS "matchTime",
        m.kickoff_at AS "kickoffAt",
        m.minute,
        m.home_score AS "homeScore",
        m.away_score AS "awayScore",
        json_build_object(
          'id', l.id,
          'name', l.name,
          'country', l.country,
          'logoUrl', l.logo_url
        ) AS league,
        json_build_object(
          'id', home_team.id,
          'name', home_team.name,
          'shortName', home_team.short_name,
          'crestUrl', home_team.crest_url
        ) AS "homeTeam",
        json_build_object(
          'id', away_team.id,
          'name', away_team.name,
          'shortName', away_team.short_name,
          'crestUrl', away_team.crest_url
        ) AS "awayTeam"
      FROM matches m
      JOIN leagues l ON l.id = m.league_id
      JOIN teams home_team ON home_team.id = m.home_team_id
      JOIN teams away_team ON away_team.id = m.away_team_id
      WHERE m.sportmonks_id IS NOT NULL
        AND l.sportmonks_id IS NOT NULL
        AND home_team.sportmonks_id IS NOT NULL
        AND away_team.sportmonks_id IS NOT NULL
        AND LOWER(m.status) IN ('live', 'scheduled', 'finished', 'postponed')
      ORDER BY m.kickoff_at ASC NULLS LAST, m.match_time ASC
    `)

    response.json(rows)
  } catch (error) {
    next(error)
  }
})

app.get('/api/matches/:id', async (request, response, next) => {
  const matchId = positiveId(request.params.id)
  if (!matchId) {
    response.status(400).json({ error: 'match id must be a positive integer' })
    return
  }

  try {
    const { rows } = await pool.query(
      `
        SELECT
          m.id::int AS "matchId",
          l.name AS competition,
          COALESCE(m.kickoff_at::text, m.match_time::text) AS kickoff,
          m.status,
          m.minute,
          m.venue_name AS venue,
          m.referee_name AS referee,
          m.formation_home AS "formationHome",
          m.formation_away AS "formationAway",
          m.tv_stations AS "tvStations",
          m.statistics,
          json_build_object(
            'home', m.home_score,
            'away', m.away_score
          ) AS score,
          json_build_object(
            'home', json_build_object(
              'id', home_team.id,
              'name', home_team.name,
              'short_name', home_team.short_name,
              'crest_url', home_team.crest_url
            ),
            'away', json_build_object(
              'id', away_team.id,
              'name', away_team.name,
              'short_name', away_team.short_name,
              'crest_url', away_team.crest_url
            )
          ) AS teams,
          json_build_object(
            'home_votes', COALESCE(p.home_votes, 0),
            'draw_votes', COALESCE(p.draw_votes, 0),
            'away_votes', COALESCE(p.away_votes, 0)
          ) AS "matchPolls"
        FROM matches m
        JOIN leagues l ON l.id = m.league_id
        JOIN teams home_team ON home_team.id = m.home_team_id
        JOIN teams away_team ON away_team.id = m.away_team_id
        LEFT JOIN match_polls p ON p.match_id = m.id
        WHERE m.id = $1
          AND m.sportmonks_id IS NOT NULL
          AND l.sportmonks_id IS NOT NULL
      `,
      [matchId],
    )

    if (rows.length === 0) {
      response.status(404).json({ error: 'Match not found' })
      return
    }

    const match = rows[0]
    const [eventsResult, lineupsResult] = await Promise.all([
      pool.query(
        `
          SELECT
            e.id::int AS id,
            e.minute,
            e.added_time AS "addedTime",
            CASE e.event_type
              WHEN '14' THEN 'goal'
              WHEN '15' THEN 'own_goal'
              WHEN '16' THEN 'penalty'
              WHEN '17' THEN 'missed_penalty'
              WHEN '18' THEN 'substitution'
              WHEN '19' THEN 'yellow_card'
              WHEN '20' THEN 'red_card'
              WHEN '21' THEN 'yellow_red_card'
              ELSE e.event_type
            END AS type,
            CASE
              WHEN e.team_id = m.home_team_id THEN 'home'
              WHEN e.team_id = m.away_team_id THEN 'away'
              ELSE NULL
            END AS team,
            COALESCE(player.common_name, player.name) AS player,
            COALESCE(e.detail, e.result) AS detail,
            COALESCE(secondary_player.common_name, secondary_player.name) AS "secondaryPlayer"
          FROM match_events e
          JOIN matches m ON m.id = e.match_id
          LEFT JOIN players player ON player.id = e.player_id
          LEFT JOIN players secondary_player ON secondary_player.id = e.secondary_player_id
          WHERE e.match_id = $1
          ORDER BY e.minute ASC NULLS LAST, e.added_time ASC NULLS LAST, e.id ASC
        `,
        [matchId],
      ),
      pool.query(
        `
          SELECT
            ml.team_id AS "teamId",
            p.id::int AS "playerId",
            COALESCE(p.common_name, p.name) AS name,
            ml.jersey_number AS number,
            ml.position_name AS position,
            ml.rating::float8 AS rating,
            ml.lineup_type AS type
          FROM match_lineups ml
          JOIN players p ON p.id = ml.player_id
          WHERE ml.match_id = $1
          ORDER BY ml.lineup_type ASC, ml.jersey_number ASC NULLS LAST, p.name ASC
        `,
        [matchId],
      ),
    ])

    const lineups = {
      home: { starting_xi: [], substitutes: [] },
      away: { starting_xi: [], substitutes: [] },
    }

    for (const player of lineupsResult.rows) {
      const side = Number(player.teamId) === Number(match.teams.home.id)
        ? 'home'
        : Number(player.teamId) === Number(match.teams.away.id)
          ? 'away'
          : null
      if (!side) continue

      const collection = player.type === 'substitute' ? 'substitutes' : 'starting_xi'
      lineups[side][collection].push({
        id: player.playerId,
        name: player.name,
        number: player.number,
        position: player.position,
        rating: player.rating === null ? null : Number(player.rating),
      })
    }

    response.json({
      match_id: match.matchId,
      competition: match.competition,
      kickoff: match.kickoff,
      status: match.status,
      minute: match.minute,
      venue: match.venue,
      referee: match.referee,
      formation_home: match.formationHome,
      formation_away: match.formationAway,
      teams: match.teams,
      score: match.score,
      tv_stations: match.tvStations || [],
      statistics: match.statistics || {},
      match_events: eventsResult.rows.map((event) => ({
        ...event,
        added_time: event.addedTime,
        secondary_player: event.secondaryPlayer,
      })),
      match_lineups: lineups,
      match_polls: match.matchPolls,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/standings/:leagueId', async (request, response, next) => {
  const leagueId = Number(request.params.leagueId)

  if (!Number.isInteger(leagueId) || leagueId < 1) {
    response.status(400).json({ error: 'leagueId must be a positive integer' })
    return
  }

  try {
    const { rows } = await pool.query(
      `
        SELECT
          s.rank,
          s.played,
          s.won,
          s.drawn,
          s.lost,
          s.goals_for AS "goalsFor",
          s.goals_against AS "goalsAgainst",
          s.goal_difference AS "goalDifference",
          s.points,
          s.form,
          t.id AS "teamId",
          t.name AS "teamName",
          t.short_name AS "teamShortName",
          t.crest_url AS "teamCrestUrl"
        FROM standings s
        JOIN teams t ON t.id = s.team_id
        JOIN leagues l ON l.id = s.league_id
        WHERE s.league_id = $1
          AND l.sportmonks_id IS NOT NULL
          AND t.sportmonks_id IS NOT NULL
        ORDER BY s.rank ASC
      `,
      [leagueId],
    )

    response.json(rows)
  } catch (error) {
    next(error)
  }
})

app.get('/api/leagues/:id/leaders', async (request, response, next) => {
  const leagueId = positiveId(request.params.id)
  if (!leagueId) {
    response.status(400).json({ error: 'league id must be a positive integer' })
    return
  }

  try {
    const [scorers, assists] = await Promise.all([
      pool.query(
        `
          SELECT
            ROW_NUMBER() OVER (ORDER BY s.goals DESC, s.appearances DESC, p.name ASC)::int AS rank,
            p.id::int AS "playerId",
            COALESCE(p.common_name, p.name) AS "playerName",
            t.id::int AS "teamId",
            t.name AS "teamName",
            t.short_name AS "teamShortName",
            t.crest_url AS "teamCrestUrl",
            s.appearances,
            s.goals,
            s.assists
          FROM player_season_stats s
          JOIN players p ON p.id = s.player_id
          JOIN leagues l ON l.id = s.league_id
          LEFT JOIN teams t ON t.id = s.team_id
          WHERE s.league_id = $1
            AND s.season_id = l.sportmonks_season_id
            AND l.sportmonks_id IS NOT NULL
            AND s.goals > 0
          ORDER BY s.goals DESC, s.appearances DESC, p.name ASC
          LIMIT 10
        `,
        [leagueId],
      ),
      pool.query(
        `
          SELECT
            ROW_NUMBER() OVER (ORDER BY s.assists DESC, s.appearances DESC, p.name ASC)::int AS rank,
            p.id::int AS "playerId",
            COALESCE(p.common_name, p.name) AS "playerName",
            t.id::int AS "teamId",
            t.name AS "teamName",
            t.short_name AS "teamShortName",
            t.crest_url AS "teamCrestUrl",
            s.appearances,
            s.goals,
            s.assists
          FROM player_season_stats s
          JOIN players p ON p.id = s.player_id
          JOIN leagues l ON l.id = s.league_id
          LEFT JOIN teams t ON t.id = s.team_id
          WHERE s.league_id = $1
            AND s.season_id = l.sportmonks_season_id
            AND l.sportmonks_id IS NOT NULL
            AND s.assists > 0
          ORDER BY s.assists DESC, s.appearances DESC, p.name ASC
          LIMIT 10
        `,
        [leagueId],
      ),
    ])

    response.json({ topScorers: scorers.rows, topAssists: assists.rows })
  } catch (error) {
    next(error)
  }
})

app.get('/api/search', async (request, response, next) => {
  const query = typeof request.query.q === 'string' ? request.query.q.trim() : ''
  if (!query || query.length > 100) {
    response.status(400).json({ error: 'q must contain between 1 and 100 characters' })
    return
  }

  const pattern = `%${query}%`
  try {
    const [clubs, players] = await Promise.all([
      pool.query(
        `
          SELECT
            t.id::int AS id,
            t.name,
            t.short_name AS "shortName",
            t.crest_url AS "crestUrl",
            l.id::int AS "competitionId",
            l.name AS "competitionName",
            l.country
          FROM teams t
          JOIN leagues l ON l.id = t.league_id
          WHERE t.sportmonks_id IS NOT NULL
            AND l.sportmonks_id IS NOT NULL
            AND (
              t.name ILIKE $1
              OR COALESCE(t.short_name, '') ILIKE $1
            )
          ORDER BY t.name ASC
          LIMIT 10
        `,
        [pattern],
      ),
      pool.query(
        `
          SELECT
            p.id::int AS id,
            p.name,
            p.common_name AS "commonName",
            p.position_name AS position,
            p.image_url AS "imageUrl",
            current_team.id::int AS "teamId",
            current_team.name AS "teamName",
            current_team.short_name AS "teamShortName",
            current_team.crest_url AS "teamCrestUrl",
            current_team.league_id::int AS "competitionId",
            current_team.league_name AS "competitionName"
          FROM players p
          LEFT JOIN LATERAL (
            SELECT
              t.id,
              t.name,
              t.short_name,
              t.crest_url,
              l.id AS league_id,
              l.name AS league_name
            FROM player_season_stats s
            JOIN teams t ON t.id = s.team_id
            JOIN leagues l ON l.id = s.league_id
            WHERE s.player_id = p.id
              AND l.sportmonks_id IS NOT NULL
            ORDER BY s.season_id DESC, s.appearances DESC
            LIMIT 1
          ) current_team ON TRUE
          WHERE p.name ILIKE $1
            OR COALESCE(p.common_name, '') ILIKE $1
          ORDER BY COALESCE(p.common_name, p.name) ASC
          LIMIT 10
        `,
        [pattern],
      ),
    ])

    response.json({ clubs: clubs.rows, players: players.rows })
  } catch (error) {
    next(error)
  }
})

app.post('/api/matches/:id/vote', async (request, response, next) => {
  const matchId = positiveId(request.params.id)
  const choice = request.body?.choice
  if (!matchId) {
    response.status(400).json({ error: 'match id must be a positive integer' })
    return
  }
  if (!['home', 'draw', 'away'].includes(choice)) {
    response.status(400).json({ error: "choice must be 'home', 'draw', or 'away'" })
    return
  }

  try {
    const { rows } = await pool.query(
      `
        INSERT INTO match_polls (match_id, home_votes, draw_votes, away_votes)
        SELECT
          m.id,
          CASE WHEN $2 = 'home' THEN 1 ELSE 0 END,
          CASE WHEN $2 = 'draw' THEN 1 ELSE 0 END,
          CASE WHEN $2 = 'away' THEN 1 ELSE 0 END
        FROM matches m
        WHERE m.id = $1
          AND m.sportmonks_id IS NOT NULL
        ON CONFLICT (match_id) DO UPDATE
        SET home_votes = match_polls.home_votes + EXCLUDED.home_votes,
            draw_votes = match_polls.draw_votes + EXCLUDED.draw_votes,
            away_votes = match_polls.away_votes + EXCLUDED.away_votes,
            updated_at = NOW()
        RETURNING home_votes::int AS home_votes,
                  draw_votes::int AS draw_votes,
                  away_votes::int AS away_votes
      `,
      [matchId, choice],
    )

    if (rows.length === 0) {
      response.status(404).json({ error: 'Match not found' })
      return
    }

    response.json(rows[0])
  } catch (error) {
    next(error)
  }
})

app.get('/api/leagues', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id::int AS id, name, country, logo_url AS "logoUrl"
      FROM leagues
      WHERE sportmonks_id IS NOT NULL
      ORDER BY name ASC
    `)

    response.json(rows)
  } catch (error) {
    next(error)
  }
})

app.use((request, response) => {
  response.status(404).json({ error: `Route not found: ${request.method} ${request.path}` })
})

app.use((error, _request, response, _next) => {
  console.error('API request failed:', error)
  const details = process.env.NODE_ENV === 'production' ? undefined : error.message
  response.status(500).json({ error: 'Internal server error', details })
})

app.listen(port, () => {
  console.log(`womenscores API listening on port ${port}`)

  if (process.env.SPORTMONKS_API_TOKEN) {
    syncAllFootballData()
      .then((result) => {
        console.log('Startup football sync completed:', result)
      })
      .catch((error) => {
        console.error('Startup football sync failed:', error)
      })
      .finally(() => {
        startAdaptiveLiveSyncLoop()
      })

    console.log('Adaptive live fixture sync will start after startup sync completes')
  } else {
    console.warn('Startup and scheduled football sync are disabled because SPORTMONKS_API_TOKEN is not configured')
  }
})
