import { useEffect, useRef, useState } from 'react'
import { Search, UserRound, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCompetitionForLeague, getLeagues, searchApi, type ApiLeague, type ApiSearchClub, type ApiSearchPlayer, type ApiSearchResults } from '../api'
import { competitionDirectory } from '../data/competitions'

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export default function HeaderQuickSearch() {
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<ApiSearchResults>({ clubs: [], players: [] })
  const [leagues, setLeagues] = useState<ApiLeague[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getLeagues(controller.signal)
      .then(setLeagues)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setLeagues([])
        }
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    const searchTerm = debouncedQuery.trim()
    if (!searchTerm) {
      setResults({ clubs: [], players: [] })
      setLoading(false)
      setSearchError(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setSearchError(null)
    searchApi(searchTerm, controller.signal)
      .then(setResults)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setResults({ clubs: [], players: [] })
        setSearchError(error instanceof Error ? error.message : 'Unable to search clubs and players')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [debouncedQuery])

  useEffect(() => {
    if (mobileSearchOpen) inputRef.current?.focus()
  }, [mobileSearchOpen])

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setMobileSearchOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [])

  const isSearching = query.trim() !== debouncedQuery || loading

  function competitionSlugFor(competitionId: number | null, name: string | null, country = '') {
    const league = leagues.find((item) => item.id === competitionId)
      || (name
        ? { id: competitionId || 0, name, country, logoUrl: null }
        : undefined)
    const competition = league
      ? getCompetitionForLeague(league, competitionDirectory)
      : undefined
    return competition?.slug
      || competitionDirectory.find((item) => normalize(item.name) === normalize(name || ''))?.slug
  }

  function openClub(club: ApiSearchClub) {
    const competitionSlug = competitionSlugFor(club.competitionId, club.competitionName, club.country)
    if (!competitionSlug) {
      navigate('/competitions')
    } else {
      navigate(`/competitions/${competitionSlug}?teamId=${club.id}`)
    }
    closeSearch()
  }

  function openPlayer(player: ApiSearchPlayer) {
    const competitionSlug = competitionSlugFor(
      player.competitionId,
      player.competitionName,
      leagues.find((league) => league.id === player.competitionId)?.country || '',
    )
    if (!competitionSlug) {
      navigate('/competitions')
    } else {
      const teamQuery = player.teamId ? `?teamId=${player.teamId}` : ''
      navigate(`/competitions/${competitionSlug}${teamQuery}`)
    }
    closeSearch()
  }

  function closeSearch() {
    setIsOpen(false)
    setMobileSearchOpen(false)
    setQuery('')
    setDebouncedQuery('')
    setSearchError(null)
  }

  return (
    <div ref={searchRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
        aria-expanded={mobileSearchOpen}
        onClick={() => {
          if (mobileSearchOpen) {
            closeSearch()
          } else {
            setMobileSearchOpen(true)
            setIsOpen(true)
          }
        }}
        className="grid size-9 cursor-pointer place-items-center text-gray-300 transition-colors hover:text-amber-300 md:hidden"
      >
        {mobileSearchOpen ? <X size={18} /> : <Search size={19} strokeWidth={1.7} />}
      </button>

      <div className={`${mobileSearchOpen ? 'absolute right-0 top-full z-30 mt-2 block w-[min(88vw,22rem)]' : 'hidden'} md:static md:mt-0 md:block md:w-52`}>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/45" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-label="Search clubs and players"
            aria-autocomplete="list"
            aria-expanded={isOpen && query.trim().length > 0}
            aria-controls="header-search-results"
            placeholder="Search clubs, players..."
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setIsOpen(true)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') closeSearch()
            }}
            className="h-9 w-full rounded-md border border-emerald-100/10 bg-emerald-950/50 pl-9 pr-3 text-xs text-white outline-none placeholder:text-emerald-100/35 focus:border-amber-300/50 focus:ring-1 focus:ring-amber-300/20 md:w-52"
          />
        </div>

        {isOpen && query.trim().length > 0 && (
          <div
            id="header-search-results"
            role="listbox"
            aria-label="Search results"
            className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-lg border border-emerald-100/10 bg-[#06291f] p-2 shadow-2xl shadow-black/40"
          >
            {isSearching ? (
              <div role="status" aria-label="Searching clubs and players" className="space-y-2 p-2">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md px-2 py-2">
                    <span className="size-8 animate-pulse rounded-full bg-emerald-100/10" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-2/3 animate-pulse rounded bg-emerald-100/10" />
                      <span className="block h-2 w-1/3 animate-pulse rounded bg-emerald-100/[.06]" />
                    </span>
                  </div>
                ))}
              </div>
            ) : searchError ? (
              <p role="alert" className="px-3 py-4 text-center text-xs text-rose-200">Search failed: {searchError}</p>
            ) : results.clubs.length === 0 && results.players.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-emerald-50/45">No clubs or players found.</p>
            ) : (
              <>
                {results.clubs.length > 0 && (
                  <section role="group" aria-label="Clubs">
                    <h2 aria-hidden="true" className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[.15em] text-emerald-100/40">Clubs</h2>
                    {results.clubs.map((club) => (
                      <button
                        key={`club-${club.id}`}
                        type="button"
                        role="option"
                        aria-selected="false"
                        onClick={() => openClub(club)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-emerald-100/[.06] focus-visible:bg-emerald-100/[.06] focus-visible:outline-none"
                      >
                        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-emerald-100/10 bg-emerald-950 text-[9px] font-bold text-amber-200">
                          {club.crestUrl
                            ? <img src={club.crestUrl} alt="" className="size-full object-contain" />
                            : club.shortName || club.name.slice(0, 3).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium text-white">{club.name}</span>
                          <span className="mt-0.5 block truncate text-[9px] text-emerald-100/40">{club.competitionName} · {club.country}</span>
                        </span>
                      </button>
                    ))}
                  </section>
                )}
                {results.players.length > 0 && (
                  <section role="group" aria-label="Players" className={results.clubs.length > 0 ? 'mt-2 border-t border-emerald-100/[.08] pt-1' : ''}>
                    <h2 aria-hidden="true" className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[.15em] text-emerald-100/40">Players</h2>
                    {results.players.map((player) => (
                      <button
                        key={`player-${player.id}`}
                        type="button"
                        role="option"
                        aria-selected="false"
                        onClick={() => openPlayer(player)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-emerald-100/[.06] focus-visible:bg-emerald-100/[.06] focus-visible:outline-none"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-amber-300/15 bg-amber-300/[.06] text-amber-200">
                          <UserRound size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium text-white">{player.name}</span>
                          <span className="mt-0.5 block truncate text-[9px] text-emerald-100/40">{player.position || 'Position unavailable'} · {player.teamName || 'Club unavailable'}</span>
                        </span>
                        <span className="text-[8px] uppercase tracking-wide text-amber-200/60">{player.teamId ? 'Club fixtures' : 'Competition'}</span>
                      </button>
                    ))}
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
