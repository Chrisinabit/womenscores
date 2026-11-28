import { useEffect, useState } from 'react'
import { ArrowUpRight, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCompetitionForLeague, getLeagues, type ApiLeague } from '../api'
import { competitionDirectory } from '../data/competitions'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function Competitions() {
  useDocumentTitle('Competitions')

  const [leagues, setLeagues] = useState<ApiLeague[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    getLeagues(controller.signal)
      .then((apiLeagues) => {
        setLeagues(apiLeagues)
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : 'Unable to load leagues')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const competitionOrder = new Map([
    ['wsl', 0],
    ['uwcl', 1],
  ])
  const competitions = leagues
    .flatMap((league) => {
      const metadata = getCompetitionForLeague(league, competitionDirectory)
      return metadata
        ? [{
          slug: metadata.slug,
          name: league.name,
          country: league.country,
          region: league.country.toUpperCase(),
          logoUrl: league.logoUrl,
        }]
        : []
    })
    .sort((a, b) => (
      (competitionOrder.get(a.slug) ?? 2) - (competitionOrder.get(b.slug) ?? 2)
    ))

  return (
    <main className="mx-auto min-h-[calc(100vh-150px)] max-w-6xl px-5 pb-16 pt-12 sm:px-[5vw] sm:pt-16 lg:px-0">
      <p className="mb-3 text-[10px] font-extrabold tracking-[.2em] text-emerald-300">FOLLOW THE SEASON</p>
      <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">Competitions<span className="text-amber-300">.</span></h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-gray-400">Explore the leagues and tournaments shaping women&apos;s football around the world.</p>

      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Women's football competitions">
        {loadError && (
          <p role="alert" className="border border-rose-400/30 bg-rose-400/5 px-4 py-3 text-xs text-rose-200 sm:col-span-2 lg:col-span-3">
            Could not load competitions: {loadError}
          </p>
        )}
        {loading ? (
          <p className="border border-emerald-400/15 px-4 py-8 text-center text-xs text-gray-400 sm:col-span-2 lg:col-span-3">
            Loading competitions…
          </p>
        ) : !loadError && competitions.length === 0 ? (
          <p className="border border-emerald-400/15 px-4 py-8 text-center text-xs text-gray-400 sm:col-span-2 lg:col-span-3">
            No supported competitions are available from the API.
          </p>
        ) : competitions.map((competition, index) => (
          <Link to={`/competitions/${competition.slug}`} key={competition.slug} className="group flex min-h-48 flex-col border border-emerald-400/15 bg-[#08281f]/75 p-5 transition-colors hover:border-amber-300/40 hover:bg-[#0a3024]">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center border border-amber-300/30 bg-amber-300/5 text-amber-300">
                {competition.logoUrl
                  ? <img src={competition.logoUrl} alt="" className="size-full object-contain p-1" />
                  : <Trophy size={18} />}
              </span>
              <span className="text-[9px] tracking-[.14em] text-gray-500">{competition.region}</span>
            </div>
            <p className="mt-6 text-[9px] tracking-[.16em] text-emerald-300">0{index + 1}</p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-medium">{competition.name}</h2>
                <p className="mt-2 text-xs leading-5 text-gray-400">{competition.country} · Live API data</p>
              </div>
              <ArrowUpRight size={16} className="mt-1 shrink-0 text-amber-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}
