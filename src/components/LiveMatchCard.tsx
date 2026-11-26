import { Clock3, Star, Trophy } from 'lucide-react'
import type { ApiGoalScorer } from '../api'

export type Match = {
  matchId: number
  league: string
  status: string
  kickoffAt: string | null
  home: string
  away: string
  homeInitials: string
  awayInitials: string
  homeScore?: number
  awayScore?: number
  isLive: boolean
  isFinished?: boolean
  isPostponed?: boolean
  date?: string
  homeCrestUrl?: string | null
  awayCrestUrl?: string | null
  scorers?: {
    home: ApiGoalScorer[]
    away: ApiGoalScorer[]
  }
}

function ScorerList({ scorers }: { scorers: ApiGoalScorer[] }) {
  const namedScorers = scorers.filter((scorer) => scorer.name)
  if (namedScorers.length === 0) return null

  return (
    <span className="mt-1 flex flex-col text-[9px] font-normal leading-4 text-gray-400">
      {namedScorers.map((scorer, index) => (
        <span key={`${scorer.name}-${scorer.minute}-${index}`} className="truncate">
          {scorer.name} {scorer.minute !== null ? `${scorer.minute}${scorer.addedTime ? `+${scorer.addedTime}` : ''}′` : ''}
        </span>
      ))}
    </span>
  )
}

function TeamCrest({ initials, crestUrl, away = false }: { initials: string; crestUrl?: string | null; away?: boolean }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center border text-[10px] font-extrabold ${away ? 'border-amber-300/50 bg-amber-300/5 text-amber-300' : 'border-emerald-400/50 bg-emerald-400/5 text-emerald-300'}`} aria-hidden="true">
      {crestUrl ? <img src={crestUrl} alt="" className="size-full object-contain p-1" /> : initials}
    </span>
  )
}

export default function LiveMatchCard({
  match,
  onSelect,
}: {
  match: Match
  onSelect: (match: Match) => void
}) {
  return (
    <article className="group border border-emerald-400/15 border-l-2 border-l-amber-300/80 bg-[#08281f]/85 transition-colors hover:border-emerald-300/40 hover:bg-[#0a3024]">
      <button
        type="button"
        className="block w-full cursor-pointer px-4 pt-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 sm:px-5"
        onClick={() => onSelect(match)}
        aria-label={`Open match centre: ${match.home} versus ${match.away}`}
      >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-medium text-gray-400">
          <Trophy size={13} className="text-amber-300" />
          {match.league}
        </span>
        <span className={`inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold tracking-wide ${match.isLive ? 'text-emerald-300' : 'text-gray-400'}`}>
          {match.isLive ? (
            <>
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              LIVE{match.status === 'LIVE' ? '' : ` ${match.status}`}
            </>
          ) : (
            <>
              <Clock3 size={12} />
              {match.date} · {match.status}
            </>
          )}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-5 sm:gap-5">
        <div className="flex min-w-0 items-center gap-2.5 text-xs font-medium text-white sm:gap-3">
          <TeamCrest initials={match.homeInitials} crestUrl={match.homeCrestUrl} />
          <span className="min-w-0 flex-1">
            <span className="block truncate">{match.home}</span>
            <ScorerList scorers={match.scorers?.home || []} />
          </span>
        </div>
        <div className="flex min-w-[72px] flex-col items-center gap-1">
          {match.homeScore !== undefined && match.awayScore !== undefined ? (
            <strong className="text-xl font-semibold tabular-nums text-white">
              {match.homeScore}<span className="px-1.5 font-normal text-gray-500">–</span>{match.awayScore}
            </strong>
          ) : (
            <span className="text-xs font-medium text-gray-500">vs</span>
          )}
          <span className="text-[9px] uppercase tracking-[.15em] text-gray-500">
            {match.isLive ? 'Full time pending' : match.isPostponed ? 'Postponed' : 'Kick-off'}
          </span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2.5 text-right text-xs font-medium text-white sm:gap-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate">{match.away}</span>
            <ScorerList scorers={match.scorers?.away || []} />
          </span>
          <TeamCrest initials={match.awayInitials} crestUrl={match.awayCrestUrl} away />
        </div>
      </div>
      </button>

      <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-[10px] text-gray-500 sm:px-5">
        <span>{match.isLive ? 'Live match centre' : 'Fixture details'}</span>
        <button type="button" onClick={() => onSelect(match)} className="inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-amber-300" aria-label={`Open ${match.home} vs ${match.away} match centre`}>
          <Star size={13} />
          <span>Match centre</span>
        </button>
      </div>
    </article>
  )
}
