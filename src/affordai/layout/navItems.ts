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
]
