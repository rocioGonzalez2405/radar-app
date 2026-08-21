import { ROUTES } from '@/app/routes'

export interface NavItem {
  to: string
  label: string
}

/**
 * The sidebar. Entries are appended by the task that builds the page they point
 * at, so this list never contains a link to a route that does not exist.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.affordai.overview, label: 'Overview' },
  { to: ROUTES.affordai.households, label: 'Households' },
  { to: ROUTES.affordai.vulnerability, label: 'Vulnerability' },
  { to: ROUTES.affordai.subsidies, label: 'Subsidies' },
  { to: ROUTES.affordai.marketPrices, label: 'Market Prices' },
  { to: ROUTES.affordai.predictions, label: 'Predictions' },
  { to: ROUTES.affordai.impact, label: 'Impact' },
  { to: ROUTES.affordai.dataSources, label: 'Data Sources' },
  { to: ROUTES.affordai.settings, label: 'Settings' },
]
