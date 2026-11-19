import type { Competition, FormResult, StandingRow } from './data/competitions'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000')
  .replace(/\/+$/, '')

export type ApiLeague = {
  id: number
  name: string
  country: string
  logoUrl: string | null
}

export type ApiMatch = {
  matchId: number
  status: string
  matchTime: string | null
  kickoffAt: string | null
  minute: number | null
  homeScore: number | null
  awayScore: number | null
  league: ApiLeague
  homeTeam: {
    id: number
    name: string
    shortName: string | null
    crestUrl: string | null
  }
  awayTeam: {
    id: number
    name: string
    shortName: string | null
    crestUrl: string | null
  }
}

export type ApiMatchEvent = {
  id: number
  minute: number | null
  added_time: number | null
  type: string
  team: 'home' | 'away' | null
  player: string | null
  detail: string | null
  secondary_player: string | null
}

export type ApiMatchPlayer = {
  id: number
  name: string
  number: number | null
  position: string | null
  rating: number | null
}

export type ApiMatchLineup = {
  starting_xi: ApiMatchPlayer[]
  substitutes: ApiMatchPlayer[]
}

export type ApiMatchDetail = {
  match_id: number
  competition: string
  kickoff: string | null
  status: string
  minute: number | null
  venue: string | null
  referee: string | null
  formation_home: string | null
  formation_away: string | null
  teams: {
    home: { id: number; name: string; short_name: string | null; crest_url: string | null }
    away: { id: number; name: string; short_name: string | null; crest_url: string | null }
  }
  score: { home: number | null; away: number | null }
  tv_stations: { name: string; country: string | null; logo: string | null }[]
  statistics: Partial<Record<
    'possession' | 'total_shots' | 'shots_on_target' | 'corners',
    { home: number | null; away: number | null }
  >>
  match_events: ApiMatchEvent[]
  match_lineups: { home: ApiMatchLineup; away: ApiMatchLineup }
  match_polls: { home_votes: number; draw_votes: number; away_votes: number }
}

export type ApiMatchVote = {
  home_votes: number
  draw_votes: number
  away_votes: number
}

export type ApiLeagueLeader = {
  rank: number
  playerId: number
  playerName: string
  teamId: number | null
  teamName: string | null
  teamShortName: string | null
  teamCrestUrl: string | null
  appearances: number
  goals: number
  assists: number
}

export type ApiLeagueLeaders = {
  topScorers: ApiLeagueLeader[]
  topAssists: ApiLeagueLeader[]
}

export type ApiSearchClub = {
  id: number
  name: string
  shortName: string | null
  crestUrl: string | null
  competitionId: number
  competitionName: string
  country: string
}

export type ApiSearchPlayer = {
  id: number
  name: string
  commonName: string | null
  position: string | null
  imageUrl: string | null
  teamId: number | null
  teamName: string | null
  teamShortName: string | null
  teamCrestUrl: string | null
  competitionId: number | null
  competitionName: string | null
}

export type ApiSearchResults = {
  clubs: ApiSearchClub[]
  players: ApiSearchPlayer[]
}

type ApiStanding = {
  rank: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  form: string | null
  teamId: number
  teamName: string
  teamShortName: string | null
  teamCrestUrl: string | null
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new Error(`Could not connect to the womenscores API at ${apiBaseUrl}`)
  }

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`
    try {
      const body = await response.json() as { error?: string; details?: string }
      message = body.details || body.error || message
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return requestJson<T>(path, { signal })
}

export function getLeagues(signal?: AbortSignal) {
  return getJson<ApiLeague[]>('/api/leagues', signal)
}

export function getMatches(signal?: AbortSignal) {
  return getJson<ApiMatch[]>('/api/matches', signal)
}

export function getMatchDetail(matchId: number, signal?: AbortSignal) {
  return getJson<ApiMatchDetail>(`/api/matches/${matchId}`, signal)
}

export function voteForMatch(matchId: number, choice: 'home' | 'draw' | 'away') {
  return requestJson<ApiMatchVote>(`/api/matches/${matchId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ choice }),
  })
}

export function getLeagueLeaders(leagueId: number, signal?: AbortSignal) {
  return getJson<ApiLeagueLeaders>(`/api/leagues/${leagueId}/leaders`, signal)
}

export function searchApi(query: string, signal?: AbortSignal) {
  return getJson<ApiSearchResults>(`/api/search?q=${encodeURIComponent(query)}`, signal)
}

export async function getStandings(leagueId: number, signal?: AbortSignal): Promise<StandingRow[]> {
  const rows = await getJson<ApiStanding[]>(`/api/standings/${leagueId}`, signal)

  return rows.map((row) => ({
    rank: row.rank,
    team: row.teamName,
    crest: row.teamShortName || row.teamName.slice(0, 3).toUpperCase(),
    crestUrl: row.teamCrestUrl,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    points: row.points,
    form: [...(row.form || '')]
      .filter((result): result is FormResult => result === 'W' || result === 'D' || result === 'L')
      .slice(-5),
  }))
}

export function getCompetitionForLeague(
  league: ApiLeague,
  competitions: Competition[],
): Competition | undefined {
  const name = league.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  if (name.includes('community shield') || name.includes('summer cup')) {
    return undefined
  }

  if (name.includes('nwsl')) {
    return competitions.find((competition) => competition.slug === 'nwsl')
  }
  if (
    name.includes('super league')
    && league.country.toLowerCase() === 'england'
    && (name.includes('fa ') || name.includes('barclays') || /\bwsl\b/.test(name))
  ) {
    return competitions.find((competition) => competition.slug === 'wsl')
  }
  if (
    league.country.toLowerCase() === 'italy'
    && name.includes('serie a')
    && (name.includes('women') || name.includes('femminile'))
    && !name.includes('cup')
  ) {
    return competitions.find((competition) => competition.slug === 'serie-a-women')
  }
  if (name.includes('liga f')) {
    return competitions.find((competition) => competition.slug === 'liga-f')
  }
  if (name.includes('frauen bundesliga') || name.includes('bundesliga frauen')) {
    return competitions.find((competition) => competition.slug === 'frauen-bundesliga')
  }
  if (name.includes('champions league') && name.includes('women')) {
    return competitions.find((competition) => competition.slug === 'uwcl')
  }

  return competitions.find((competition) => {
    const competitionName = competition.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
    return competitionName === name
  })
}
