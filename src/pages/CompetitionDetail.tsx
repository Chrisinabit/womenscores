import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Trophy } from 'lucide-react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { getCompetitionForLeague, getLeagueLeaders, getLeagues, getMatches, getStandings, type ApiLeagueLeaders, type ApiMatch } from '../api'
import LeagueTable from '../components/LeagueTable'
import LeagueLeaders from '../components/LeagueLeaders'
import MatchCentreDrawer from '../components/MatchCentreDrawer'
import type { Match } from '../components/LiveMatchCard'
import { competitionDirectory, type StandingRow } from '../data/competitions'
import useDocumentTitle from '../hooks/useDocumentTitle'

type DetailTab = 'standings' | 'fixtures' | 'results' | 'leaders'

const tabs: { id: DetailTab; label: string }[] = [
  { id: 'standings', label: 'Standings' },
  { id: 'fixtures', label: 'Fixtures' },
  { id: 'results', label: 'Results' },
  { id: 'leaders', label: 'Stats / Leaders' },
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

function toMatchCentreMatch(match: ApiMatch): Match {
  const status = match.status.toLowerCase()
  const isLive = status === 'live'
  const isFinished = status === 'finished'
  const isPostponed = status === 'postponed'
  const initials = (name: string, shortName: string | null) => (
    shortName || name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  )

  return {
    matchId: match.matchId,
    league: match.league.name,
    status: isLive ? match.minute === null ? 'LIVE' : `${match.minute}'` : status,
    kickoffAt: match.kickoffAt || match.matchTime,
    home: match.homeTeam.name,
    away: match.awayTeam.name,
    homeInitials: initials(match.homeTeam.name, match.homeTeam.shortName),
    awayInitials: initials(match.awayTeam.name, match.awayTeam.shortName),
    homeScore: isLive || isFinished ? match.homeScore ?? undefined : undefined,
    awayScore: isLive || isFinished ? match.awayScore ?? undefined : undefined,
    isLive,
    isFinished,
    isPostponed,
    homeCrestUrl: match.homeTeam.crestUrl,
    awayCrestUrl: match.awayTeam.crestUrl,
    scorers: match.scorers,
  }
}

function normalizeTeamSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(women|woman|w|fc|afc)\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CompetitionDetail() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTeamFilter = searchParams.get('teamId') || searchParams.get('team')
  const selectedTeamId = selectedTeamFilter && /^\d+$/.test(selectedTeamFilter)
    ? Number(selectedTeamFilter)
    : null
  const selectedTeamSlug = searchParams.get('team')
  const competition = competitionDirectory.find((item) => item.slug === slug)
  const competitionSlug = competition?.slug

  useDocumentTitle(competition?.name ?? 'Competitions')

  const [activeTab, setActiveTab] = useState<DetailTab>(() => selectedTeamFilter ? 'fixtures' : 'standings')
  const [matches, setMatches] = useState<ApiMatch[]>([])
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [leaders, setLeaders] = useState<ApiLeagueLeaders | null>(null)
  const [leadersLoading, setLeadersLoading] = useState(false)
  const [leadersError, setLeadersError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [standingsError, setStandingsError] = useState<string | null>(null)
  const [leagueFound, setLeagueFound] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  useEffect(() => {
    if (selectedTeamFilter) setActiveTab('fixtures')
  }, [selectedTeamFilter])

  useEffect(() => {
    if (!competitionSlug) return

    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    setStandingsError(null)
    setLeadersError(null)
    setLeadersLoading(true)
    setStandings([])
    setLeaders(null)
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

        if (!league || !competitionSlug) {
          setLeagueFound(false)
          setStandingsError('This competition is not currently available from the backend API.')
          setLeadersLoading(false)
          return
        }

        const [standingsResult, leadersResult] = await Promise.allSettled([
          getStandings(league.id, controller.signal),
          getLeagueLeaders(league.id, controller.signal),
        ])
        if (controller.signal.aborted) return

        if (standingsResult.status === 'fulfilled') {
          setStandings(standingsResult.value)
        } else {
          setStandingsError(standingsResult.reason instanceof Error
            ? standingsResult.reason.message
            : 'Unable to load standings')
        }

        if (leadersResult.status === 'fulfilled') {
          setLeaders(leadersResult.value)
        } else {
          setLeadersError(leadersResult.reason instanceof Error
            ? leadersResult.reason.message
            : 'Unable to load league leaders')
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : 'Unable to load competition data')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setLeadersLoading(false)
        }
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
  const selectedTeamMatch = (match: ApiMatch) => selectedTeamId
    ? match.homeTeam.id === selectedTeamId || match.awayTeam.id === selectedTeamId
    : selectedTeamSlug
      ? normalizeTeamSlug(match.homeTeam.name) === selectedTeamSlug
        || normalizeTeamSlug(match.awayTeam.name) === selectedTeamSlug
      : false
  const selectedTeamMatchRecord = selectedTeamFilter ? matches.find(selectedTeamMatch) : undefined
  const selectedTeamName = selectedTeamMatchRecord
    ? selectedTeamId
      ? selectedTeamMatchRecord.homeTeam.id === selectedTeamId
        ? selectedTeamMatchRecord.homeTeam.name
        : selectedTeamMatchRecord.awayTeam.name
      : normalizeTeamSlug(selectedTeamMatchRecord.homeTeam.name) === selectedTeamSlug
        ? selectedTeamMatchRecord.homeTeam.name
        : selectedTeamMatchRecord.awayTeam.name
    : undefined
  const selectedTeam = selectedTeamFilter
    ? { name: selectedTeamName || selectedTeamFilter }
    : undefined
  const filteredSchedule = selectedTeam
    ? schedule.filter(selectedTeamMatch)
    : schedule

  return (
    <>
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
        <div className="flex gap-4 overflow-x-auto border-b border-gray-400/20 sm:gap-6" role="tablist" aria-label="Competition information">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`relative shrink-0 cursor-pointer whitespace-nowrap py-3 text-xs transition-colors ${activeTab === tab.id ? 'text-amber-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-300' : 'text-gray-500 hover:text-white'}`}
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
          ) : activeTab === 'leaders' && !leagueFound ? (
            <p role="status" className="border border-emerald-400/15 bg-[#08281f]/70 px-5 py-10 text-center text-xs text-gray-400">
              {standingsError || 'This competition is not currently available from the backend API.'}
            </p>
          ) : activeTab === 'leaders' ? (
            <LeagueLeaders
              loading={leadersLoading}
              error={leadersError}
              scorers={leaders?.topScorers || []}
              assists={leaders?.topAssists || []}
            />
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
          ) : (
            <section aria-label={scheduleTitle}>
              {selectedTeam && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border border-emerald-400/15 bg-[#08281f]/70 px-3 py-2.5 text-[10px]">
                  <span className="text-gray-300">Showing {scheduleTitle.toLowerCase()} for <strong className="text-amber-200">{selectedTeam.name}</strong></span>
                  <button
                    type="button"
                    className="cursor-pointer text-emerald-300 underline decoration-emerald-300/30 underline-offset-2 hover:text-white"
                    onClick={() => setSearchParams((current) => {
                      const next = new URLSearchParams(current)
                      next.delete('team')
                      next.delete('teamId')
                      return next
                    }, { replace: true })}
                  >
                    Clear team filter
                  </button>
                </div>
              )}
              {filteredSchedule.length > 0 ? (
                <>
                  <div className="mb-3 flex items-center gap-2 text-[10px] text-gray-400">
                    <CalendarDays size={13} className="text-amber-300" />
                    {scheduleTitle} · Live API data
                  </div>
                  <div className="flex flex-col gap-2">
                    {filteredSchedule.map((match, index) => {
                      const scorerEntries = [
                        ...(match.scorers?.home || []).map((scorer) => ({
                          team: match.homeTeam.shortName || match.homeTeam.name,
                          scorer,
                        })),
                        ...(match.scorers?.away || []).map((scorer) => ({
                          team: match.awayTeam.shortName || match.awayTeam.name,
                          scorer,
                        })),
                      ].filter(({ scorer }) => scorer.name)

                      return (
                  <button
                    key={match.matchId}
                    type="button"
                    onClick={() => setSelectedMatch(toMatchCentreMatch(match))}
                    aria-label={`Open match centre: ${match.homeTeam.name} versus ${match.awayTeam.name}`}
                    className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 border border-emerald-400/15 bg-[#08281f]/70 px-4 py-3.5 text-left transition-colors hover:border-emerald-300/30 hover:bg-[#0a3024] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 sm:grid-cols-[120px_1fr_auto_100px] sm:gap-3 sm:py-4"
                  >
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
                    {scorerEntries.length > 0 && (
                      <span className="col-span-2 row-start-3 text-[9px] leading-4 text-gray-400 sm:col-start-2 sm:col-span-2 sm:row-start-2">
                        Scorers: {scorerEntries.map(({ team, scorer }) => (
                          `${team}: ${scorer.name}${scorer.minute !== null ? ` ${scorer.minute}${scorer.addedTime ? `+${scorer.addedTime}` : ''}′` : ''}`
                        )).join(' · ')}
                      </span>
                    )}
                    <span className="sr-only">Fixture {index + 1}</span>
                  </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="border border-emerald-400/15 bg-[#08281f]/70 px-5 py-10 text-center">
                  <CalendarDays size={22} className="mx-auto text-amber-300" />
                  <h2 className="mt-3 text-sm font-medium text-white">
                    {selectedTeam
                      ? `No ${activeTab === 'results' ? 'recent results' : 'upcoming fixtures'} for ${selectedTeam.name}`
                      : activeTab === 'results' ? 'No recent results available' : 'No upcoming fixtures available'}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-400">
                    {selectedTeam
                      ? 'There are no matching matches in the current data window.'
                      : `The backend has no ${activeTab === 'results' ? 'finished matches' : 'scheduled matches'} for this league yet.`}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
    <MatchCentreDrawer match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </>
  )
}
