import { Clock3, Star, Trophy } from 'lucide-react'

export type Match = {
  league: string
  status: string
  home: string
  away: string
  homeInitials: string
  awayInitials: string
  homeScore?: number
  awayScore?: number
  isLive: boolean
  date?: string
  homeCrestUrl?: string | null
  awayCrestUrl?: string | null
}

function TeamCrest({ initials, crestUrl, away = false }: { initials: string; crestUrl?: string | null; away?: boolean }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center border text-[10px] font-extrabold ${away ? 'border-amber-300/50 bg-amber-300/5 text-amber-300' : 'border-emerald-400/50 bg-emerald-400/5 text-emerald-300'}`} aria-hidden="true">
      {crestUrl ? <img src={crestUrl} alt="" className="size-full object-contain p-1" /> : initials}
    </span>
  )
}

export default function LiveMatchCard({ match }: { match: Match }) {
  return (
    <article className="group border border-emerald-400/15 border-l-2 border-l-amber-300/80 bg-[#08281f]/85 px-4 py-4 transition-colors hover:border-emerald-300/40 hover:bg-[#0a3024] sm:px-5">
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
              LIVE {match.status}
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
          <span className="truncate">{match.home}</span>
        </div>
        <div className="flex min-w-[72px] flex-col items-center gap-1">
          {match.homeScore !== undefined && match.awayScore !== undefined ? (
            <strong className="text-xl font-semibold tabular-nums text-white">
              {match.homeScore}<span className="px-1.5 font-normal text-gray-500">–</span>{match.awayScore}
            </strong>
          ) : (
            <span className="text-xs font-medium text-gray-500">vs</span>
          )}
          <span className="text-[9px] uppercase tracking-[.15em] text-gray-500">{match.isLive ? 'Full time pending' : 'Kick-off'}</span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2.5 text-right text-xs font-medium text-white sm:gap-3">
          <span className="truncate">{match.away}</span>
          <TeamCrest initials={match.awayInitials} crestUrl={match.awayCrestUrl} away />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-gray-500">
        <span>{match.isLive ? 'Live match centre' : 'Fixture details'}</span>
        <button type="button" className="inline-flex items-center gap-1.5 transition-colors hover:text-amber-300" aria-label={`Add ${match.home} vs ${match.away} to favourites`}>
          <Star size={13} />
          <span>Follow</span>
        </button>
      </div>
    </article>
  )
}
