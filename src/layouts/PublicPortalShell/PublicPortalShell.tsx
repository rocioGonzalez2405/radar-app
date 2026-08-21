import { Link, Outlet } from 'react-router'
import { ROUTES } from '@/app/routes'

/**
 * Minimal header for the citizen-facing Impact Portal (`/projects/...`).
 * Deliberately does not render the government dashboard nav
 * (Triage/Forecast/Capacity/Simulator/Sources) or the admin "Get Involved"
 * entry point — citizens browsing here should not be presented a path into
 * the dashboard/admin area. This is presentational only (mocked app, no
 * auth/roles): direct URL navigation to dashboard routes still works.
 */
export const PublicPortalShell = () => {
  return (
    <div className="min-h-screen bg-ink-0 pb-16">
      <header className="sticky top-0 z-50 border-b border-line bg-ink-1">
        <div className="flex items-center justify-between px-8 py-4 max-md:px-4">
          <Link to={ROUTES.projects} className="flex items-center gap-3">
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-coral to-amber font-mono text-[13px] font-bold text-[#1a0f0a]">
              R
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">Radar</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-text-low">
                Impact Portal · Find Ways to Help
              </div>
            </div>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1360px] px-8 py-7 max-md:px-4">
        <Outlet />
      </main>
    </div>
  )
}
