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
  },
  portal: '/portal',
  portalNew: '/portal/new',
  projects: '/projects',
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
  portalDetail: (id: string) => `/portal/${id}`,
  portalVolunteer: (id: string) => `/portal/${id}/volunteer`,
  portalLegalAid: (id: string) => `/portal/${id}/legal-aid`,
  projectDetail: (id: string) => `/projects/${id}`,
  projectVolunteer: (id: string) => `/projects/${id}/volunteer`,
  projectLegalAid: (id: string) => `/projects/${id}/legal-aid`,
} as const

export const ROUTE_PATTERNS = {
  portalDetail: '/portal/:id',
  portalVolunteer: '/portal/:id/volunteer',
  portalLegalAid: '/portal/:id/legal-aid',
  projectDetail: '/projects/:id',
  projectVolunteer: '/projects/:id/volunteer',
  projectLegalAid: '/projects/:id/legal-aid',
} as const

export const householdPath = (householdId: number) =>
  `${ROUTES.affordai.households}/${householdId}`
