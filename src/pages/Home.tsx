import { useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import LiveMatchCard, { type Match } from '../components/LiveMatchCard'
import { getCompetitionForLeague, getLeagues, getMatches, type ApiMatch, type ApiLeague } from '../api'
import { competitionDirectory } from '../data/competitions'

function initials(name: string, shortName: string | null) {
  return shortName || name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function formatKickoff(value: string | null) {
  if (!value) return { date: 'DATE TBC', time: 'TBC' }

  const kickoff = new Date(value)
  if (Number.isNaN(kickoff.getTime())) return { date: value, time: 'TBC' }

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const sameDate = (left: Date, right: Date) => left.toDateString() === right.toDateString()
  const date = sameDate(kickoff, today)
    ? 'TODAY'
    : sameDate(kickoff, tomorrow)
      ? 'TOMORROW'
      : new Intl.DateTimeFormat(undefined, { weekday: 'short', day: '2-digit', month: 'short' })
        .format(kickoff)
        .toUpperCase()

  return {
    date,
    time: new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(kickoff),
  }
}

function toMatch(match: ApiMatch): Match {
  const status = match.status.toLowerCase()
  const isLive = status === 'live'
  const isFinished = status === 'finished'
  const isPostponed = status === 'postponed'
  const kickoff = formatKickoff(match.kickoffAt || match.matchTime)

  return {
    league: match.league.name,
    status: isLive
      ? match.minute === null ? 'LIVE' : `${match.minute}'`
      : isPostponed ? 'PP' : kickoff.time,
    home: match.homeTeam.name,
    away: match.awayTeam.name,
    homeInitials: initials(match.homeTeam.name, match.homeTeam.shortName),
    awayInitials: initials(match.awayTeam.name, match.awayTeam.shortName),
    homeScore: isLive ? match.homeScore ?? undefined : undefined,
    awayScore: isLive ? match.awayScore ?? undefined : undefined,
    isLive,
    isFinished,
    isPostponed,
    date: kickoff.date,
    homeCrestUrl: match.homeTeam.crestUrl,
    awayCrestUrl: match.awayTeam.crestUrl,
  }
}

function getLinkedLeagues(leagues: ApiLeague[]) {
  return leagues.flatMap((league) => {
    const competition = getCompetitionForLeague(league, competitionDirectory)
    return competition
      ? [{ name: league.name, region: league.country.toUpperCase(), slug: competition.slug }]
      : []
  })
}

function Hero() {
  return (
    <section className="relative isolate min-h-[410px] overflow-hidden border border-emerald-300/10 bg-[#08281f] sm:min-h-[440px]">
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Marquette_vs._Milwaukee_women%27s_soccer_2023_20_%28in-game_action%29.jpg/1920px-Marquette_vs._Milwaukee_women%27s_soccer_2023_20_%28in-game_action%29.jpg"
        alt="Women's footballers contesting the ball during a match"
        className="absolute inset-0 -z-20 size-full object-cover object-[center_45%]"
        fetchPriority="high"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#061f18_0%,rgba(6,31,24,.96)_31%,rgba(6,31,24,.72)_56%,rgba(6,31,24,.2)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#061f18_0%,transparent_45%)]" />
      <div className="flex min-h-[410px] flex-col justify-center px-6 py-12 sm:min-h-[440px] sm:px-10 lg:px-12">
        <p className="mb-5 text-[10px] font-extrabold tracking-[.22em] text-emerald-300">THE HOME OF WOMEN&apos;S FOOTBALL</p>
        <h1 className="max-w-3xl text-5xl font-medium leading-[.98] tracking-[-.07em] sm:text-7xl lg:text-[82px]">
          Every match.<br />
          <em className="font-serif font-normal not-italic text-amber-300">Every moment.</em>
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-7 text-gray-300">
          Live scores, fixtures and stories from the leagues shaping the women&apos;s game.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-5">
          <a href="#live-matches" className="inline-flex items-center gap-2 bg-amber-300 px-4 py-2.5 text-xs font-semibold text-[#08281f] transition-colors hover:bg-amber-200">
            Explore live scores <ArrowRight size={14} />
          </a>
          <a
            href="https://commons.wikimedia.org/wiki/File:Marquette_vs._Milwaukee_women%27s_soccer_2023_20_(in-game_action).jpg"
            target="_blank"
            rel="noreferrer"
            className="text-[9px] text-gray-400 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
          >
            Photo: Michael Barera / CC BY-SA 4.0
          </a>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live')
  const [matches, setMatches] = useState<Match[]>([])
  const [leagues, setLeagues] = useState<ApiLeague[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    let refreshing = false

    async function refreshData() {
      if (refreshing) return
      refreshing = true

      try {
        const [apiMatches, apiLeagues] = await Promise.all([
          getMatches(controller.signal),
          getLeagues(controller.signal),
        ])
        if (!active) return
        setMatches(apiMatches.map(toMatch))
        setLeagues(apiLeagues)
        setLoadError(null)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load football data')
      } finally {
        refreshing = false
        if (active) setLoading(false)
      }
    }

    void refreshData()
    const intervalId = window.setInterval(() => void refreshData(), 60_000)

    return () => {
      active = false
      window.clearInterval(intervalId)
      controller.abort()
    }
  }, [])

  const liveMatches = matches.filter((match) => match.isLive)
  const upcomingMatches = matches.filter(
    (match) => !match.isLive && !match.isFinished && !match.isPostponed,
  )
  const visibleMatches = activeTab === 'live' ? liveMatches : upcomingMatches
  const linkedLeagues = getLinkedLeagues(leagues)

  return (
    <main className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-[5vw] sm:pt-10 lg:px-0">
      <Hero />

      <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-[1.55fr_.75fr] lg:gap-16">
        <section id="live-matches" aria-labelledby="matches-heading" className="scroll-mt-24">
          <div className="flex items-end justify-between gap-4 border-b border-gray-400/20 pb-4">
            <div>
              <h2 id="matches-heading" className="mb-1 text-xl font-medium tracking-tight">
                {activeTab === 'live' ? 'Live matches' : 'Upcoming fixtures'}
              </h2>
              <p className="text-xs text-gray-400">{activeTab === 'live' ? 'Happening right now' : 'The next big moments'}</p>
            </div>
            <div className="flex shrink-0 gap-4 text-xs sm:gap-5" role="tablist" aria-label="Match schedule">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'live'}
                className={activeTab === 'live' ? 'border-b border-amber-300 pb-1 text-amber-300' : 'text-gray-500 transition-colors hover:text-white'}
                onClick={() => setActiveTab('live')}
              >
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-400" />Live <span className="ml-1 text-gray-400">{loading ? '…' : liveMatches.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'upcoming'}
                className={activeTab === 'upcoming' ? 'border-b border-amber-300 pb-1 text-amber-300' : 'text-gray-500 transition-colors hover:text-white'}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming
              </button>
            </div>
          </div>
          {loadError && (
            <p role="alert" className="mt-4 border border-rose-400/30 bg-rose-400/5 px-4 py-3 text-xs text-rose-200">
              Could not load scores: {loadError}
            </p>
          )}
          {loading ? (
            <p className="mt-4 border border-emerald-400/15 px-4 py-8 text-center text-xs text-gray-400">Loading matches…</p>
          ) : !loadError && visibleMatches.length === 0 ? (
            <p className="mt-4 border border-emerald-400/15 px-4 py-8 text-center text-xs text-gray-400">
              No {activeTab === 'live' ? 'live matches' : 'upcoming fixtures'} are available from the API right now.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2.5">
              {visibleMatches.map((match) => (
                <LiveMatchCard key={`${match.league}-${match.home}-${match.away}`} match={match} />
              ))}
            </div>
          )}
          <button
            type="button"
            className="mt-4 w-full border border-amber-300/35 py-3 text-[11px] text-amber-300 transition-colors hover:bg-emerald-500/10"
            onClick={() => setActiveTab(activeTab === 'live' ? 'upcoming' : 'live')}
          >
            {activeTab === 'live' ? 'View upcoming fixtures' : 'Back to live scores'} <span className="ml-1">→</span>
          </button>
        </section>

        <aside aria-labelledby="leagues-heading">
          <div className="flex items-end justify-between border-b border-gray-400/20 pb-4">
            <div>
              <p className="mb-3 text-[10px] font-extrabold tracking-[.19em] text-emerald-300">EXPLORE</p>
              <h2 id="leagues-heading" className="text-xl font-medium tracking-tight">Top leagues</h2>
            </div>
            <Link to="/competitions" aria-label="Explore all competitions" className="text-amber-300 transition-colors hover:text-amber-200">
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="mt-3 flex flex-col">
            {linkedLeagues.map(({ name, region, slug }, index) => (
              <Link
                key={slug}
                to={`/competitions/${slug}`}
                className="flex items-center gap-3 border-b border-gray-400/10 px-2.5 py-3 text-left text-xs text-gray-400 transition-colors hover:bg-emerald-500/10 hover:text-white"
              >
                <span className="w-4 text-[10px] text-emerald-700">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="hidden items-center gap-1 text-[8px] tracking-wide text-gray-600 sm:inline-flex"><Trophy size={10} />{region}</span>
                <ArrowUpRight size={13} className="shrink-0 text-amber-300" />
              </Link>
            ))}
            {!loading && linkedLeagues.length === 0 && !loadError && (
              <p className="px-2.5 py-4 text-xs text-gray-500">No leagues are available from the API.</p>
            )}
          </div>
          <Link to="/competitions" className="mt-4 inline-flex items-center gap-1 text-[10px] text-emerald-300 transition-colors hover:text-amber-300">
            Browse all competitions <ArrowRight size={12} />
          </Link>
        </aside>
      </div>
    </main>
  )
}
