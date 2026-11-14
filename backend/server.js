import 'dotenv/config'
import { timingSafeEqual } from 'node:crypto'
import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import pool from './db.js'
import {
  isSyncInProgress,
  syncAllFootballData,
  syncLiveFixtures,
} from './services/footballSync.js'

const app = express()
const port = Number(process.env.PORT || 3000)

app.use(cors())
app.use(express.json())

app.post('/api/sync', async (request, response, next) => {
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
    response.json({ message: 'Football data sync completed', ...(await syncAllFootballData()) })
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
        AND LOWER(m.status) IN ('live', 'scheduled', 'finished')
      ORDER BY m.kickoff_at ASC NULLS LAST, m.match_time ASC
    `)

    response.json(rows)
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
    cron.schedule('*/5 * * * *', async () => {
      if (isSyncInProgress()) {
        console.log('Skipping live fixture sync because another sync is in progress')
        return
      }

      try {
        const result = await syncLiveFixtures()
        console.log(`Updated ${result.fixtures} live fixture records`)
      } catch (error) {
        console.error('Scheduled football sync failed:', error)
      }
    })
    console.log('Live fixture sync scheduled every 5 minutes')
  } else {
    console.warn('Live fixture sync is disabled because SPORTMONKS_API_TOKEN is not configured')
  }
})
