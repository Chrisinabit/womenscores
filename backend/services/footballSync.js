import 'dotenv/config'
import axios from 'axios'
import pool from '../db.js'

const apiToken = process.env.SPORTMONKS_API_TOKEN
const api = axios.create({
  baseURL: process.env.SPORTMONKS_BASE_URL || 'https://api.sportmonks.com/v3/football',
  timeout: 20_000,
})

const liveIncludes = 'participants;scores;periods;events;league;state'
const fixtureIncludes = 'participants;scores;state;league'
const standingsIncludes = 'participant;details'
const liveCacheTtlMs = 20_000
const requestIntervalMs = Number(process.env.SPORTMONKS_MIN_INTERVAL_MS || 1000)
const upcomingFixtureDays = Number(process.env.UPCOMING_FIXTURE_DAYS || 14)
const pastFixtureDays = Number(process.env.PAST_FIXTURE_DAYS || 7)
// Sportmonks uses numeric periods ("1st", "2nd") for in-play fixtures; the
// short codes are kept as well in case the API ever switches between the two.
const activeStates = new Set([
  'LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT',
  '1ST', '2ND', 'ET1ST', 'ET2ND', 'PEN', 'BREAK',
])
const finishedStates = new Set(['FT', 'AET', 'FT_PEN', 'AWD', 'WO'])
const stateMap = new Map([
  ['NS', 'scheduled'],
  ['TBA', 'scheduled'],
  ['POST', 'postponed'],
  ['PST', 'postponed'],
  ['CANC', 'cancelled'],
  ['ABD', 'abandoned'],
  ['SUSP', 'suspended'],
])
const standingDetailIds = {
  played: 129,
  won: 130,
  drawn: 131,
  lost: 132,
  goalsFor: 133,
  goalsAgainst: 134,
  goalDifference: 179,
}

let lastRequestAt = 0
let requestQueue = Promise.resolve()
let syncInProgress = false
let matchTimeType
let liveCache = { expiresAt: 0, key: '', fixtures: [] }
let liveCacheRequest = null

if (!Number.isInteger(requestIntervalMs) || requestIntervalMs < 0) {
  throw new Error('SPORTMONKS_MIN_INTERVAL_MS must be a non-negative integer')
}

if (!Number.isInteger(upcomingFixtureDays) || upcomingFixtureDays < 1 || upcomingFixtureDays > 30) {
  throw new Error('UPCOMING_FIXTURE_DAYS must be an integer between 1 and 30')
}

if (!Number.isInteger(pastFixtureDays) || pastFixtureDays < 0 || pastFixtureDays > 30) {
  throw new Error('PAST_FIXTURE_DAYS must be an integer between 0 and 30')
}

function requireApiToken() {
  if (!apiToken) {
    throw new Error('SPORTMONKS_API_TOKEN is not configured')
  }
}

function unwrapData(payload) {
  if (Array.isArray(payload.data)) {
    return payload.data
  }

  return payload.data ? [payload.data] : []
}

async function getPage(path, params) {
  requireApiToken()

  const run = requestQueue.then(async () => {
    const elapsed = Date.now() - lastRequestAt
    if (lastRequestAt && elapsed < requestIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, requestIntervalMs - elapsed))
    }

    try {
      const { data } = await api.get(path, {
        params: { ...params, api_token: apiToken },
      })
      lastRequestAt = Date.now()

      if (data.errors && Object.keys(data.errors).length > 0) {
        throw new Error(`Sportmonks rejected ${path}: ${JSON.stringify(data.errors)}`)
      }

      if (!Object.hasOwn(data, 'data')) {
        throw new Error(`Sportmonks returned an invalid response for ${path}`)
      }

      return data
    } catch (error) {
      lastRequestAt = Date.now()
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const apiErrors = error.response?.data?.errors
        const details = apiErrors ? `: ${JSON.stringify(apiErrors)}` : ''
        throw new Error(
          `Sportmonks request ${path} failed${status ? ` with HTTP ${status}` : ''}${details}`,
        )
      }

      throw error
    }
  })

  requestQueue = run.then(() => undefined, () => undefined)
  return run
}

async function getAllData(path, params = {}) {
  const items = []
  let cursor

  for (let pageNumber = 0; pageNumber < 100; pageNumber += 1) {
    const query = { ...params }
    if (cursor) query.cursor = cursor

    const payload = await getPage(path, query)
    items.push(...unwrapData(payload))

    if (!payload.pagination?.has_more) {
      return items
    }

    cursor = payload.pagination.next_cursor
    if (!cursor) {
      throw new Error(`Sportmonks indicated more pages for ${path} without a next cursor`)
    }
  }

  throw new Error(`Sportmonks pagination exceeded 100 pages for ${path}`)
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function selectedCompetition(league, country) {
  const name = normalizeText(league.name)
  const region = normalizeText(country?.name || country)

  if (
    name.includes('community shield')
    || name.includes('challenge cup')
    || name.includes('summer cup')
    || name.includes('serie a cup')
  ) {
    return false
  }

  if (
    region === 'england'
    && name.includes('super league')
    && (name.includes('womens') || name.includes('women') || name.includes('barclays') || name.includes('fa'))
  ) {
    return true
  }

  if (name.includes('nwsl') && !name.includes('cup')) {
    return true
  }

  if (
    region === 'spain'
    && (name === 'liga f' || name.startsWith('liga f ') || name.includes('primera division femenina'))
  ) {
    return true
  }

  if (
    region === 'italy'
    && name.includes('serie a')
    && (name.includes('women') || name.includes('femminile'))
  ) {
    return true
  }

  if (
    name.includes('champions league')
    && name.includes('women')
    && (name.includes('uefa') || region === 'world' || region === 'europe')
  ) {
    return true
  }

  return region === 'germany'
    && (name.includes('frauen bundesliga') || name.includes('bundesliga frauen'))
}

export function isWomensLeague(league) {
  return selectedCompetition(league, league.country)
}

function currentSeason(league) {
  return league.currentSeason
    || league.currentseason
    || league.current_season
    || league.seasons?.find((season) => season.is_current === true)
    || null
}

function leagueLogo(league) {
  return league.image_path || league.logo || null
}

async function discoverLeagues() {
  const leagues = await getAllData('/leagues', {
    include: 'currentSeason;seasons;country',
    per_page: 50,
  })
  const selected = leagues.filter((league) => (
    league.id
    && league.name
    && currentSeason(league)?.id
    && selectedCompetition(league, league.country)
  ))

  if (selected.length === 0) {
    throw new Error('No whitelisted women’s leagues with a current season are available to this Sportmonks token')
  }

  return selected
}

async function upsertLeague(league) {
  const season = currentSeason(league)
  if (!season?.id) {
    throw new Error(`Sportmonks did not return a current season for ${league.name}`)
  }

  const country = league.country?.name || league.country || 'Unknown'
  const { rows } = await pool.query(
    `
      INSERT INTO leagues (
        sportmonks_id, sportmonks_season_id, name, country, logo_url
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (sportmonks_id) DO UPDATE
      SET sportmonks_season_id = EXCLUDED.sportmonks_season_id,
          name = EXCLUDED.name,
          country = EXCLUDED.country,
          logo_url = EXCLUDED.logo_url
      RETURNING id
    `,
    [league.id, season.id, league.name, country, leagueLogo(league)],
  )

  return rows[0].id
}

async function upsertTeam(participant, leagueId) {
  if (!participant?.id || !participant.name) {
    throw new Error('Sportmonks returned a participant without an ID or name')
  }

  const { rows } = await pool.query(
    `
      INSERT INTO teams (
        sportmonks_id, league_id, name, short_name, crest_url
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (sportmonks_id, league_id) DO UPDATE
      SET name = EXCLUDED.name,
          short_name = EXCLUDED.short_name,
          crest_url = EXCLUDED.crest_url
      RETURNING id
    `,
    [
      participant.id,
      leagueId,
      participant.name,
      participant.short_code || participant.short_name || participant.name.slice(0, 3).toUpperCase(),
      participant.image_path || null,
    ],
  )

  return rows[0].id
}

function detailValue(details, typeId) {
  const detail = details.find((item) => Number(item.type_id) === typeId)
  const value = detail?.value
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  return 0
}

async function syncStandings(league, localLeagueId) {
  const standings = await getAllData(
    `/standings/seasons/${league.seasonId}`,
    { include: standingsIncludes, per_page: 50 },
  )

  for (const standing of standings) {
    if (!standing.participant?.id || !standing.participant?.name) {
      throw new Error(`Sportmonks returned a standings row without a participant for ${league.name}`)
    }

    const teamId = await upsertTeam(standing.participant, localLeagueId)
    const details = standing.details || []
    const { played, won, drawn, lost, goalsFor, goalsAgainst, goalDifference } =
      Object.fromEntries(
        Object.entries(standingDetailIds).map(([field, typeId]) => [
          field,
          detailValue(details, typeId),
        ]),
      )

    await pool.query(
      `
        INSERT INTO standings (
          league_id, team_id, rank, played, won, drawn, lost,
          goals_for, goals_against, goal_difference, points, form
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (league_id, team_id) DO UPDATE
        SET rank = EXCLUDED.rank,
            played = EXCLUDED.played,
            won = EXCLUDED.won,
            drawn = EXCLUDED.drawn,
            lost = EXCLUDED.lost,
            goals_for = EXCLUDED.goals_for,
            goals_against = EXCLUDED.goals_against,
            goal_difference = EXCLUDED.goal_difference,
            points = EXCLUDED.points,
            form = EXCLUDED.form
      `,
      [
        localLeagueId,
        teamId,
        standing.position ?? 0,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference,
        Number(standing.points) || 0,
        typeof standing.form === 'string' ? standing.form : '',
      ],
    )
  }

  return standings.length
}

async function getMatchTimeDataType() {
  if (matchTimeType) return matchTimeType

  const { rows } = await pool.query(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'matches'
      AND column_name = 'match_time'
  `)

  if (rows.length === 0) {
    throw new Error('matches.match_time does not exist in the current database schema')
  }

  matchTimeType = rows[0].data_type
  return matchTimeType
}

function kickoffDateTime(fixture) {
  if (Number.isFinite(Number(fixture.starting_at_timestamp))) {
    return new Date(Number(fixture.starting_at_timestamp) * 1000).toISOString()
  }

  if (!fixture.starting_at) {
    throw new Error(`Sportmonks fixture ${fixture.id} is missing its start time`)
  }

  const date = new Date(fixture.starting_at)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Sportmonks returned an invalid fixture start time: ${fixture.starting_at}`)
  }

  return date.toISOString()
}

function formatMatchTime(date, dataType) {
  const kickoff = new Date(date)
  if (Number.isNaN(kickoff.getTime())) {
    throw new Error(`Sportmonks returned an invalid fixture start time: ${date}`)
  }

  if (dataType === 'time' || dataType.startsWith('time ')) {
    return kickoff.toISOString().slice(11, 19)
  }
  if (dataType.includes('timestamp') || ['text', 'character varying', 'character'].includes(dataType)) {
    return kickoff.toISOString()
  }

  throw new Error(`Unsupported matches.match_time type: ${dataType}`)
}

// Returns null when the fixture carries no state, so callers can leave the
// stored status untouched instead of overwriting it with a guess.
function normalizedStatus(shortName) {
  const state = String(shortName || '').trim().toUpperCase()
  if (!state) return null
  if (activeStates.has(state)) return 'live'
  if (finishedStates.has(state)) return 'finished'
  return stateMap.get(state) || 'scheduled'
}

function getParticipants(fixture) {
  const participants = fixture.participants || []
  return {
    home: participants.find((participant) => participant.meta?.location === 'home'),
    away: participants.find((participant) => participant.meta?.location === 'away'),
  }
}

function getCurrentScores(fixture) {
  const scores = (fixture.scores || []).filter((score) => score.description === 'CURRENT')
  return Object.fromEntries(
    scores.map((score) => [
      score.score?.participant,
      score.score?.goals !== null && Number.isFinite(Number(score.score?.goals))
        ? Number(score.score.goals)
        : null,
    ]),
  )
}

function fixtureMinute(fixture) {
  const period = (fixture.periods || []).find((item) => item.ticking === true)
  return Number.isInteger(period?.minutes) ? period.minutes : null
}

export function normalizeFixture(fixture) {
  const participants = getParticipants(fixture)
  const scores = getCurrentScores(fixture)
  const league = fixture.league || {}

  if (!participants.home || !participants.away) {
    throw new Error(`Sportmonks fixture ${fixture.id} is missing home or away participants`)
  }

  return {
    matchId: fixture.id,
    status: normalizedStatus(fixture.state?.short_name),
    matchTime: fixture.starting_at,
    kickoffAt: fixture.starting_at_timestamp
      ? new Date(Number(fixture.starting_at_timestamp) * 1000).toISOString()
      : fixture.starting_at,
    minute: fixtureMinute(fixture),
    homeScore: scores.home ?? null,
    awayScore: scores.away ?? null,
    league: {
      id: league.id || fixture.league_id,
      name: league.name || '',
      country: league.country?.name || '',
      logoUrl: league.image_path || null,
    },
    homeTeam: {
      id: participants.home.id,
      name: participants.home.name,
      shortName: participants.home.short_code || participants.home.short_name || null,
      crestUrl: participants.home.image_path || null,
    },
    awayTeam: {
      id: participants.away.id,
      name: participants.away.name,
      shortName: participants.away.short_code || participants.away.short_name || null,
      crestUrl: participants.away.image_path || null,
    },
  }
}

async function persistFixtures(fixtures, trackedLeagues) {
  const matchTimeDataType = await getMatchTimeDataType()
  let saved = 0

  for (const fixture of fixtures) {
    const league = trackedLeagues.get(Number(fixture.league_id || fixture.league?.id))
    if (!league) continue

    const participants = getParticipants(fixture)
    if (!participants.home || !participants.away) {
      console.warn(`Skipping Sportmonks fixture ${fixture.id}: home or away participant is missing`)
      continue
    }

    const homeTeamId = await upsertTeam(participants.home, league.id)
    const awayTeamId = await upsertTeam(participants.away, league.id)
    const status = normalizedStatus(fixture.state?.short_name)
    const kickoffAt = kickoffDateTime(fixture)
    const matchTime = formatMatchTime(kickoffAt, matchTimeDataType)
    const scores = getCurrentScores(fixture)
    const minute = fixtureMinute(fixture)

    if (status === null) {
      // No state in the payload: keep whatever status is already stored.
      await pool.query(
        `
          INSERT INTO matches (
            sportmonks_id, league_id, home_team_id, away_team_id,
            minute, home_score, away_score, match_time, kickoff_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (sportmonks_id) DO UPDATE
          SET league_id = EXCLUDED.league_id,
              home_team_id = EXCLUDED.home_team_id,
              away_team_id = EXCLUDED.away_team_id,
              home_score = EXCLUDED.home_score,
              away_score = EXCLUDED.away_score,
              match_time = EXCLUDED.match_time,
              kickoff_at = EXCLUDED.kickoff_at
        `,
        [
          fixture.id,
          league.id,
          homeTeamId,
          awayTeamId,
          minute,
          scores.home ?? null,
          scores.away ?? null,
          matchTime,
          kickoffAt,
        ],
      )
      saved += 1
      continue
    }

    await pool.query(
      `
        INSERT INTO matches (
          sportmonks_id, league_id, home_team_id, away_team_id,
          status, minute, home_score, away_score, match_time, kickoff_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (sportmonks_id) DO UPDATE
        SET league_id = EXCLUDED.league_id,
            home_team_id = EXCLUDED.home_team_id,
            away_team_id = EXCLUDED.away_team_id,
            status = EXCLUDED.status,
            minute = EXCLUDED.minute,
            home_score = EXCLUDED.home_score,
            away_score = EXCLUDED.away_score,
            match_time = EXCLUDED.match_time,
            kickoff_at = EXCLUDED.kickoff_at
      `,
      [
        fixture.id,
        league.id,
        homeTeamId,
        awayTeamId,
        status,
        status === 'live' ? minute : null,
        scores.home ?? null,
        scores.away ?? null,
        matchTime,
        kickoffAt,
      ],
    )
    saved += 1
  }

  return saved
}

async function getTrackedLeagues() {
  const { rows } = await pool.query(`
    SELECT id, sportmonks_id, sportmonks_season_id, name
    FROM leagues
    WHERE sportmonks_id IS NOT NULL
      AND sportmonks_season_id IS NOT NULL
  `)

  return new Map(
    rows.map((row) => [
      Number(row.sportmonks_id),
      { id: row.id, seasonId: Number(row.sportmonks_season_id), name: row.name },
    ]),
  )
}

async function getLiveFixtures(leagueIds) {
  const key = [...leagueIds].sort((a, b) => a - b).join(',')
  if (liveCache.key === key && liveCache.expiresAt > Date.now()) {
    return liveCache.fixtures
  }

  if (liveCacheRequest?.key === key) {
    return liveCacheRequest.promise
  }

  const promise = getAllData('/livescores/inplay', {
    filters: `fixtureLeagues:${key}`,
    include: liveIncludes,
    per_page: 50,
  }).then((fixtures) => {
    liveCache = { key, fixtures, expiresAt: Date.now() + liveCacheTtlMs }
    return fixtures
  }).finally(() => {
    if (liveCacheRequest?.key === key) liveCacheRequest = null
  })

  liveCacheRequest = { key, promise }
  return promise
}

async function getFixturesForDate(date, leagueIds) {
  return getAllData(`/fixtures/date/${date}`, {
    filters: `fixtureLeagues:${leagueIds.join(',')}`,
    include: fixtureIncludes,
    per_page: 50,
  })
}

function dateForOffset(offset) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

async function withSyncLock(sync) {
  if (syncInProgress) {
    throw new Error('A football data sync is already running')
  }

  syncInProgress = true
  try {
    return await sync()
  } finally {
    syncInProgress = false
  }
}

export function isSyncInProgress() {
  return syncInProgress
}

export async function syncAllFootballData() {
  return withSyncLock(async () => {
    const discovered = await discoverLeagues()
    const trackedLeagues = new Map()
    let teamCount = 0
    let standingsCount = 0

    for (const league of discovered) {
      const seasonId = Number(currentSeason(league).id)
      const localLeagueId = await upsertLeague(league)
      trackedLeagues.set(Number(league.id), {
        id: localLeagueId,
        seasonId,
        name: league.name,
      })

      standingsCount += await syncStandings(
        { name: league.name, seasonId },
        localLeagueId,
      )
    }

    const leagueIds = [...trackedLeagues.keys()]
    let fixtureCount = 0

    for (let offset = -pastFixtureDays; offset < upcomingFixtureDays; offset += 1) {
      const fixtures = await getFixturesForDate(dateForOffset(offset), leagueIds)
      fixtureCount += await persistFixtures(fixtures, trackedLeagues)
    }

    const liveFixtures = await getLiveFixtures(leagueIds)
    fixtureCount += await persistFixtures(liveFixtures, trackedLeagues)

    const { rows } = await pool.query(
      `
        SELECT COUNT(DISTINCT sportmonks_id)::int AS count
        FROM teams
        WHERE sportmonks_id IS NOT NULL
          AND league_id = ANY($1)
      `,
      [[...trackedLeagues.values()].map((league) => league.id)],
    )
    teamCount = rows[0].count

    return {
      leagues: discovered.length,
      teams: teamCount,
      standings: standingsCount,
      fixtures: fixtureCount,
    }
  })
}

export async function syncLiveFixtures() {
  return withSyncLock(async () => {
    const trackedLeagues = await getTrackedLeagues()
    if (trackedLeagues.size === 0) {
      return { fixtures: 0 }
    }

    const leagueIds = [...trackedLeagues.keys()]
    const fixtures = await getLiveFixtures(leagueIds)

    // In-play fixtures only cover matches currently being played, so a match
    // that finished since the last full sync would keep its last live state
    // forever. Re-check today's fixtures every run so results settle.
    let fixturesByDate = []
    try {
      fixturesByDate = await getFixturesForDate(dateForOffset(0), leagueIds)
    } catch (error) {
      console.error('Could not refresh today\'s fixtures:', error)
    }

    const byId = new Map(fixtures.map((fixture) => [Number(fixture.id), fixture]))
    for (const fixture of fixturesByDate) {
      byId.set(Number(fixture.id), fixture)
    }

    const fixtureCount = await persistFixtures([...byId.values()], trackedLeagues)
    return { fixtures: fixtureCount }
  })
}
