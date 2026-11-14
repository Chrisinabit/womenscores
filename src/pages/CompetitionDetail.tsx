import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Trophy } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getCompetitionForLeague, getLeagues, getMatches, getStandings, type ApiMatch } from '../api'
import LeagueTable from '../components/LeagueTable'
import { competitionDirectory, type StandingRow } from '../data/competitions'

type DetailTab = 'standings' | 'fixtures' | 'results'

const tabs: { id: DetailTab; label: string }[] = [
  { id: 'standings', label: 'Standings' },
  { id: 'fixtures', label: 'Fixtures' },
  { id: 'results', label: 'Results' },
]

function formatFixtureDate(value: string | null) {
  if (!value) return 'Date TBC'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).format(date)
}

function formatFixtureTime(value: string | null) {
  if (!value) return 'TBC'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'TBC'
    : new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date)
}

export default function CompetitionDetail() {
  const { slug } = useParams()
  const competition = competitionDirectory.find((item) => item.slug === slug)
  const competitionSlug = competition?.slug
  const [activeTab, setActiveTab] = useState<DetailTab>('standings')
  const [matches, setMatches] = useState<ApiMatch[]>([])
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [standingsError, setStandingsError] = useState<string | null>(null)
  const [leagueFound, setLeagueFound] = useState(true)

  useEffect(() => {
    if (!competitionSlug) return

    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    setStandingsError(null)
    setStandings([])
    setMatches([])
    setLeagueFound(true)

    async function loadCompetitionData() {
      try {
        const [leagues, apiMatches] = await Promise.all([
          getLeagues(controller.signal),
          getMatches(controller.signal),
        ])
        const league = leagues
          .map((item) => ({ item, competition: getCompetitionForLeague(item, competitionDirectory) }))
          .find((item) => item.competition?.slug === competitionSlug)?.item

        setMatches(apiMatches.filter((match) => match.league.id === league?.id))

        if (!league) {
          setLeagueFound(false)
          setStandingsError('This competition is not currently available from the backend API.')
          return
        }

        try {
          setStandings(await getStandings(league.id, controller.signal))
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return
          setStandingsError(error instanceof Error ? error.message : 'Unable to load standings')
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : 'Unable to load competition data')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadCompetitionData()
    return () => controller.abort()
  }, [competitionSlug])

  if (!competition) return <Navigate to="/competitions" replace />

  const kickoffTime = (match: ApiMatch) => {
    const value = match.kickoffAt || match.matchTime
    const time = value ? new Date(value).getTime() : Number.NaN
    return Number.isNaN(time) ? 0 : time
  }

  const upcoming = matches
    .filter((match) => {
      const status = match.status.toLowerCase()
      return status === 'scheduled' || status === 'postponed'
    })
    .sort((left, right) => kickoffTime(left) - kickoffTime(right))
  const results = matches
    .filter((match) => match.status.toLowerCase() === 'finished')
    .sort((left, right) => kickoffTime(right) - kickoffTime(left))

  const schedule = activeTab === 'results' ? results : upcoming
  const scheduleTitle = activeTab === 'fixtures' ? 'Upcoming fixtures' : 'Recent results'

  return (
    <main className="mx-auto min-h-[calc(100vh-150px)] max-w-6xl px-5 pb-16 pt-8 sm:px-[5vw] sm:pt-12 lg:px-0">
      <Link to="/competitions" className="mb-6 inline-flex items-center gap-2 text-[10px] text-gray-400 transition-colors hover:text-amber-300">
        <ArrowLeft size={13} /> All competitions
      </Link>

      <section className="flex flex-col justify-between gap-6 border border-emerald-400/15 bg-[#08281f]/75 p-5 sm:flex-row sm:items-center sm:p-7">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center border border-amber-300/40 bg-amber-300/5 text-amber-300 sm:size-16">
            <Trophy size={26} strokeWidth={1.5} />
          </span>
          <div>
            <p className="mb-2 text-[9px] font-bold tracking-[.18em] text-emerald-300">{competition.region} · {competition.country}</p>
            <h1 className="text-2xl font-medium leading-tight tracking-tight sm:text-4xl">{competition.name}</h1>
            <p className="mt-2 text-[10px] text-gray-500">Season overview · Live API data</p>
          </div>
        </div>
        <span className="self-start border border-amber-300/30 px-3 py-1.5 text-[9px] font-semibold tracking-[.14em] text-amber-200 sm:self-center">
          {competition.shortName}
        </span>
      </section>

      <section className="mt-8" aria-label={`${competition.name} ${activeTab}`}>
        <div className="flex gap-6 border-b border-gray-400/20" role="tablist" aria-label="Competition information">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`relative py-3 text-xs transition-colors ${activeTab === tab.id ? 'text-amber-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-300' : 'text-gray-500 hover:text-white'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-5" role="tabpanel">
          {loadError ? (
            <p role="alert" className="border border-rose-400/30 bg-rose-400/5 px-4 py-3 text-xs text-rose-200">
              Could not load competition data: {loadError}
            </p>
          ) : loading ? (
            <p className="border border-emerald-400/15 px-4 py-8 text-center text-xs text-gray-400">Loading competition data…</p>
          ) : activeTab === 'standings' && standingsError ? (
            <p role={leagueFound ? 'alert' : 'status'} className="border border-emerald-400/15 bg-[#08281f]/70 px-5 py-10 text-center text-xs text-gray-400">
              {standingsError}
            </p>
          ) : activeTab === 'standings' && standings.length > 0 ? (
            <LeagueTable
              standings={standings}
              qualifyingSpots={competition.qualifyingSpots}
              qualificationLabel={competition.qualificationLabel}
            />
          ) : activeTab === 'standings' ? (
            <div className="border border-emerald-400/15 bg-[#08281f]/70 px-5 py-10 text-center">
              <Trophy size={22} className="mx-auto text-amber-300" />
              <h2 className="mt-3 text-sm font-medium text-white">No standings available</h2>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-400">
                The backend has no standings data for this league yet.
              </p>
            </div>
          ) : schedule.length > 0 ? (
            <section aria-label={scheduleTitle}>
              <div className="mb-3 flex items-center gap-2 text-[10px] text-gray-400">
                <CalendarDays size={13} className="text-amber-300" />
                {scheduleTitle} · Live API data
              </div>
              <div className="flex flex-col gap-2">
                {schedule.map((match, index) => (
                  <article key={match.matchId} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 border border-emerald-400/15 bg-[#08281f]/70 px-4 py-3.5 sm:grid-cols-[120px_1fr_auto_100px] sm:gap-3 sm:py-4">
                    <span className="col-start-1 row-start-1 text-[9px] font-medium tracking-wide text-gray-500">
                      {formatFixtureDate(match.kickoffAt || match.matchTime)}
                    </span>
                    <div className="col-span-2 row-start-2 flex min-w-0 items-center gap-2 text-xs font-medium text-white sm:col-span-1 sm:col-start-2 sm:row-start-1">
                      <span className="min-w-0 truncate">{match.homeTeam.name}</span>
                      <span className="shrink-0 text-gray-600">vs</span>
                      <span className="min-w-0 truncate">{match.awayTeam.name}</span>
                    </div>
                    <strong className="col-start-2 row-start-1 text-right text-xs tabular-nums text-white sm:col-start-3 sm:row-start-1">
                      {match.status.toLowerCase() === 'live' || match.status.toLowerCase() === 'finished'
                        ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}`
                        : match.status.toLowerCase() === 'postponed'
                          ? '—'
                          : formatFixtureTime(match.kickoffAt || match.matchTime)}
                    </strong>
                    <span className="hidden text-right text-[9px] text-gray-500 sm:col-start-4 sm:row-start-1 sm:block">
                      {match.status.toLowerCase() === 'live'
                        ? match.minute === null ? 'LIVE' : `LIVE · ${match.minute}'`
                        : match.status.toUpperCase()}
                    </span>
                    <span className="sr-only">Fixture {index + 1}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : activeTab === 'results' ? (
            <div className="border border-emerald-400/15 bg-[#08281f]/70 px-5 py-10 text-center">
              <CalendarDays size={22} className="mx-auto text-amber-300" />
              <h2 className="mt-3 text-sm font-medium text-white">No recent results available</h2>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-400">
                The backend has no finished matches for this league in the recent window.
              </p>
            </div>
          ) : (
            <div className="border border-emerald-400/15 bg-[#08281f]/70 px-5 py-10 text-center">
              <CalendarDays size={22} className="mx-auto text-amber-300" />
              <h2 className="mt-3 text-sm font-medium text-white">No upcoming fixtures available</h2>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-400">
                The backend has no scheduled matches for this league yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
