/**
 * Two products live in this app. Radar owns the root; AffordAI owns /affordai.
 * Radar's paths are unchanged from before the split.
 */
export const ROUTES = {
  radar: {
    triage: '/',
    forecast: '/forecast',
    capacity: '/capacity',
    simulator: '/simulator',
    sources: '/sources',
    donate: '/donate',
  },
  affordai: {
    overview: '/affordai',
    households: '/affordai/households',
    householdDetail: '/affordai/households/:householdId',
    vulnerability: '/affordai/vulnerability',
    subsidies: '/affordai/subsidies',
    marketPrices: '/affordai/market-prices',
    predictions: '/affordai/predictions',
    impact: '/affordai/impact',
    dataSources: '/affordai/data-sources',
    settings: '/affordai/settings',
  },
} as const

export const householdPath = (householdId: number) =>
  `${ROUTES.affordai.households}/${householdId}`
