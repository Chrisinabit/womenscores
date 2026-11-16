export type LeagueLeader = {
  rank: number
  playerId: number
  playerName: string
  teamId: number
  teamName: string
  teamShortName: string
  teamCrestUrl: string | null
  appearances: number
  goals: number
  assists: number
}

export type LeagueLeadersResponse = {
  leagueId: number
  topScorers: LeagueLeader[]
  topAssists: LeagueLeader[]
}

type LeaderSeed = [string, number, string, string, number, number, number]
type CompetitionLeaders = Omit<LeagueLeadersResponse, 'leagueId'>

function makeLeaders(rows: LeaderSeed[]): LeagueLeader[] {
  return rows.map(([playerName, teamId, teamName, teamShortName, appearances, goals, assists], index) => ({
    rank: index + 1,
    playerId: index + 1,
    playerName,
    teamId,
    teamName,
    teamShortName,
    teamCrestUrl: null,
    appearances,
    goals,
    assists,
  }))
}

const competitionLeaders: Record<string, CompetitionLeaders> = {
  wsl: {
    topScorers: makeLeaders([
      ['Lauren James', 1, 'Chelsea Women', 'CHE', 10, 9, 4],
      ['Alessia Russo', 2, 'Arsenal Women', 'ARS', 11, 8, 3],
      ['Khadija Shaw', 3, 'Manchester City Women', 'MCI', 9, 7, 2],
      ['Guro Reiten', 1, 'Chelsea Women', 'CHE', 10, 6, 6],
      ['Beth Mead', 2, 'Arsenal Women', 'ARS', 10, 5, 5],
    ]),
    topAssists: makeLeaders([
      ['Guro Reiten', 1, 'Chelsea Women', 'CHE', 10, 6, 6],
      ['Beth Mead', 2, 'Arsenal Women', 'ARS', 10, 5, 5],
      ['Lauren James', 1, 'Chelsea Women', 'CHE', 10, 9, 4],
      ['Katie McCabe', 2, 'Arsenal Women', 'ARS', 11, 2, 4],
      ['Caitlin Foord', 2, 'Arsenal Women', 'ARS', 9, 3, 3],
    ]),
  },
  nwsl: {
    topScorers: makeLeaders([
      ['Sophia Smith', 11, 'Portland Thorns', 'POR', 12, 10, 3],
      ['Barbra Banda', 12, 'Orlando Pride', 'ORL', 11, 9, 2],
      ['Temwa Chawinga', 13, 'Kansas City Current', 'KCC', 12, 8, 4],
    ]),
    topAssists: makeLeaders([
      ['Marta', 12, 'Orlando Pride', 'ORL', 10, 4, 6],
      ['Debinha', 13, 'Kansas City Current', 'KCC', 11, 5, 5],
      ['Trinity Rodman', 14, 'Washington Spirit', 'WAS', 12, 6, 4],
    ]),
  },
  uwcl: {
    topScorers: makeLeaders([
      ['Caroline Graham Hansen', 21, 'Barcelona', 'BAR', 8, 7, 4],
      ['Ada Hegerberg', 22, 'Lyon', 'LYO', 7, 6, 1],
      ['Ewa Pajor', 21, 'Barcelona', 'BAR', 8, 5, 3],
    ]),
    topAssists: makeLeaders([
      ['Caroline Graham Hansen', 21, 'Barcelona', 'BAR', 8, 7, 4],
      ['Aitana Bonmatí', 21, 'Barcelona', 'BAR', 8, 3, 4],
      ['Kadidiatou Diani', 22, 'Lyon', 'LYO', 7, 4, 3],
    ]),
  },
  'liga-f': {
    topScorers: makeLeaders([
      ['Caroline Weir', 31, 'Real Madrid', 'RMA', 10, 8, 3],
      ['Clàudia Pina', 32, 'Barcelona', 'BAR', 9, 7, 2],
      ['Edna Imade', 33, 'Granada', 'GRA', 11, 6, 1],
    ]),
    topAssists: makeLeaders([
      ['Alexia Putellas', 32, 'Barcelona', 'BAR', 9, 3, 6],
      ['Caroline Weir', 31, 'Real Madrid', 'RMA', 10, 8, 4],
      ['Athenea del Castillo', 31, 'Real Madrid', 'RMA', 11, 2, 4],
    ]),
  },
  'frauen-bundesliga': {
    topScorers: makeLeaders([
      ['Pernille Harder', 41, 'Bayern Munich', 'FCB', 9, 8, 3],
      ['Alexandra Popp', 42, 'Wolfsburg', 'WOB', 10, 7, 2],
      ['Jule Brand', 42, 'Wolfsburg', 'WOB', 10, 6, 4],
    ]),
    topAssists: makeLeaders([
      ['Jule Brand', 42, 'Wolfsburg', 'WOB', 10, 6, 5],
      ['Linda Dallmann', 41, 'Bayern Munich', 'FCB', 9, 3, 4],
      ['Svenja Huth', 42, 'Wolfsburg', 'WOB', 10, 2, 4],
    ]),
  },
  'd1-feminine': {
    topScorers: makeLeaders([
      ['Marie-Antoinette Katoto', 51, 'Paris Saint-Germain', 'PSG', 9, 8, 2],
      ['Kadidiatou Diani', 52, 'Lyon', 'LYO', 10, 7, 4],
      ['Melchie Dumornay', 52, 'Lyon', 'LYO', 9, 6, 3],
    ]),
    topAssists: makeLeaders([
      ['Kadidiatou Diani', 52, 'Lyon', 'LYO', 10, 7, 5],
      ['Sakina Karchaoui', 51, 'Paris Saint-Germain', 'PSG', 9, 1, 4],
      ['Tabitha Chawinga', 52, 'Lyon', 'LYO', 10, 5, 4],
    ]),
  },
  'serie-a-women': {
    topScorers: makeLeaders([
      ['Cristiana Girelli', 61, 'Juventus', 'JUV', 9, 8, 2],
      ['Valentina Giacinti', 62, 'Roma', 'ROM', 10, 7, 3],
      ['Evelyn Viens', 62, 'Roma', 'ROM', 10, 6, 2],
    ]),
    topAssists: makeLeaders([
      ['Manuela Giugliano', 62, 'Roma', 'ROM', 10, 3, 5],
      ['Barbara Bonansea', 61, 'Juventus', 'JUV', 9, 4, 4],
      ['Sofia Cantore', 61, 'Juventus', 'JUV', 10, 5, 3],
    ]),
  },
}

export function getMockLeagueLeaders(leagueId: number, competitionSlug: string): LeagueLeadersResponse {
  const leaders = competitionLeaders[competitionSlug] || { topScorers: [], topAssists: [] }

  return {
    leagueId,
    topScorers: leaders.topScorers,
    topAssists: leaders.topAssists,
  }
}
