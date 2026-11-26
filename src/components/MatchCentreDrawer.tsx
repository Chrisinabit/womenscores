import { useEffect, useRef, useState } from 'react'
import { ArrowLeftRight, BarChart3, CalendarDays, Clock3, Goal, MapPin, Radio, ShieldAlert, Tv, UserRound, X } from 'lucide-react'
import type { Match } from './LiveMatchCard'
import { getMatchDetail, voteForMatch, type ApiMatchDetail, type ApiMatchEvent, type ApiMatchLineup, type ApiMatchPlayer } from '../api'

type DrawerTab = 'summary' | 'lineups' | 'stats'
type PollChoice = 'home' | 'draw' | 'away'
type MatchDetail = ApiMatchDetail
type MatchLineup = ApiMatchLineup
type MatchPlayer = ApiMatchPlayer
type MatchEventType = ApiMatchEvent['type']

const drawerTabs: { id: DrawerTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'lineups', label: 'Lineups' },
  { id: 'stats', label: 'Stats' },
]

const pollChoices: { id: PollChoice; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'draw', label: 'Draw' },
  { id: 'away', label: 'Away' },
]

const eventIcons: Record<string, typeof Goal> = {
  goal: Goal,
  own_goal: Goal,
  penalty: Goal,
  missed_penalty: ShieldAlert,
  yellow_card: ShieldAlert,
  red_card: ShieldAlert,
  yellow_red_card: ShieldAlert,
  substitution: ArrowLeftRight,
}

function formattedKickoff(value: string | null) {
  if (!value) return 'Kickoff time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatStatus(detail: MatchDetail) {
  if (detail.status === 'live') return detail.minute === null ? 'LIVE' : `LIVE · ${detail.minute}'`
  if (detail.status === 'finished') return 'FULL TIME'
  if (detail.status === 'postponed') return 'POSTPONED'
  return 'UPCOMING'
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function TeamBadge({ name, shortName, crestUrl }: { name: string; shortName: string | null; crestUrl: string | null }) {
  return (
    <span className="relative grid size-11 shrink-0 place-items-center rounded-full border border-emerald-100/15 bg-emerald-950/60 p-2 sm:size-14">
      <span className="text-sm font-bold text-amber-300">{shortName || initials(name)}</span>
      {crestUrl && <img src={crestUrl} alt="" className="absolute inset-2 size-[calc(100%-1rem)] object-contain" onError={(event) => { event.currentTarget.style.display = 'none' }} />}
    </span>
  )
}

function TeamScorers({ events, team }: { events: ApiMatchEvent[]; team: 'home' | 'away' }) {
  const scorers = events.filter((event) => {
    if (!event.player || !['goal', 'penalty', 'own_goal'].includes(event.type) || !event.team) return false
    const creditedTeam = event.type === 'own_goal'
      ? event.team === 'home' ? 'away' : 'home'
      : event.team
    return creditedTeam === team
  })

  if (scorers.length === 0) return null

  return (
    <span className="mt-1 flex w-full max-w-[38vw] flex-col text-[9px] leading-4 text-amber-100/70 sm:max-w-[170px]">
      {scorers.map((event) => (
        <span key={event.id} className="truncate">
          {event.player}
          {event.minute !== null ? ` ${event.minute}${event.added_time ? `+${event.added_time}` : ''}′` : ''}
          {event.type === 'own_goal' ? ' (OG)' : ''}
        </span>
      ))}
    </span>
  )
}

function FanPoll({
  matchId,
  homeName,
  awayName,
  initialVotes,
}: {
  matchId: number
  homeName: string
  awayName: string
  initialVotes: MatchDetail['match_polls']
}) {
  const [vote, setVote] = useState<PollChoice | null>(null)
  const [votes, setVotes] = useState({
    home: initialVotes.home_votes,
    draw: initialVotes.draw_votes,
    away: initialVotes.away_votes,
  })
  const [submitting, setSubmitting] = useState(false)
  const [voteError, setVoteError] = useState<string | null>(null)

  useEffect(() => {
    setVotes({
      home: initialVotes.home_votes,
      draw: initialVotes.draw_votes,
      away: initialVotes.away_votes,
    })
    setVote(null)
    setVoteError(null)
  }, [matchId, initialVotes])

  const totalVotes = votes.home + votes.draw + votes.away
  const percentages = {
    home: totalVotes > 0 ? Math.round(votes.home / totalVotes * 100) : 0,
    draw: totalVotes > 0 ? Math.round(votes.draw / totalVotes * 100) : 0,
    away: totalVotes > 0 ? Math.round(votes.away / totalVotes * 100) : 0,
  }
  const labels = { home: homeName, draw: 'Draw', away: awayName }

  async function castVote(choice: PollChoice) {
    if (vote || submitting) return
    setSubmitting(true)
    setVoteError(null)
    try {
      const updatedVotes = await voteForMatch(matchId, choice)
      setVotes({
        home: updatedVotes.home_votes,
        draw: updatedVotes.draw_votes,
        away: updatedVotes.away_votes,
      })
      setVote(choice)
    } catch (error) {
      setVoteError(error instanceof Error ? error.message : 'Your vote could not be saved.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-xl border border-emerald-100/10 bg-[#0b3025] p-4 sm:p-5" aria-labelledby="fan-poll-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 id="fan-poll-title" className="text-sm font-semibold text-white">Who wins?</h3>
          <p className="mt-1 text-[10px] text-emerald-100/50">Fan poll · live votes</p>
        </div>
        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] tabular-nums text-emerald-200/75">{totalVotes.toLocaleString()} votes</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {pollChoices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => castVote(choice.id)}
            disabled={vote !== null || submitting}
            aria-pressed={vote === choice.id}
            className={`min-h-10 cursor-pointer rounded-lg border px-2 text-xs font-medium transition-colors disabled:cursor-default disabled:opacity-60 ${vote === choice.id ? 'border-amber-300 bg-amber-300 text-[#08281f]' : 'border-emerald-100/10 bg-emerald-950/35 text-emerald-50/75 hover:border-amber-300/50 hover:text-white'}`}
          >
            {submitting && vote === null ? 'Saving…' : choice.label}
          </button>
        ))}
      </div>
      {voteError && <p role="alert" className="mt-3 text-[10px] text-rose-300">{voteError}</p>}

      <div className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ${vote ? 'mt-4 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'}`} aria-live="polite">
        <div className="overflow-hidden">
          {pollChoices.map((choice) => (
            <div key={choice.id} className="mb-3 last:mb-0">
              <div className="mb-1.5 flex justify-between gap-3 text-[10px]">
                <span className={vote === choice.id ? 'text-amber-200' : 'text-emerald-50/65'}>{labels[choice.id]}</span>
                <span className="tabular-nums text-white">{percentages[choice.id]}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-emerald-950">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${vote === choice.id ? 'bg-amber-300' : 'bg-emerald-400/70'}`}
                  style={{ width: vote ? `${percentages[choice.id]}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EventTimeline({ detail }: { detail: MatchDetail }) {
  if (detail.match_events.length === 0) {
    return <p className="rounded-lg border border-emerald-100/10 p-5 text-center text-xs text-emerald-50/50">No match events to show yet.</p>
  }

  return (
    <ol className="relative ml-3 border-l border-emerald-100/10">
      {detail.match_events.map((event) => {
        const Icon = eventIcons[event.type] || ShieldAlert
        const teamName = event.team ? detail.teams[event.team].name : 'Team unavailable'
        const eventColor = ['goal', 'own_goal', 'penalty'].includes(event.type)
          ? 'text-amber-300'
          : ['red_card', 'yellow_red_card'].includes(event.type)
            ? 'text-rose-400'
            : event.type === 'yellow_card'
              ? 'text-yellow-300'
              : 'text-emerald-200'

        return (
          <li key={event.id} className="relative pb-5 pl-6 last:pb-0">
            <span className="absolute -left-[17px] top-0.5 grid size-8 place-items-center rounded-full border border-emerald-100/10 bg-[#0a2b21]">
              <Icon size={14} className={eventColor} />
            </span>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">{event.player || event.type.replace(/_/g, ' ')}</p>
                <p className="mt-1 text-[10px] leading-5 text-emerald-50/55">
                  {event.type === 'substitution' && event.secondary_player
                    ? `${event.secondary_player} off · ${event.player} on`
                    : event.detail || event.type.replace('_', ' ')}
                </p>
                <p className="mt-1 text-[9px] text-emerald-50/35">{teamName}</p>
              </div>
              <span className="shrink-0 rounded bg-emerald-950/70 px-2 py-1 text-[10px] font-semibold tabular-nums text-amber-200">
                {event.minute ?? '—'}{event.added_time ? `+${event.added_time}` : ''}&apos;
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function PlayerList({ title, players, substitutes = false }: { title: string; players: MatchPlayer[]; substitutes?: boolean }) {
  return (
    <section>
      <h4 className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.13em] text-emerald-100/55">
        {title}<span className="font-medium tracking-normal text-emerald-100/35">{players.length}</span>
      </h4>
      <ul className="divide-y divide-emerald-100/[.07] rounded-lg border border-emerald-100/[.08] bg-emerald-950/25 px-3">
        {players.map((player) => (
          <li key={`${player.number}-${player.name}`} className="flex min-w-0 items-center gap-2.5 py-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-100/[.06] text-[10px] font-bold tabular-nums text-amber-200">
              {player.number ?? '—'}
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-emerald-50/85">{player.name || 'Player unavailable'}</span>
            <span className="shrink-0 text-[9px] text-emerald-100/40">{player.position || '—'}</span>
            {player.rating !== null && !substitutes && (
              <span className={`ml-1 min-w-8 rounded px-1.5 py-1 text-center text-[9px] font-bold tabular-nums ${player.rating >= 7.5 ? 'bg-emerald-300/15 text-emerald-200' : 'bg-emerald-100/[.06] text-emerald-50/60'}`}>
                {player.rating.toFixed(1)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function TeamLineup({ name, formation, lineup }: { name: string; formation: string | null; lineup: MatchLineup }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-4 truncate text-sm font-semibold text-white">{name}</h3>
      <p className="mb-4 text-[10px] text-emerald-100/45">
        Formation: <span className="text-emerald-50/75">{formation || 'Unavailable'}</span>
      </p>
      <div className="space-y-5">
        <PlayerList title="Starting XI" players={lineup.starting_xi} />
        <PlayerList title="Substitutes" players={lineup.substitutes} substitutes />
      </div>
    </section>
  )
}

function MatchStats({ detail }: { detail: MatchDetail }) {
  const statRows: { id: keyof MatchDetail['statistics']; label: string; suffix?: string }[] = [
    { id: 'possession', label: 'Possession', suffix: '%' },
    { id: 'total_shots', label: 'Total shots' },
    { id: 'shots_on_target', label: 'Shots on target' },
    { id: 'corners', label: 'Corners' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-emerald-100/10 bg-[#0b3025] p-4 text-center">
        <span className="truncate text-[10px] font-semibold text-emerald-50/75">{detail.teams.home.short_name || initials(detail.teams.home.name)}</span>
        <span className="text-[9px] uppercase tracking-[.16em] text-emerald-100/35">Match stats</span>
        <span className="truncate text-[10px] font-semibold text-emerald-50/75">{detail.teams.away.short_name || initials(detail.teams.away.name)}</span>
      </div>
      {statRows.map(({ id, label, suffix }) => {
        const stat = detail.statistics[id]
        const home = stat?.home
        const away = stat?.away
        const total = (home ?? 0) + (away ?? 0)
        const homeShare = total > 0 ? (home ?? 0) / total * 100 : 50

        return (
          <section key={id} aria-label={label}>
            <div className="mb-2 flex items-center justify-between text-[10px]">
              <span className="min-w-10 font-semibold tabular-nums text-white">{home ?? '—'}{home !== null && home !== undefined ? suffix : ''}</span>
              <h3 className="text-emerald-50/55">{label}</h3>
              <span className="min-w-10 text-right font-semibold tabular-nums text-white">{away ?? '—'}{away !== null && away !== undefined ? suffix : ''}</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-emerald-950">
              <div className="h-full bg-amber-300 transition-[width] duration-700" style={{ width: home === null || home === undefined || away === null || away === undefined ? '50%' : `${homeShare}%` }} />
              <div className="h-full flex-1 bg-emerald-400/75" />
            </div>
          </section>
        )
      })}
      {!statRows.some(({ id }) => {
        const stat = detail.statistics[id]
        return stat?.home !== null && stat?.home !== undefined
          || stat?.away !== null && stat?.away !== undefined
      }) && (
        <p className="text-center text-[10px] text-emerald-100/35">Match statistics are unavailable.</p>
      )}
    </div>
  )
}

function MatchCentreSkeleton({ error }: { error: string | null }) {
  if (error) {
    return (
      <div role="alert" className="m-5 border border-rose-400/30 bg-rose-400/5 px-4 py-4 text-xs leading-5 text-rose-200 sm:m-7">
        Could not load match details: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-5 sm:p-7" aria-label="Loading match details" aria-busy="true">
      <div className="mx-auto h-3 w-36 animate-pulse rounded bg-emerald-100/10" />
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5">
        {[0, 1].map((team) => (
          <div key={team} className="flex flex-col items-center gap-3">
            <div className="size-16 animate-pulse rounded-full bg-emerald-100/10" />
            <div className="h-3 w-28 max-w-full animate-pulse rounded bg-emerald-100/10" />
          </div>
        ))}
        <div className="h-8 w-16 animate-pulse rounded bg-emerald-100/10" />
      </div>
      <div className="mx-auto h-3 w-48 animate-pulse rounded bg-emerald-100/[.07]" />
      <div className="space-y-3 border-t border-emerald-100/10 pt-5">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-12 animate-pulse rounded-lg bg-emerald-100/[.05]" />
        ))}
      </div>
    </div>
  )
}

export default function MatchCentreDrawer({ match, onClose }: { match: Match | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [activeTab, setActiveTab] = useState<DrawerTab>('summary')
  const [detail, setDetail] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!match) {
      setDetail(null)
      setLoading(false)
      setLoadError(null)
      return
    }

    const matchId = match.matchId
    const matchInitiallyLive = match.isLive
    const controller = new AbortController()
    let active = true
    let refreshing = false
    let intervalId: number | null = null
    setDetail(null)
    setLoading(true)
    setLoadError(null)

    async function refreshDetail() {
      if (refreshing) return
      refreshing = true
      try {
        const nextDetail = await getMatchDetail(matchId, controller.signal)
        if (!active) return
        setDetail(nextDetail)
        setLoadError(null)
        if (nextDetail.status === 'live' && intervalId === null) {
          intervalId = window.setInterval(() => void refreshDetail(), 15_000)
        } else if (nextDetail.status !== 'live' && intervalId !== null) {
          window.clearInterval(intervalId)
          intervalId = null
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : 'Unable to load match details')
      } finally {
        refreshing = false
        if (active) setLoading(false)
      }
    }

    if (matchInitiallyLive) {
      intervalId = window.setInterval(() => void refreshDetail(), 15_000)
    }
    void refreshDetail()

    return () => {
      active = false
      if (intervalId !== null) window.clearInterval(intervalId)
      controller.abort()
    }
  }, [match?.matchId])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (match) {
      setActiveTab('summary')
      if (!dialog.open) dialog.showModal()
    } else if (!match && dialog.open) {
      dialog.close()
    }
  }, [match?.matchId])

  const isScored = detail?.status === 'live' || detail?.status === 'finished'

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close()
      }}
      aria-labelledby="match-centre-title"
      className="fixed inset-y-0 right-0 m-0 ml-auto h-full max-h-none w-full max-w-[660px] border-0 border-l border-emerald-100/10 bg-[#064e3b] p-0 text-white shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-[2px] sm:w-[min(100vw,660px)]"
    >
      {match && (loading || !detail ? (
        <MatchCentreSkeleton error={loading ? null : loadError || 'Match details are unavailable.'} />
      ) : detail ? (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-emerald-100/10 bg-[radial-gradient(ellipse_at_50%_-15%,rgba(16,185,129,.22),transparent_65%)]">
          <div className="flex items-center justify-between px-5 pt-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-emerald-200/75">
              <Radio size={14} className={detail.status === 'live' ? 'text-rose-400' : 'text-amber-300'} />
              <span className="truncate">{detail.competition}</span>
            </div>
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close match centre" className="ml-3 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-emerald-100/10 text-emerald-50/70 transition-colors hover:border-amber-300/50 hover:text-amber-200">
              <X size={17} />
            </button>
          </div>

          <div className="px-5 pb-3 pt-2 sm:px-7 sm:pb-4">
            <p className={`mb-2 text-center text-[10px] font-bold tracking-[.14em] ${detail.status === 'live' ? 'text-rose-300' : 'text-emerald-50/55'}`}>
              {formatStatus(detail)}
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
              <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <TeamBadge name={detail.teams.home.name} shortName={detail.teams.home.short_name} crestUrl={detail.teams.home.crest_url} />
                <span className="max-w-full truncate text-xs font-semibold text-white sm:text-sm">{detail.teams.home.name}</span>
                <TeamScorers events={detail.match_events} team="home" />
              </div>
              <div className="min-w-[72px] text-center sm:min-w-[88px]">
                {isScored ? (
                  <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                    {detail.score.home ?? 0}<span className="px-1.5 text-emerald-100/30">:</span>{detail.score.away ?? 0}
                  </p>
                ) : (
                  <p className="text-xl font-semibold text-emerald-100/45">VS</p>
                )}
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[.13em] text-amber-200/70">
                  {detail.status === 'live' ? 'In play' : detail.status === 'finished' ? 'Full time' : detail.status === 'postponed' ? 'Postponed' : 'Matchday'}
                </p>
              </div>
              <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <TeamBadge name={detail.teams.away.name} shortName={detail.teams.away.short_name} crestUrl={detail.teams.away.crest_url} />
                <span className="max-w-full truncate text-xs font-semibold text-white sm:text-sm">{detail.teams.away.name}</span>
                <TeamScorers events={detail.match_events} team="away" />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-emerald-50/50">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} />{formattedKickoff(detail.kickoff)}</span>
              {detail.venue && <span className="inline-flex items-center gap-1.5"><MapPin size={12} />{detail.venue}</span>}
              {detail.referee && <span className="inline-flex items-center gap-1.5"><UserRound size={12} />{detail.referee}</span>}
            </div>
            <p id="match-centre-title" className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[.16em] text-amber-200/60">
              Match centre · live data
            </p>
          </div>
        </div>

        <section className="shrink-0 border-b border-emerald-100/10 px-5 py-2 sm:px-7" aria-label="Where to watch">
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 items-center gap-2 text-[9px] font-bold uppercase tracking-[.15em] text-emerald-100/45">
              <Tv size={13} className="text-amber-300" />Where to watch
            </div>
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
              {(detail.tv_stations || []).map((station) => (
                <span key={`${station.name}-${station.country}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-100/10 bg-emerald-950/45 px-2.5 py-1 text-[10px] text-emerald-50/80">
                  {station.logo
                    ? <img src={station.logo} alt="" className="size-4 object-contain" />
                    : <span className="grid size-4 place-items-center rounded-full bg-amber-300/10 text-[8px] font-bold text-amber-200">{station.name.slice(0, 1)}</span>}
                  <span>{station.name}</span>{station.country && <span className="text-emerald-100/35">{station.country}</span>}
                </span>
              ))}
              {(detail.tv_stations || []).length === 0 && <span className="shrink-0 self-center text-[10px] text-emerald-50/40">Broadcast information unavailable.</span>}
            </div>
          </div>
        </section>

        <nav className="shrink-0 border-b border-emerald-100/10 px-5 sm:px-7" role="tablist" aria-label="Match centre sections">
          <div className="flex gap-6">
            {drawerTabs.map((tab) => (
              <button
                key={tab.id}
                id={`match-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`match-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative cursor-pointer py-3.5 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'text-amber-200 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-amber-300' : 'text-emerald-50/65 hover:text-white'}`}
              >
                {tab.id === 'stats' && <BarChart3 size={13} className="mr-1.5 inline-block align-[-2px]" />}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-7 sm:py-5">
          {loadError && (
            <p role="alert" className="mb-4 border border-rose-400/30 bg-rose-400/5 px-3 py-2 text-[10px] text-rose-200">
              Match details may be out of date: {loadError}
            </p>
          )}
          {activeTab === 'summary' && (
            <div id="match-panel-summary" role="tabpanel" aria-labelledby="match-tab-summary" className="space-y-6">
              <section aria-labelledby="timeline-heading">
                <div className="mb-4 flex items-center justify-between">
                  <h3 id="timeline-heading" className="text-sm font-semibold text-white">Match timeline</h3>
                  <span className="text-[9px] uppercase tracking-[.12em] text-emerald-100/35">Key moments</span>
                </div>
                <EventTimeline detail={detail} />
              </section>
              {(detail.status === 'live' || detail.status === 'scheduled') && (
                <FanPoll
                  matchId={detail.match_id}
                  homeName={detail.teams.home.name}
                  awayName={detail.teams.away.name}
                  initialVotes={detail.match_polls || { home_votes: 0, draw_votes: 0, away_votes: 0 }}
                />
              )}
            </div>
          )}

          {activeTab === 'lineups' && (
            <div id="match-panel-lineups" role="tabpanel" aria-labelledby="match-tab-lineups" className="space-y-5">
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-5">
                <TeamLineup
                  name={detail.teams.home.name}
                  formation={detail.formation_home}
                  lineup={detail.match_lineups?.home || { starting_xi: [], substitutes: [] }}
                />
                <TeamLineup
                  name={detail.teams.away.name}
                  formation={detail.formation_away}
                  lineup={detail.match_lineups?.away || { starting_xi: [], substitutes: [] }}
                />
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div id="match-panel-stats" role="tabpanel" aria-labelledby="match-tab-stats">
              <MatchStats detail={detail} />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-center gap-1.5 border-t border-emerald-100/10 py-3 text-[9px] text-emerald-100/30">
          <Clock3 size={11} />Match detail data provided by the live API.
        </div>
      </div>
      ) : null)}
    </dialog>
  )
}
