import { Goal, Sparkles } from 'lucide-react'
import type { ApiLeagueLeader } from '../api'

function LeaderSkeleton() {
  return (
    <section className="overflow-hidden rounded-xl border border-emerald-300/15 bg-[#064e3b]/35 p-5" aria-hidden="true">
      <div className="mb-5 h-5 w-32 animate-pulse rounded bg-emerald-100/10" />
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-t border-emerald-100/[.07] py-3">
          <div className="size-6 animate-pulse rounded bg-emerald-100/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-emerald-100/10" />
            <div className="h-2 w-1/3 animate-pulse rounded bg-emerald-100/[.06]" />
          </div>
          <div className="h-4 w-7 animate-pulse rounded bg-emerald-100/10" />
        </div>
      ))}
    </section>
  )
}

function LeaderCard({
  title,
  statLabel,
  players,
  statKey,
}: {
  title: string
  statLabel: string
  players: ApiLeagueLeader[]
  statKey: 'goals' | 'assists'
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-emerald-300/15 bg-[#064e3b]/35">
      <div className="flex items-center justify-between border-b border-emerald-100/10 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg border border-amber-300/20 bg-amber-300/[.07] text-amber-200">
            <Goal size={17} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <p className="mt-0.5 text-[10px] text-emerald-50/45">Competition leaders</p>
          </div>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[.13em] text-emerald-100/40">Top {players.length}</span>
      </div>

      <div className="grid grid-cols-[1.7rem_minmax(0,1fr)_2.5rem_3rem] gap-2 px-4 py-2.5 text-[8px] font-bold uppercase tracking-[.12em] text-emerald-100/40 sm:px-5">
        <span>#</span><span>Player · Club</span><span className="text-center">App</span><span className="text-right">{statLabel}</span>
      </div>
      {players.length > 0 ? (
        <ol className="divide-y divide-emerald-100/[.07]">
          {players.map((player) => (
            <li key={`${player.playerId}-${player.playerName}`} className="grid grid-cols-[1.7rem_minmax(0,1fr)_2.5rem_3rem] items-center gap-2 px-4 py-3 transition-colors hover:bg-emerald-100/[.025] sm:px-5">
              <span className={`grid size-6 place-items-center rounded-md text-[10px] font-bold tabular-nums ${player.rank === 1 ? 'bg-amber-300/15 text-amber-200' : 'bg-emerald-100/[.06] text-emerald-50/55'}`}>
                {String(player.rank).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-white">{player.playerName}</p>
                <div className="mt-1 flex min-w-0 items-center gap-1.5">
                  <span className="grid size-4 shrink-0 place-items-center overflow-hidden rounded-full border border-emerald-100/10 bg-emerald-950/70 text-[6px] font-bold text-amber-200">
                    {player.teamCrestUrl
                      ? <img src={player.teamCrestUrl} alt="" className="size-full object-contain" />
                      : (player.teamShortName || player.teamName?.slice(0, 3) || '—')}
                  </span>
                  <span className="truncate text-[9px] text-emerald-50/50">{player.teamName || 'Club unavailable'}</span>
                </div>
              </div>
              <span className="text-center text-[10px] tabular-nums text-emerald-50/60">{player.appearances}</span>
              <span className="text-right text-sm font-bold tabular-nums text-amber-200">{player[statKey]}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-5 py-8 text-center text-xs text-emerald-50/45">No leader data is available yet.</p>
      )}
    </section>
  )
}

export default function LeagueLeaders({
  scorers,
  assists,
  loading,
  error,
}: {
  scorers: ApiLeagueLeader[]
  assists: ApiLeagueLeader[]
  loading: boolean
  error: string | null
}) {
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2" aria-label="Loading league leaders" aria-busy="true">
        <LeaderSkeleton />
        <LeaderSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <p role="alert" className="border border-rose-400/30 bg-rose-400/5 px-4 py-4 text-xs text-rose-200">
        Could not load league leaders: {error}
      </p>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] text-emerald-50/45">Player rankings · live data</p>
        <span className="inline-flex items-center gap-1.5 text-[9px] text-amber-200/65">
          <Sparkles size={12} />Season leaders
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <LeaderCard title="Top scorers" statLabel="Goals" players={scorers} statKey="goals" />
        <LeaderCard title="Top assists" statLabel="Assists" players={assists} statKey="assists" />
      </div>
    </div>
  )
}
