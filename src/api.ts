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

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, { signal })
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

export function getLeagues(signal?: AbortSignal) {
  return getJson<ApiLeague[]>('/api/leagues', signal)
}

export function getMatches(signal?: AbortSignal) {
  return getJson<ApiMatch[]>('/api/matches', signal)
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
