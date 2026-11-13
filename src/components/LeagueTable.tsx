import type { StandingRow } from '../data/competitions'

const formStyles = {
  W: 'bg-emerald-500/15 text-emerald-300',
  D: 'bg-gray-400/15 text-gray-300',
  L: 'bg-rose-500/15 text-rose-300',
}

export default function LeagueTable({
  standings,
  qualifyingSpots,
  qualificationLabel,
}: {
  standings: StandingRow[]
  qualifyingSpots: number
  qualificationLabel: string
}) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[10px] text-gray-400">
        <span>League standings</span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 border-l-2 border-amber-300 bg-amber-300/10" />
          {qualificationLabel}
        </span>
      </div>
      <div className="overflow-x-auto border border-emerald-400/15">
        <table className="w-full min-w-[790px] border-collapse text-left text-xs">
          <thead className="bg-[#0a3024] text-[9px] uppercase tracking-[.13em] text-gray-400">
            <tr>
              <th scope="col" className="w-12 px-3 py-3 text-center font-medium">#</th>
              <th scope="col" className="min-w-52 px-3 py-3 font-medium">Team</th>
              <th scope="col" className="px-2 py-3 text-center font-medium">MP</th>
              <th scope="col" className="px-2 py-3 text-center font-medium">W</th>
              <th scope="col" className="px-2 py-3 text-center font-medium">D</th>
              <th scope="col" className="px-2 py-3 text-center font-medium">L</th>
              <th scope="col" className="px-2 py-3 text-center font-medium">GF</th>
              <th scope="col" className="px-2 py-3 text-center font-medium">GA</th>
              <th scope="col" className="px-2 py-3 text-center font-medium">GD</th>
              <th scope="col" className="px-3 py-3 text-center font-medium text-amber-300">PTS</th>
              <th scope="col" className="px-3 py-3 font-medium">Form</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => {
              const goalDifference = row.goalDifference ?? row.goalsFor - row.goalsAgainst
              const points = row.points ?? row.won * 3 + row.drawn
              const qualified = index < qualifyingSpots
              return (
                <tr
                  key={row.team}
                  className={`border-t border-white/5 transition-colors hover:bg-emerald-400/5 ${qualified ? 'bg-emerald-400/[.035]' : 'bg-[#08281f]/60'}`}
                >
                  <td className={`border-l-2 px-3 py-3.5 text-center tabular-nums ${qualified ? 'border-l-amber-300 text-amber-300' : 'border-l-transparent text-gray-500'}`}>
                    {String(row.rank ?? index + 1).padStart(2, '0')}
                  </td>
                  <th scope="row" className="px-3 py-3.5 font-medium text-white">
                    <span className="flex items-center gap-2.5">
                      <span className={`grid size-7 shrink-0 place-items-center border text-[8px] font-bold ${qualified ? 'border-amber-300/35 bg-amber-300/5 text-amber-200' : 'border-emerald-400/25 bg-emerald-400/5 text-emerald-200'}`}>
                        {row.crestUrl ? <img src={row.crestUrl} alt="" className="size-full object-contain p-0.5" /> : row.crest}
                      </span>
                      <span className="whitespace-nowrap">{row.team}</span>
                    </span>
                  </th>
                  <td className="px-2 py-3.5 text-center tabular-nums text-gray-300">{row.played}</td>
                  <td className="px-2 py-3.5 text-center tabular-nums text-gray-300">{row.won}</td>
                  <td className="px-2 py-3.5 text-center tabular-nums text-gray-300">{row.drawn}</td>
                  <td className="px-2 py-3.5 text-center tabular-nums text-gray-300">{row.lost}</td>
                  <td className="px-2 py-3.5 text-center tabular-nums text-gray-300">{row.goalsFor}</td>
                  <td className="px-2 py-3.5 text-center tabular-nums text-gray-300">{row.goalsAgainst}</td>
                  <td className={`px-2 py-3.5 text-center tabular-nums ${goalDifference > 0 ? 'text-emerald-300' : goalDifference < 0 ? 'text-rose-300' : 'text-gray-400'}`}>
                    {goalDifference > 0 ? `+${goalDifference}` : goalDifference}
                  </td>
                  <td className="px-3 py-3.5 text-center font-bold tabular-nums text-amber-300">{points}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1" aria-label={`Recent form: ${row.form.join(', ')}`}>
                      {row.form.map((result, formIndex) => (
                        <span key={`${row.crest}-${formIndex}`} className={`grid size-5 place-items-center text-[8px] font-bold ${formStyles[result]}`} aria-hidden="true">
                          {result}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[9px] text-gray-500">
        <span className="font-semibold uppercase tracking-wide text-gray-400">Form</span>
        <span><span className="mr-1 text-emerald-300">W</span>Win</span>
        <span><span className="mr-1 text-gray-300">D</span>Draw</span>
        <span><span className="mr-1 text-rose-300">L</span>Loss</span>
      </div>
    </div>
  )
}
