import { NavLink, Outlet } from 'react-router'
import { ROUTES } from '@/app/routes'

const DASHBOARD_NAV_ITEMS = [
  { to: ROUTES.nonprofitDashboard.home, label: 'Dashboard' },
  { to: ROUTES.nonprofitDashboard.inventory, label: 'Inventory' },
  { to: ROUTES.nonprofitDashboard.needs, label: 'Needs' },
  { to: ROUTES.nonprofitDashboard.matches, label: 'Matches' },
  { to: ROUTES.nonprofitDashboard.transactions, label: 'Transactions' },
  { to: ROUTES.nonprofitDashboard.profile, label: 'Profile' },
]

const navLinkClass = (isActive: boolean) =>
  `text-sm font-medium border-b-2 pb-1 ${
    isActive
      ? 'text-text-hi border-coral'
      : 'text-text-mid border-transparent hover:text-text-hi'
  }`

export const NonprofitDashboardShell = () => {
  return (
    <div className="min-h-screen bg-ink-0 pb-16">
      <header className="sticky top-0 z-50 border-b border-line bg-ink-1">
        <div className="flex items-center justify-between px-8 py-4 max-md:px-4">
          <NavLink to={ROUTES.nonprofitDashboard.home} className="flex items-center gap-3">
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-coral to-amber font-mono text-[13px] font-bold text-[#1a0f0a]">
              BN
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">Buy Nothing</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-text-low">
                Nonprofit Dashboard
              </div>
            </div>
          </NavLink>

          <nav className="hidden gap-6 lg:flex">
            {DASHBOARD_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.nonprofitDashboard.home}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3.5">
            <NavLink
              to={ROUTES.radar.triage}
              className="whitespace-nowrap rounded-full bg-text-low px-4 py-1.5 text-sm font-semibold text-ink-0 hover:bg-text-mid"
            >
              Back to Radar
            </NavLink>
          </div>
        </div>

        {/* Mobile nav would go here */}
      </header>

      <main className="mx-auto max-w-[1360px] px-8 py-7 max-md:px-4">
        <Outlet />
      </main>
    </div>
  )
}
