import { ArrowUpRight } from 'lucide-react'
import { resolveBroadcasterLink } from '../config/broadcasters'

export type BroadcastStation = {
  name: string
  country?: string | null
  logo?: string | null
}

type BroadcastLinkProps = {
  station: BroadcastStation
  compact?: boolean
}

export default function BroadcastLink({ station, compact = false }: BroadcastLinkProps) {
  const { label, url, isAffiliate, ctaText } = resolveBroadcasterLink(station.name)
  const action = ctaText || 'Watch live'
  const markSize = compact ? 'size-3.5' : 'size-4'
  const textSize = compact ? 'text-[9px]' : 'text-[10px]'

  return (
    <a
      href={url}
      target="_blank"
      rel={isAffiliate ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
      title={`${action} on ${label}`}
      aria-label={`${action} on ${label}${station.country ? ` (${station.country})` : ''} — opens in a new tab`}
      onClick={(event) => event.stopPropagation()}
      className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-100/10 bg-emerald-950/45 text-emerald-50/80 transition-colors hover:border-amber-300/50 hover:bg-emerald-900/60 hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 ${
        compact ? 'px-2 py-0.5' : 'px-2.5 py-1'
      } ${textSize}`}
    >
      {station.logo
        ? <img src={station.logo} alt="" loading="lazy" className={`${markSize} shrink-0 object-contain`} />
        : <span className={`grid ${markSize} shrink-0 place-items-center rounded-full bg-amber-300/10 text-[8px] font-bold text-amber-200`} aria-hidden="true">
            {station.name.slice(0, 1)}
          </span>}
      <span className="whitespace-nowrap">{station.name}</span>
      {station.country && <span className="text-emerald-100/35">{station.country}</span>}
      <ArrowUpRight
        size={compact ? 10 : 11}
        className="text-emerald-100/30 transition-colors group-hover:text-amber-300"
        aria-hidden="true"
      />
    </a>
  )
}
