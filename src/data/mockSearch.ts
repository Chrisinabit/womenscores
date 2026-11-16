export type MockClubSearchResult = {
  id: number
  name: string
  slug: string
  shortName: string
  country: string
  competitionName: string
  competitionSlug: string
  crestUrl: string | null
}

export type MockPlayerSearchResult = {
  id: number
  name: string
  position: string
  clubName: string
  clubSlug: string
  clubShortName: string
  competitionName: string
  competitionSlug: string
  crestUrl: string | null
}

export type MockSearchResponse = {
  query: string
  clubs: MockClubSearchResult[]
  players: MockPlayerSearchResult[]
}

export const mockSearchClubs: MockClubSearchResult[] = [
  { id: 1, name: 'Chelsea Women', slug: 'chelsea', shortName: 'CHE', country: 'England', competitionName: "Women's Super League", competitionSlug: 'wsl', crestUrl: null },
  { id: 2, name: 'Arsenal Women', slug: 'arsenal', shortName: 'ARS', country: 'England', competitionName: "Women's Super League", competitionSlug: 'wsl', crestUrl: null },
  { id: 3, name: 'Manchester City Women', slug: 'manchester-city', shortName: 'MCI', country: 'England', competitionName: "Women's Super League", competitionSlug: 'wsl', crestUrl: null },
  { id: 4, name: 'Manchester United Women', slug: 'manchester-united', shortName: 'MUN', country: 'England', competitionName: "Women's Super League", competitionSlug: 'wsl', crestUrl: null },
  { id: 5, name: 'Tottenham Hotspur Women', slug: 'tottenham-hotspur', shortName: 'TOT', country: 'England', competitionName: "Women's Super League", competitionSlug: 'wsl', crestUrl: null },
  { id: 6, name: 'Liverpool Women', slug: 'liverpool', shortName: 'LIV', country: 'England', competitionName: "Women's Super League", competitionSlug: 'wsl', crestUrl: null },
  { id: 11, name: 'Portland Thorns', slug: 'portland-thorns', shortName: 'POR', country: 'United States', competitionName: 'National Women’s Soccer League', competitionSlug: 'nwsl', crestUrl: null },
  { id: 12, name: 'Orlando Pride', slug: 'orlando-pride', shortName: 'ORL', country: 'United States', competitionName: 'National Women’s Soccer League', competitionSlug: 'nwsl', crestUrl: null },
  { id: 13, name: 'Kansas City Current', slug: 'kansas-city-current', shortName: 'KCC', country: 'United States', competitionName: 'National Women’s Soccer League', competitionSlug: 'nwsl', crestUrl: null },
  { id: 21, name: 'Barcelona', slug: 'barcelona', shortName: 'BAR', country: 'Spain', competitionName: "UEFA Women's Champions League", competitionSlug: 'uwcl', crestUrl: null },
  { id: 22, name: 'Lyon', slug: 'lyon', shortName: 'LYO', country: 'France', competitionName: "UEFA Women's Champions League", competitionSlug: 'uwcl', crestUrl: null },
  { id: 23, name: 'Bayern Munich', slug: 'bayern-munich', shortName: 'FCB', country: 'Germany', competitionName: "UEFA Women's Champions League", competitionSlug: 'uwcl', crestUrl: null },
]

export const mockSearchPlayers: MockPlayerSearchResult[] = [
  { id: 101, name: 'Lauren James', position: 'Forward', clubName: 'Chelsea Women', clubSlug: 'chelsea', clubShortName: 'CHE', competitionName: "Women's Super League", competitionSlug: 'wsl', crestUrl: null },
  { id: 102, name: 'Alessia Russo', position: 'Forward', clubName: 'Arsenal Women', clubSlug: 'arsenal', clubShortName: 'ARS', competitionName: "Women's Super League", competitionSlug: 'wsl', crestUrl: null },
  { id: 103, name: 'Khadija Shaw', position: 'Forward', clubName: 'Manchester City Women', clubSlug: 'manchester-city', clubShortName: 'MCI', competitionName: "Women's Super League", competitionSlug: 'wsl', crestUrl: null },
  { id: 104, name: 'Guro Reiten', position: 'Midfielder', clubName: 'Chelsea Women', clubSlug: 'chelsea', clubShortName: 'CHE', competitionName: "Women's Super League", competitionSlug: 'wsl', crestUrl: null },
  { id: 105, name: 'Beth Mead', position: 'Forward', clubName: 'Arsenal Women', clubSlug: 'arsenal', clubShortName: 'ARS', competitionName: "Women's Super League", competitionSlug: 'wsl', crestUrl: null },
  { id: 111, name: 'Sophia Smith', position: 'Forward', clubName: 'Portland Thorns', clubSlug: 'portland-thorns', clubShortName: 'POR', competitionName: 'National Women’s Soccer League', competitionSlug: 'nwsl', crestUrl: null },
  { id: 112, name: 'Barbra Banda', position: 'Forward', clubName: 'Orlando Pride', clubSlug: 'orlando-pride', clubShortName: 'ORL', competitionName: 'National Women’s Soccer League', competitionSlug: 'nwsl', crestUrl: null },
  { id: 121, name: 'Caroline Graham Hansen', position: 'Forward', clubName: 'Barcelona', clubSlug: 'barcelona', clubShortName: 'BAR', competitionName: "UEFA Women's Champions League", competitionSlug: 'uwcl', crestUrl: null },
  { id: 122, name: 'Ada Hegerberg', position: 'Forward', clubName: 'Lyon', clubSlug: 'lyon', clubShortName: 'LYO', competitionName: "UEFA Women's Champions League", competitionSlug: 'uwcl', crestUrl: null },
  { id: 123, name: 'Pernille Harder', position: 'Forward', clubName: 'Bayern Munich', clubSlug: 'bayern-munich', clubShortName: 'FCB', competitionName: "UEFA Women's Champions League", competitionSlug: 'uwcl', crestUrl: null },
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function searchMockData(query: string): MockSearchResponse {
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) {
    return { query, clubs: [], players: [] }
  }

  return {
    query,
    clubs: mockSearchClubs
      .filter((club) => normalize(`${club.name} ${club.country} ${club.competitionName}`).includes(normalizedQuery))
      .slice(0, 5),
    players: mockSearchPlayers
      .filter((player) => normalize(`${player.name} ${player.clubName} ${player.position}`).includes(normalizedQuery))
      .slice(0, 5),
  }
}

export function getMockClubBySlug(slug: string) {
  return mockSearchClubs.find((club) => club.slug === slug)
}
