import { NavLink, Outlet } from 'react-router'
import { ROUTES } from '@/app/routes'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { NAV_ITEMS } from '@/affordai/layout/navItems'
import { AffordStoreProvider } from '@/affordai/state/AffordStore'

const navLinkClass = (isActive: boolean) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-ink-2 text-text-hi'
      : 'text-text-mid hover:bg-ink-2/60 hover:text-text-hi'
  }`

const pillClass = (isActive: boolean) =>
  `flex-shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
    isActive
      ? 'border-blue bg-ink-2 text-text-hi'
      : 'border-line text-text-mid hover:text-text-hi'
  }`

/**
 * AffordAI is a section of the console, not a separate application: the Radar
 * top bar stays above this layout and marks AffordAI as the active nav item.
 * This shell therefore owns no page chrome — no background, no max-width, no
 * padding — only the section's own navigation beside its content.
 */
export const AffordShell = () => (
  <AffordStoreProvider>
    <div className="md:flex md:gap-7">
      <aside className="hidden w-[220px] flex-shrink-0 flex-col md:flex">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue to-teal font-mono text-[12px] font-bold text-[#08131f]">
            A
          </div>
          <div>
            <div className="text-[13px] font-semibold tracking-wide">AffordAI</div>
            <div className="font-mono text-[10px] tracking-wider text-text-low uppercase">
              Subsidy Intelligence
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.affordai.overview}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-7 flex flex-col gap-3">
          <div className="rounded-lg border border-line-soft bg-ink-2 p-3">
            <div className="mb-2 text-[11px] font-semibold tracking-wide text-text-low uppercase">
              AI Model Status
            </div>
            <dl className="flex flex-col gap-1 font-mono text-[11px] text-text-mid">
              <div className="flex justify-between gap-2">
                <dt>Model</dt>
                <dd className="text-text-hi">Affordability v1.4</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Updated</dt>
                <dd className="text-text-hi">2 hours ago</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Status</dt>
                <dd className="inline-flex items-center text-teal">
                  <span className="mr-1.5 inline-block h-[7px] w-[7px] rounded-full bg-teal shadow-[0_0_0_3px_var(--color-teal-dim)]" />
                  Operational
                </dd>
              </div>
            </dl>
          </div>
          <Disclaimer />
        </div>
      </aside>

      {/* Below md the sidebar becomes a scrollable pill row. Radar's top bar
          already owns the only Menu toggle, so this needs no second one. */}
      <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === ROUTES.affordai.overview}
            className={({ isActive }) => pillClass(isActive)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  </AffordStoreProvider>
)
