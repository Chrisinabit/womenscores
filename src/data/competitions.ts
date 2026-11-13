export type FormResult = 'W' | 'D' | 'L'

export type StandingRow = {
  rank?: number
  team: string
  crest: string
  crestUrl?: string | null
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference?: number
  points?: number
  form: FormResult[]
}

export type CompetitionFixture = {
  date: string
  home: string
  away: string
  score?: string
  time?: string
  status?: string
}

export type Competition = {
  slug: string
  name: string
  region: string
  country: string
  shortName: string
  qualificationLabel: string
  qualifyingSpots: number
  standings: StandingRow[]
  fixtures: CompetitionFixture[]
  results: CompetitionFixture[]
}

export const competitions: Competition[] = [
  {
    slug: 'wsl',
    name: "Women's Super League",
    region: 'ENGLAND',
    country: 'England',
    shortName: 'WSL',
    qualificationLabel: 'Champions League places',
    qualifyingSpots: 3,
    standings: [
      { team: 'Chelsea', crest: 'CHE', played: 18, won: 15, drawn: 2, lost: 1, goalsFor: 48, goalsAgainst: 12, form: ['W', 'W', 'W', 'D', 'W'] },
      { team: 'Arsenal', crest: 'ARS', played: 18, won: 13, drawn: 3, lost: 2, goalsFor: 42, goalsAgainst: 16, form: ['W', 'W', 'D', 'W', 'W'] },
      { team: 'Manchester City', crest: 'MCI', played: 18, won: 12, drawn: 3, lost: 3, goalsFor: 40, goalsAgainst: 18, form: ['W', 'L', 'W', 'W', 'D'] },
      { team: 'Manchester United', crest: 'MUN', played: 18, won: 10, drawn: 4, lost: 4, goalsFor: 34, goalsAgainst: 21, form: ['D', 'W', 'W', 'L', 'W'] },
      { team: 'Tottenham Hotspur', crest: 'TOT', played: 18, won: 9, drawn: 3, lost: 6, goalsFor: 29, goalsAgainst: 25, form: ['L', 'W', 'D', 'W', 'L'] },
      { team: 'Liverpool', crest: 'LIV', played: 18, won: 7, drawn: 4, lost: 7, goalsFor: 24, goalsAgainst: 27, form: ['W', 'D', 'L', 'W', 'D'] },
      { team: 'Aston Villa', crest: 'AVL', played: 18, won: 6, drawn: 3, lost: 9, goalsFor: 22, goalsAgainst: 31, form: ['L', 'W', 'L', 'D', 'L'] },
      { team: 'Brighton & Hove Albion', crest: 'BHA', played: 18, won: 5, drawn: 4, lost: 9, goalsFor: 20, goalsAgainst: 30, form: ['D', 'L', 'W', 'L', 'D'] },
    ],
    fixtures: [
      { date: 'TODAY', home: 'Chelsea', away: 'Arsenal', time: '18:00', status: 'UPCOMING' },
      { date: 'SAT, 31 OCT', home: 'Manchester City', away: 'Liverpool', time: '14:30', status: 'UPCOMING' },
      { date: 'SUN, 01 NOV', home: 'Tottenham Hotspur', away: 'Manchester United', time: '16:00', status: 'UPCOMING' },
    ],
    results: [
      { date: 'SUN, 25 OCT', home: 'Arsenal', away: 'Liverpool', score: '3 – 1', status: 'FULL TIME' },
      { date: 'SAT, 24 OCT', home: 'Chelsea', away: 'Brighton & Hove Albion', score: '2 – 0', status: 'FULL TIME' },
      { date: 'SUN, 18 OCT', home: 'Manchester United', away: 'Tottenham Hotspur', score: '1 – 1', status: 'FULL TIME' },
    ],
  },
  {
    slug: 'nwsl',
    name: 'National Women’s Soccer League',
    region: 'UNITED STATES',
    country: 'United States',
    shortName: 'NWSL',
    qualificationLabel: 'Playoff positions',
    qualifyingSpots: 4,
    standings: [
      { team: 'Orlando Pride', crest: 'ORL', played: 22, won: 15, drawn: 5, lost: 2, goalsFor: 46, goalsAgainst: 19, form: ['W', 'W', 'D', 'W', 'W'] },
      { team: 'Washington Spirit', crest: 'WAS', played: 22, won: 14, drawn: 3, lost: 5, goalsFor: 43, goalsAgainst: 25, form: ['W', 'L', 'W', 'W', 'D'] },
      { team: 'Gotham FC', crest: 'GFC', played: 22, won: 13, drawn: 4, lost: 5, goalsFor: 35, goalsAgainst: 21, form: ['D', 'W', 'W', 'L', 'W'] },
      { team: 'Kansas City Current', crest: 'KCC', played: 22, won: 12, drawn: 6, lost: 4, goalsFor: 48, goalsAgainst: 30, form: ['W', 'D', 'W', 'D', 'W'] },
      { team: 'Portland Thorns', crest: 'POR', played: 22, won: 10, drawn: 4, lost: 8, goalsFor: 31, goalsAgainst: 29, form: ['L', 'W', 'D', 'W', 'L'] },
      { team: 'North Carolina Courage', crest: 'NCC', played: 22, won: 9, drawn: 5, lost: 8, goalsFor: 29, goalsAgainst: 27, form: ['W', 'L', 'D', 'W', 'D'] },
      { team: 'Bay FC', crest: 'BAY', played: 22, won: 8, drawn: 3, lost: 11, goalsFor: 27, goalsAgainst: 35, form: ['L', 'W', 'L', 'D', 'L'] },
      { team: 'Chicago Red Stars', crest: 'CHI', played: 22, won: 7, drawn: 4, lost: 11, goalsFor: 25, goalsAgainst: 34, form: ['D', 'L', 'W', 'L', 'L'] },
    ],
    fixtures: [
      { date: 'TODAY', home: 'Orlando Pride', away: 'Washington Spirit', time: '19:00', status: 'UPCOMING' },
      { date: 'SAT, 31 OCT', home: 'Gotham FC', away: 'Portland Thorns', time: '17:30', status: 'UPCOMING' },
      { date: 'SUN, 01 NOV', home: 'Bay FC', away: 'Kansas City Current', time: '16:00', status: 'UPCOMING' },
    ],
    results: [
      { date: 'SUN, 25 OCT', home: 'Washington Spirit', away: 'Bay FC', score: '2 – 1', status: 'FULL TIME' },
      { date: 'SAT, 24 OCT', home: 'Orlando Pride', away: 'Chicago Red Stars', score: '3 – 0', status: 'FULL TIME' },
      { date: 'SUN, 18 OCT', home: 'Portland Thorns', away: 'Gotham FC', score: '1 – 2', status: 'FULL TIME' },
    ],
  },
  {
    slug: 'uwcl',
    name: "UEFA Women's Champions League",
    region: 'EUROPE',
    country: 'Europe',
    shortName: 'UWCL',
    qualificationLabel: 'Knockout stage places',
    qualifyingSpots: 4,
    standings: [
      { team: 'Barcelona', crest: 'BAR', played: 4, won: 4, drawn: 0, lost: 0, goalsFor: 15, goalsAgainst: 2, form: ['W', 'W', 'W', 'W', 'W'] },
      { team: 'Lyon', crest: 'LYO', played: 4, won: 3, drawn: 1, lost: 0, goalsFor: 11, goalsAgainst: 3, form: ['W', 'D', 'W', 'W', 'W'] },
      { team: 'Chelsea', crest: 'CHE', played: 4, won: 3, drawn: 0, lost: 1, goalsFor: 10, goalsAgainst: 4, form: ['W', 'L', 'W', 'W', 'D'] },
      { team: 'Bayern Munich', crest: 'FCB', played: 4, won: 2, drawn: 1, lost: 1, goalsFor: 8, goalsAgainst: 5, form: ['D', 'W', 'L', 'W', 'W'] },
      { team: 'Arsenal', crest: 'ARS', played: 4, won: 2, drawn: 0, lost: 2, goalsFor: 7, goalsAgainst: 6, form: ['W', 'L', 'W', 'L', 'D'] },
      { team: 'Real Madrid', crest: 'RMA', played: 4, won: 1, drawn: 1, lost: 2, goalsFor: 5, goalsAgainst: 8, form: ['L', 'D', 'W', 'L', 'D'] },
      { team: 'Juventus', crest: 'JUV', played: 4, won: 1, drawn: 0, lost: 3, goalsFor: 4, goalsAgainst: 10, form: ['L', 'W', 'L', 'L', 'D'] },
      { team: 'Vålerenga', crest: 'VAL', played: 4, won: 0, drawn: 1, lost: 3, goalsFor: 2, goalsAgainst: 12, form: ['L', 'D', 'L', 'L', 'L'] },
    ],
    fixtures: [
      { date: 'TODAY', home: 'Barcelona', away: 'Bayern Munich', time: '18:45', status: 'UPCOMING' },
      { date: 'WED, 04 NOV', home: 'Chelsea', away: 'Lyon', time: '20:00', status: 'UPCOMING' },
      { date: 'THU, 05 NOV', home: 'Arsenal', away: 'Real Madrid', time: '20:00', status: 'UPCOMING' },
    ],
    results: [
      { date: 'THU, 22 OCT', home: 'Lyon', away: 'Arsenal', score: '2 – 1', status: 'FULL TIME' },
      { date: 'WED, 21 OCT', home: 'Barcelona', away: 'Juventus', score: '4 – 0', status: 'FULL TIME' },
      { date: 'WED, 21 OCT', home: 'Bayern Munich', away: 'Vålerenga', score: '3 – 0', status: 'FULL TIME' },
    ],
  },
]

export const competitionDirectory = [
  ...competitions,
  { slug: 'liga-f', name: 'Liga F', region: 'SPAIN', country: 'Spain', shortName: 'LIGA F', qualificationLabel: 'European qualification places', qualifyingSpots: 3, standings: [], fixtures: [], results: [] },
  { slug: 'frauen-bundesliga', name: 'Frauen-Bundesliga', region: 'GERMANY', country: 'Germany', shortName: 'FBL', qualificationLabel: 'European qualification places', qualifyingSpots: 3, standings: [], fixtures: [], results: [] },
  { slug: 'd1-feminine', name: 'Division 1 Féminine', region: 'FRANCE', country: 'France', shortName: 'D1', qualificationLabel: 'European qualification places', qualifyingSpots: 3, standings: [], fixtures: [], results: [] },
  { slug: 'serie-a-women', name: 'Serie A Women', region: 'ITALY', country: 'Italy', shortName: 'SERIE A', qualificationLabel: 'European qualification places', qualifyingSpots: 3, standings: [], fixtures: [], results: [] },
]
