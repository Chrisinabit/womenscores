export type BroadcasterConfig = {
  label: string
  url: string
  isAffiliate: boolean
  ctaText?: string
}

type BroadcasterDefinition = BroadcasterConfig & {
  // Matched case-insensitively against the station name reported by Sportmonks.
  keywords: string[]
}

// Default destinations are the broadcasters' own public streaming pages. When an
// Impact/Awin link is approved, swap the url and flip isAffiliate to true — the
// disclosure text and rel attributes downstream follow automatically.
const definitions: BroadcasterDefinition[] = [
  {
    keywords: ['dazn'],
    label: 'DAZN',
    url: 'https://www.dazn.com',
    isAffiliate: false,
    ctaText: 'Stream Live',
  },
  {
    keywords: ['tnt sports', 'tnt'],
    label: 'TNT Sports',
    url: 'https://www.discoveryplus.com/gb/sports',
    isAffiliate: false,
    ctaText: 'Watch Live',
  },
  {
    keywords: ['discovery+', 'discovery plus', 'discovery'],
    label: 'discovery+',
    url: 'https://www.discoveryplus.com/gb/sports',
    isAffiliate: false,
    ctaText: 'Watch Live',
  },
  {
    keywords: ['sky sports', 'sky'],
    label: 'Sky Sports',
    url: 'https://www.nowtv.com/watch-sky-sports-online',
    isAffiliate: false,
    ctaText: 'Stream on NOW',
  },
  {
    keywords: ['paramount'],
    label: 'Paramount+',
    url: 'https://www.paramountplus.com/shows/nwsl/',
    isAffiliate: false,
    ctaText: 'Watch Live',
  },
  {
    keywords: ['espn'],
    label: 'ESPN+',
    url: 'https://plus.espn.com/',
    isAffiliate: false,
    ctaText: 'Stream Live',
  },
  {
    keywords: ['bbc'],
    label: 'BBC iPlayer',
    url: 'https://www.bbc.co.uk/iplayer',
    isAffiliate: false,
    ctaText: 'Free in UK',
  },
  {
    keywords: ['youtube'],
    label: 'YouTube',
    url: 'https://www.youtube.com',
    isAffiliate: false,
    ctaText: 'Watch Free',
  },
]

/**
 * Resolves a broadcaster name from the match data to a destination link.
 * Unknown regional stations fall back to a search for that station's live stream,
 * so every badge stays clickable without inventing a URL we cannot verify.
 */
export function resolveBroadcasterLink(rawName: string): BroadcasterConfig {
  const name = (rawName || '').trim()
  const normalized = name.toLowerCase()

  const definition = definitions.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  )

  if (definition) {
    return {
      label: definition.label,
      url: definition.url,
      isAffiliate: definition.isAffiliate,
      ctaText: definition.ctaText,
    }
  }

  return {
    label: name || 'Broadcaster',
    url: `https://www.google.com/search?q=${encodeURIComponent(`${name || "women's football"} live stream`)}`,
    isAffiliate: false,
  }
}
