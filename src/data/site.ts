export const brandName = 'WomenLiveScores'
export const siteUrl = 'https://womenlivescores.com'
export const siteDomain = 'womenlivescores.com'

// Single source of truth for the public contact address. Every legal and
// advertising page reads this, so the address only has to change in one place.
export const contactEmail = 'contact@womenlivescores.com'

export const policyLastUpdated = '28 November 2026'

export const policyRoutes = [
  { label: 'About', to: '/about' },
  { label: 'Advertise', to: '/advertise' },
  { label: 'Privacy', to: '/privacy-policy' },
  { label: 'Terms', to: '/terms' },
] as const
