export type MatchEventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution'

export type MatchPlayer = {
  name: string
  number: number
  position: string
  rating: number | null
}

export type MatchLineup = {
  starting_xi: MatchPlayer[]
  substitutes: MatchPlayer[]
}

export type MatchDetail = {
  match_id: number
  competition: string
  kickoff: string
  status: 'scheduled' | 'live' | 'finished' | 'postponed'
  minute: number | null
  venue: string
  referee: string
  teams: {
    home: { name: string; short_name: string; crest_url: string | null }
    away: { name: string; short_name: string; crest_url: string | null }
  }
  score: { home: number | null; away: number | null }
  tv_stations: { name: string; country: string; logo: string | null }[]
  match_events: {
    id: string
    minute: number
    added_time?: number
    type: MatchEventType
    team: 'home' | 'away'
    player: string
    detail?: string
    secondary_player?: string
  }[]
  match_lineups: {
    home: MatchLineup
    away: MatchLineup
  }
  statistics: {
    possession: { home: number; away: number }
    total_shots: { home: number; away: number }
    shots_on_target: { home: number; away: number }
    corners: { home: number; away: number }
  }
}

const players = {
  home: [
    ['Hannah Hampton', 24, 'GK'], ['Lucy Bronze', 22, 'DF'], ['Millie Bright', 4, 'DF'],
    ['Naomi Girma', 16, 'DF'], ['Sandy Baltimore', 21, 'DF'], ['Erin Cuthbert', 8, 'MF'],
    ['Keira Walsh', 30, 'MF'], ['Guro Reiten', 11, 'MF'], ['Lauren James', 10, 'FW'],
    ['Mayra Ramírez', 7, 'FW'], ['Catarina Macario', 9, 'FW'],
  ],
  away: [
    ['Manuela Zinsberger', 1, 'GK'], ['Katie McCabe', 11, 'DF'], ['Leah Williamson', 6, 'DF'],
    ['Lotte Wubben-Moy', 3, 'DF'], ['Emily Fox', 2, 'DF'], ['Kim Little', 10, 'MF'],
    ['Kim Hall', 12, 'MF'], ['Frida Maanum', 12, 'MF'], ['Beth Mead', 9, 'FW'],
    ['Alessia Russo', 23, 'FW'], ['Caitlin Foord', 19, 'FW'],
  ],
}

function makeLineup(side: 'home' | 'away'): MatchLineup {
  const starters = players[side]
  return {
    starting_xi: starters.map(([name, number, position], index) => ({
      name: String(name),
      number: Number(number),
      position: String(position),
      rating: Number((6.6 + ((index * 7 + (side === 'home' ? 3 : 1)) % 15) / 10).toFixed(1)),
    })),
    substitutes: (side === 'home'
      ? [['Zecira Musovic', 1, 'GK'], ['Ashley Lawrence', 12, 'DF'], ['Wieke Kaptein', 18, 'MF'], ['Aggie Beever-Jones', 33, 'FW']]
      : [['Daphne van Domselaar', 14, 'GK'], ['Steph Catley', 7, 'DF'], ['Lia Wälti', 13, 'MF'], ['Stina Blackstenius', 25, 'FW']]
    ).map(([name, number, position]) => ({
      name: String(name),
      number: Number(number),
      position: String(position),
      rating: null,
    })),
  }
}

export const mockMatchDetail: MatchDetail = {
  match_id: 9001,
  competition: "Barclays Women's Super League",
  kickoff: '2026-11-15T17:00:00Z',
  status: 'live',
  minute: 67,
  venue: 'Kingsmeadow, Kingston upon Thames',
  referee: 'Rebecca Welch',
  teams: {
    home: {
      name: 'Chelsea Women',
      short_name: 'CHE',
      crest_url: 'https://cdn.sportmonks.com/images/soccer/teams/13/45.png',
    },
    away: {
      name: 'Arsenal Women',
      short_name: 'ARS',
      crest_url: 'https://cdn.sportmonks.com/images/soccer/teams/19/41.png',
    },
  },
  score: { home: 2, away: 1 },
  tv_stations: [
    { name: 'Sky Sports', country: 'United Kingdom', logo: null },
    { name: 'ESPN+', country: 'United States', logo: null },
    { name: 'DAZN', country: 'International', logo: null },
  ],
  match_events: [
    { id: 'e1', minute: 12, type: 'goal', team: 'home', player: 'Lauren James', detail: 'Right foot · Assist: Guro Reiten' },
    { id: 'e2', minute: 28, type: 'yellow_card', team: 'away', player: 'Katie McCabe', detail: 'Foul' },
    { id: 'e3', minute: 39, type: 'goal', team: 'away', player: 'Alessia Russo', detail: 'Header · Assist: Beth Mead' },
    { id: 'e4', minute: 55, type: 'substitution', team: 'home', player: 'Aggie Beever-Jones', secondary_player: 'Catarina Macario', detail: 'Substitution' },
    { id: 'e5', minute: 63, type: 'goal', team: 'home', player: 'Mayra Ramírez', detail: 'Left foot · Assist: Erin Cuthbert' },
  ],
  match_lineups: {
    home: makeLineup('home'),
    away: makeLineup('away'),
  },
  statistics: {
    possession: { home: 56, away: 44 },
    total_shots: { home: 14, away: 9 },
    shots_on_target: { home: 7, away: 4 },
    corners: { home: 6, away: 3 },
  },
}
