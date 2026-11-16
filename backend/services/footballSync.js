import 'dotenv/config'
import axios from 'axios'
import pool from '../db.js'

const apiToken = process.env.SPORTMONKS_API_TOKEN
const api = axios.create({
  baseURL: process.env.SPORTMONKS_BASE_URL || 'https://api.sportmonks.com/v3/football',
  timeout: 20_000,
})

const fixtureRequiredIncludes = ['participants', 'scores', 'state', 'league', 'periods']
const fixtureOptionalIncludes = [
  'venue',
  'referees',
  'tvstations.tvstation',
  'events',
  'lineups',
  'statistics',
]
const standingsIncludes = 'participant;details'
const topScorerRequiredIncludes = ['player', 'participant']
const topScorerOptionalIncludes = ['type']
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
        const providerError = new Error(`Sportmonks rejected ${path}: ${JSON.stringify(data.errors)}`)
        if (isRestrictedIncludeError(providerError)) {
          throw providerError
        }
        if (Object.hasOwn(data, 'data')) {
          console.warn(`Sportmonks returned partial data for ${path}: ${JSON.stringify(data.errors)}`)
        } else {
          throw providerError
        }
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

function isRestrictedIncludeError(error) {
  const message = error instanceof Error ? error.message : String(error)
  return /HTTP (?:403|422)|include.{0,80}(?:error|restrict|not available|not allowed|not permitted|permission|plan|trial|invalid|unsupported|unknown|not found|unauthorized|forbidden)|(?:trial|subscription).{0,80}include/i.test(message)
}

async function getAllDataWithOptionalIncludes(
  endpoint,
  params,
  requiredIncludes,
  optionalIncludes = [],
) {
  const includes = [...requiredIncludes, ...optionalIncludes]

  try {
    return await getAllData(endpoint, {
      ...params,
      include: includes.join(';'),
    })
  } catch (error) {
    if (!isRestrictedIncludeError(error)) throw error

    console.warn(`Retrying Sportmonks ${endpoint} with required includes only`)
    return getAllData(endpoint, {
      ...params,
      include: requiredIncludes.join(';'),
    })
  }
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

function topScorerStatField(row) {
  const type = relationValue(row.type)
  const name = normalizeText(type?.name || stringValue(row.type) || row.type_name || row.name || '')

  if (name.includes('appearance') || name.includes('matches played')) return 'appearances'
  if (name.includes('yellow')) return 'yellow_cards'
  if (name.includes('red')) return 'red_cards'
  if (name.includes('assist')) return 'assists'
  if (name.includes('goal')) return 'goals'
  return null
}

export async function syncTopScorers(seasonId, leagueId) {
  const rows = await getAllDataWithOptionalIncludes(
    `/topscorers/seasons/${seasonId}`,
    { per_page: 50 },
    topScorerRequiredIncludes,
    topScorerOptionalIncludes,
  )
  const statsByPlayer = new Map()

  for (const row of rows) {
    const player = relationValue(row.player)
    const playerId = await upsertPlayer(
      player,
      row.player_id,
      row.player_name || row.name,
    )
    if (!playerId) continue

    const participant = relationValue(row.participant)
    let teamId = null
    if (participant?.id && participant?.name) {
      teamId = await upsertTeam(participant, leagueId)
    }

    let stats = statsByPlayer.get(playerId)
    if (!stats) {
      stats = {
        teamId,
        goals: null,
        assists: null,
        yellowCards: null,
        redCards: null,
        appearances: null,
        hasValues: false,
      }
      statsByPlayer.set(playerId, stats)
    } else if (teamId !== null) {
      stats.teamId = teamId
    }

    const directValues = {
      goals: numberValue(row.goals),
      assists: numberValue(row.assists),
      yellowCards: numberValue(row.yellow_cards),
      redCards: numberValue(row.red_cards),
      appearances: numberValue(row.appearances),
    }
    for (const [field, value] of Object.entries(directValues)) {
      if (value !== null) {
        stats[field] = Math.trunc(value)
        stats.hasValues = true
      }
    }

    const field = topScorerStatField(row)
    const value = numberValue(row.total ?? row.value ?? row.data?.value)
    if (field && value !== null) {
      const property = field === 'yellow_cards'
        ? 'yellowCards'
        : field === 'red_cards'
          ? 'redCards'
          : field
      stats[property] = Math.trunc(value)
      stats.hasValues = true
    }
  }

  let syncedCount = 0
  for (const [playerId, stats] of statsByPlayer) {
    if (!stats.hasValues) continue

    await pool.query(
      `
        INSERT INTO player_season_stats (
          player_id, season_id, league_id, team_id,
          goals, assists, yellow_cards, red_cards, appearances
        )
        VALUES (
          $1, $2, $3, $4, COALESCE($5, 0), COALESCE($6, 0),
          COALESCE($7, 0), COALESCE($8, 0), COALESCE($9, 0)
        )
        ON CONFLICT (player_id, season_id, league_id) DO UPDATE
        SET team_id = COALESCE(EXCLUDED.team_id, player_season_stats.team_id),
            goals = COALESCE($5, player_season_stats.goals),
            assists = COALESCE($6, player_season_stats.assists),
            yellow_cards = COALESCE($7, player_season_stats.yellow_cards),
            red_cards = COALESCE($8, player_season_stats.red_cards),
            appearances = COALESCE($9, player_season_stats.appearances)
      `,
      [
        playerId,
        seasonId,
        leagueId,
        stats.teamId,
        stats.goals,
        stats.assists,
        stats.yellowCards,
        stats.redCards,
        stats.appearances,
      ],
    )
    syncedCount += 1
  }

  return syncedCount
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
  const participants = relationArray(fixture.participants)
  const participantLocation = (participant) => relationValue(participant.meta)?.location
  return {
    home: participants.find((participant) => participantLocation(participant) === 'home'),
    away: participants.find((participant) => participantLocation(participant) === 'away'),
  }
}

function getCurrentScores(fixture) {
  const scores = relationArray(fixture.scores).filter((score) => score.description === 'CURRENT')
  return Object.fromEntries(scores.map((score) => {
    const currentScore = relationValue(score.score)
    return [currentScore?.participant, numberValue(currentScore?.goals)]
  }))
}

function fixtureMinute(fixture) {
  const period = relationArray(fixture.periods).find((item) => item.ticking === true)
  return integerValue(period?.minutes)
}

function relationValue(value) {
  if (Array.isArray(value)) return value.length > 0 ? relationValue(value[0]) : null
  if (!value || typeof value !== 'object') return null
  if (isDataEnvelope(value)) return relationValue(value.data)
  return value
}

function relationArray(value) {
  if (Array.isArray(value)) return value.flatMap(relationArray)
  if (!value || typeof value !== 'object') return []
  if (isDataEnvelope(value)) return relationArray(value.data)
  return [value]
}

function isDataEnvelope(value) {
  return Object.hasOwn(value, 'data')
    && !['id', 'type', 'type_id', 'participant_id', 'match_id', 'player_id', 'name']
      .some((key) => Object.hasOwn(value, key))
}

function stringValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function integerValue(value) {
  const parsed = numberValue(value)
  return parsed === null ? null : Math.trunc(parsed)
}

function playerName(player) {
  return stringValue(player?.common_name)
    || stringValue(player?.display_name)
    || stringValue(player?.name)
    || [player?.firstname, player?.lastname].map(stringValue).filter(Boolean).join(' ')
    || null
}

async function upsertPlayer(value, fallbackId, fallbackName) {
  if (!value && fallbackId === undefined && fallbackName === undefined) return null
  const player = relationValue(value) || {}
  const id = integerValue(player.id ?? player.player_id ?? fallbackId)
  const name = playerName(player) || stringValue(fallbackName)

  if (!id || id < 1 || !name) {
    console.warn('Skipping Sportmonks player without a valid ID and name')
    return null
  }

  const position = relationValue(player.position)
  const { rows } = await pool.query(
    `
      INSERT INTO players (id, name, common_name, position_name, image_url)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          common_name = COALESCE(EXCLUDED.common_name, players.common_name),
          position_name = COALESCE(EXCLUDED.position_name, players.position_name),
          image_url = COALESCE(EXCLUDED.image_url, players.image_url)
      RETURNING id
    `,
    [
      id,
      name,
      stringValue(player.common_name),
      stringValue(position?.name)
        || stringValue(typeof player.position === 'string' ? player.position : null)
        || stringValue(player.position_name),
      stringValue(player.image_path) || stringValue(player.image_url),
    ],
  )

  return Number(rows[0].id)
}

function hasIncludedField(fixture, names) {
  return names.some((name) => Object.hasOwn(fixture, name))
}

function venueName(fixture) {
  const venue = relationValue(fixture.venue)
  return stringValue(venue?.name)
}

function refereeName(fixture) {
  const referees = relationArray(fixture.referees)
  const mainReferee = referees.find((entry) => (
    normalizeText(relationValue(entry.type)?.name || entry.type?.name || '').includes('referee')
  ))
  const referee = relationValue((mainReferee || referees[0])?.referee) || mainReferee || referees[0]
  return referee ? playerName(referee) : null
}

function tvStations(fixture) {
  if (!hasIncludedField(fixture, ['tvstations', 'tv_stations', 'tvStations'])) return null

  const stations = relationArray(fixture.tvstations ?? fixture.tv_stations ?? fixture.tvStations)
  const uniqueStations = new Map()

  for (const entry of stations) {
    const station = relationValue(entry.tvstation || entry.tvStation) || entry
    const name = stringValue(station.name)
    if (!name) continue

    const country = relationValue(station.country)
    const countryName = typeof country === 'string'
      ? stringValue(country)
      : stringValue(country?.name)
    const logo = stringValue(station.image_path)
      || stringValue(station.logo)
      || stringValue(station.logo_url)
      || stringValue(station.image_url)
    const key = `${name.toLowerCase()}|${countryName || ''}`
    uniqueStations.set(key, { name, country: countryName || '', logo })
  }

  return [...uniqueStations.values()]
}

function statisticKey(entry) {
  const type = relationValue(entry.type)
  const name = normalizeText(type?.name || stringValue(entry.type) || entry.type_name || entry.name || '')

  if (name.includes('possession')) return 'possession'
  if (name.includes('shots on target') || name.includes('shots on goal')) return 'shots_on_target'
  if (name.includes('total shots') || name === 'shots' || name.includes('shots total')) return 'total_shots'
  if (name.includes('corner')) return 'corners'
  return null
}

function normalizeStatistics(fixture, homeParticipantId, awayParticipantId) {
  if (!hasIncludedField(fixture, ['statistics', 'stats'])) return null

  let raw = fixture.statistics ?? fixture.stats
  while (raw && !Array.isArray(raw) && typeof raw === 'object' && isDataEnvelope(raw)) {
    raw = raw.data
  }

  if (raw && !Array.isArray(raw) && typeof raw === 'object') {
    const isStatistic = Object.hasOwn(raw, 'type')
      || Object.hasOwn(raw, 'type_id')
      || Object.hasOwn(raw, 'participant_id')
    if (!isStatistic) return raw
    raw = [raw]
  }

  const result = {}
  for (const entry of relationArray(raw)) {
    const key = statisticKey(entry)
    const value = numberValue(entry.data?.value ?? entry.value)
    if (!key || value === null) continue

    const participant = relationValue(entry.participant)
    const participantId = integerValue(entry.participant_id ?? participant?.id)
    const location = normalizeText(participant?.meta?.location || entry.location || '')
    const side = participantId === Number(homeParticipantId) || location === 'home'
      ? 'home'
      : participantId === Number(awayParticipantId) || location === 'away'
        ? 'away'
        : null
    if (!side) continue

    result[key] ||= {}
    result[key][side] = value
  }

  return result
}

function formationFor(fixture, side, participantId) {
  const formations = fixture.formations ?? fixture.formation
  if (Array.isArray(formations)) {
    const entry = formations.find((item) => (
      Number(item.participant_id || item.team_id) === Number(participantId)
    ))
    return stringValue(entry?.formation) || stringValue(entry?.name)
  }

  const value = formations?.[side]
    || formations?.[`${side}_formation`]
    || fixture[`${side}_formation`]
  const formation = relationValue(value)
  return typeof value === 'string'
    ? stringValue(value)
    : stringValue(formation?.formation) || stringValue(formation?.name)
}

function lineupType(lineup) {
  const type = relationValue(lineup.type)
  const name = normalizeText(type?.name || stringValue(lineup.type) || lineup.type_name || '')
  const typeId = integerValue(lineup.type_id ?? type?.id)
  return name.includes('sub') || name.includes('bench') || typeId === 12
    ? 'substitute'
    : 'starting_xi'
}

function lineupPosition(lineup) {
  const position = relationValue(lineup.position)
  return stringValue(position?.name)
    || stringValue(lineup.position_name)
    || stringValue(lineup.detailed_position)
}

function eventType(event) {
  const type = relationValue(event.type)
  const name = normalizeText(type?.name || event.type_name || event.type || '')

  if (name.includes('goal')) return 'goal'
  if (name.includes('yellow')) return 'yellow_card'
  if (name.includes('red')) return 'red_card'
  if (name.includes('sub')) return 'substitution'
  return stringValue(type?.name) || stringValue(event.type_name) || String(event.type_id || 'unknown')
}

function eventTeamId(event, participants, localTeamIds) {
  const participant = relationValue(event.participant)
  const team = relationValue(event.team)
  const participantId = integerValue(event.participant_id ?? participant?.id ?? event.team_id ?? team?.id)
  if (participantId === Number(participants.home?.id)) return localTeamIds.home
  if (participantId === Number(participants.away?.id)) return localTeamIds.away
  return null
}

async function persistFixtureEvents(fixture, matchId, participants, localTeamIds) {
  const events = relationArray(fixture.events)

  for (const event of events) {
    const eventId = integerValue(event.id)
    if (!eventId || eventId < 1) {
      console.warn(`Skipping Sportmonks event without a valid ID for fixture ${fixture.id}`)
      continue
    }

    const relatedPlayer = event.related_player || event.assist || event.player_out
    const playerId = await upsertPlayer(event.player, event.player_id, event.player_name)
    const secondaryPlayerId = await upsertPlayer(
      relatedPlayer,
      event.related_player_id || event.assist_id || event.player_out_id,
      event.related_player_name,
    )
    const eventName = eventType(event)
    const assistName = playerName(relationValue(event.assist) || relationValue(relatedPlayer))
    const detail = [
      stringValue(event.info) || stringValue(event.description) || stringValue(event.addition),
      eventName === 'goal' && assistName ? `Assist: ${assistName}` : null,
    ].filter(Boolean).join(' · ')

    await pool.query(
      `
        INSERT INTO match_events (
          id, match_id, team_id, player_id, secondary_player_id,
          event_type, minute, added_time, detail, result
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE
        SET match_id = EXCLUDED.match_id,
            team_id = EXCLUDED.team_id,
            player_id = COALESCE(EXCLUDED.player_id, match_events.player_id),
            secondary_player_id = COALESCE(EXCLUDED.secondary_player_id, match_events.secondary_player_id),
            event_type = EXCLUDED.event_type,
            minute = EXCLUDED.minute,
            added_time = EXCLUDED.added_time,
            detail = COALESCE(EXCLUDED.detail, match_events.detail),
            result = COALESCE(EXCLUDED.result, match_events.result)
      `,
      [
        eventId,
        matchId,
        eventTeamId(event, participants, localTeamIds),
        playerId,
        secondaryPlayerId,
        eventName,
        integerValue(event.minute),
        integerValue(event.extra_minute ?? event.added_time),
        detail || null,
        stringValue(event.result),
      ],
    )
  }
}

async function persistFixtureLineups(fixture, matchId, participants, localTeamIds) {
  const lineups = relationArray(fixture.lineups)

  for (const lineup of lineups) {
    const lineupId = integerValue(lineup.id)
    if (!lineupId || lineupId < 1) {
      console.warn(`Skipping Sportmonks lineup row without a valid ID for fixture ${fixture.id}`)
      continue
    }

    const playerId = await upsertPlayer(lineup.player, lineup.player_id, lineup.player_name)
    if (!playerId) continue

    const participant = relationValue(lineup.participant)
    const team = relationValue(lineup.team)
    const participantId = integerValue(lineup.participant_id ?? participant?.id ?? lineup.team_id ?? team?.id)
    const teamId = participantId === Number(participants.home?.id)
      ? localTeamIds.home
      : participantId === Number(participants.away?.id)
        ? localTeamIds.away
        : null
    const type = lineupType(lineup)
    const rating = numberValue(lineup.rating)

    await pool.query(
      `
        INSERT INTO match_lineups (
          id, match_id, team_id, player_id, lineup_type,
          jersey_number, position_name, rating
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE
        SET match_id = EXCLUDED.match_id,
            team_id = EXCLUDED.team_id,
            player_id = EXCLUDED.player_id,
            lineup_type = EXCLUDED.lineup_type,
            jersey_number = EXCLUDED.jersey_number,
            position_name = EXCLUDED.position_name,
            rating = COALESCE(EXCLUDED.rating, match_lineups.rating)
      `,
      [
        lineupId,
        matchId,
        teamId,
        playerId,
        type,
        integerValue(lineup.jersey_number ?? lineup.number),
        lineupPosition(lineup),
        rating,
      ],
    )
  }
}

export function normalizeFixture(fixture) {
  const participants = getParticipants(fixture)
  const scores = getCurrentScores(fixture)
  const league = relationValue(fixture.league) || {}

  if (!participants.home || !participants.away) {
    throw new Error(`Sportmonks fixture ${fixture.id} is missing home or away participants`)
  }

  return {
    matchId: fixture.id,
    status: normalizedStatus(relationValue(fixture.state)?.short_name),
    matchTime: fixture.starting_at,
    kickoffAt: fixture.starting_at_timestamp
      ? new Date(Number(fixture.starting_at_timestamp) * 1000).toISOString()
      : fixture.starting_at,
    minute: fixtureMinute(fixture),
    homeScore: scores.home ?? null,
    awayScore: scores.away ?? null,
    venueName: venueName(fixture),
    refereeName: refereeName(fixture),
    tvStations: tvStations(fixture) || [],
    statistics: normalizeStatistics(fixture, participants.home.id, participants.away.id) || {},
    formationHome: formationFor(fixture, 'home', participants.home.id),
    formationAway: formationFor(fixture, 'away', participants.away.id),
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
    const leagueData = relationValue(fixture.league)
    const league = trackedLeagues.get(Number(fixture.league_id || leagueData?.id))
    if (!league) continue

    const participants = getParticipants(fixture)
    if (!participants.home || !participants.away) {
      console.warn(`Skipping Sportmonks fixture ${fixture.id}: home or away participant is missing`)
      continue
    }

    const homeTeamId = await upsertTeam(participants.home, league.id)
    const awayTeamId = await upsertTeam(participants.away, league.id)
    const status = normalizedStatus(relationValue(fixture.state)?.short_name)
    const kickoffAt = kickoffDateTime(fixture)
    const matchTime = formatMatchTime(kickoffAt, matchTimeDataType)
    const scores = getCurrentScores(fixture)
    const minute = fixtureMinute(fixture)
    const stations = tvStations(fixture)
    const statistics = normalizeStatistics(
      fixture,
      participants.home.id,
      participants.away.id,
    )
    const { rows } = await pool.query(
      `
        INSERT INTO matches (
          sportmonks_id, league_id, home_team_id, away_team_id,
          status, minute, home_score, away_score, match_time, kickoff_at,
          venue_name, referee_name, tv_stations, statistics,
          formation_home, formation_away
        )
        VALUES (
          $1, $2, $3, $4, COALESCE($5, 'scheduled'), $6, $7, $8, $9, $10,
          $11, $12, COALESCE($13::jsonb, '[]'::jsonb),
          COALESCE($14::jsonb, '{}'::jsonb), $15, $16
        )
        ON CONFLICT (sportmonks_id) DO UPDATE
        SET league_id = EXCLUDED.league_id,
            home_team_id = EXCLUDED.home_team_id,
            away_team_id = EXCLUDED.away_team_id,
            status = COALESCE($5, matches.status),
            minute = CASE
              WHEN $5 IS NULL THEN COALESCE($6, matches.minute)
              ELSE $6
            END,
            home_score = EXCLUDED.home_score,
            away_score = EXCLUDED.away_score,
            match_time = EXCLUDED.match_time,
            kickoff_at = EXCLUDED.kickoff_at,
            venue_name = COALESCE(EXCLUDED.venue_name, matches.venue_name),
            referee_name = COALESCE(EXCLUDED.referee_name, matches.referee_name),
            tv_stations = CASE
              WHEN $13 IS NULL THEN matches.tv_stations
              ELSE EXCLUDED.tv_stations
            END,
            statistics = CASE
              WHEN $14 IS NULL THEN matches.statistics
              ELSE EXCLUDED.statistics
            END,
            formation_home = COALESCE(EXCLUDED.formation_home, matches.formation_home),
            formation_away = COALESCE(EXCLUDED.formation_away, matches.formation_away)
        RETURNING id
      `,
      [
        fixture.id,
        league.id,
        homeTeamId,
        awayTeamId,
        status,
        status === null || status === 'live' ? minute : null,
        scores.home ?? null,
        scores.away ?? null,
        matchTime,
        kickoffAt,
        venueName(fixture),
        refereeName(fixture),
        stations === null ? null : JSON.stringify(stations),
        statistics === null ? null : JSON.stringify(statistics),
        formationFor(fixture, 'home', participants.home.id),
        formationFor(fixture, 'away', participants.away.id),
      ],
    )

    const matchId = Number(rows[0].id)
    const localTeamIds = { home: homeTeamId, away: awayTeamId }
    await persistFixtureEvents(fixture, matchId, participants, localTeamIds)
    await persistFixtureLineups(fixture, matchId, participants, localTeamIds)
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

  const promise = getAllDataWithOptionalIncludes('/livescores/inplay', {
    filters: `fixtureLeagues:${key}`,
    per_page: 50,
  }, fixtureRequiredIncludes, fixtureOptionalIncludes).then((fixtures) => {
    liveCache = { key, fixtures, expiresAt: Date.now() + liveCacheTtlMs }
    return fixtures
  }).finally(() => {
    if (liveCacheRequest?.key === key) liveCacheRequest = null
  })

  liveCacheRequest = { key, promise }
  return promise
}

async function getFixturesForDate(date, leagueIds) {
  return getAllDataWithOptionalIncludes(`/fixtures/date/${date}`, {
    filters: `fixtureLeagues:${leagueIds.join(',')}`,
    per_page: 50,
  }, fixtureRequiredIncludes, fixtureOptionalIncludes)
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
    let playerStatsCount = 0

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
      playerStatsCount += await syncTopScorers(seasonId, localLeagueId)
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
      playerStats: playerStatsCount,
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
