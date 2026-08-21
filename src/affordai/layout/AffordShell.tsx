import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { ROUTES } from '@/app/routes'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { NAV_ITEMS } from '@/affordai/layout/navItems'

const navLinkClass = (isActive: boolean) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-ink-2 text-text-hi'
      : 'text-text-mid hover:bg-ink-2/60 hover:text-text-hi'
  }`

export const AffordShell = () => {
  const [navOpen, setNavOpen] = useState(false)

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === ROUTES.affordai.overview}
          className={({ isActive }) => navLinkClass(isActive)}
          onClick={() => setNavOpen(false)}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-ink-0 md:flex">
      <aside className="hidden w-[248px] flex-shrink-0 flex-col justify-between border-r border-line bg-ink-1 px-4 py-5 md:flex md:min-h-screen">
        <div>
          <NavLink to={ROUTES.affordai.overview} className="mb-7 flex items-center gap-3">
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue to-teal font-mono text-[13px] font-bold text-[#08131f]">
              A
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">AffordAI</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-text-low">
                Subsidy Intelligence
              </div>
            </div>
          </NavLink>
          {nav}
        </div>

        <div className="mt-8 flex flex-col gap-3">
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
                <dt>Last updated</dt>
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

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-ink-1 px-4 py-3 md:hidden">
          <span className="text-sm font-semibold">AffordAI</span>
          <button
            type="button"
            className="rounded-md border border-line px-2.5 py-1.5 text-sm text-text-hi"
            onClick={() => setNavOpen((open) => !open)}
          >
            Menu
          </button>
        </header>

        {navOpen && (
          <div className="border-b border-line bg-ink-1 px-4 pb-4 md:hidden">{nav}</div>
        )}

        <main className="mx-auto max-w-[1360px] px-8 py-7 max-md:px-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
