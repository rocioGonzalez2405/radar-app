import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { ROUTES } from "@/app/routes";

const NAV_ITEMS = [
  { to: ROUTES.radar.triage, label: "Triage" },
  { to: ROUTES.radar.forecast, label: "Forecast" },
  { to: ROUTES.radar.capacity, label: "Capacity" },
  { to: ROUTES.radar.simulator, label: "Investment" },
  { to: ROUTES.radar.sources, label: "Sources" },
  { to: ROUTES.affordai.overview, label: "AffordAI" },
];

const DATA_VERIFIED_THROUGH = "August 2026";

const navLinkClass = (isActive: boolean) =>
  `text-sm font-medium border-b-2 pb-1 ${
    isActive
      ? "text-text-hi border-coral"
      : "text-text-mid border-transparent hover:text-text-hi"
  }`;

export const AppShell = () => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-0 pb-16">
      <header className="sticky top-0 z-50 border-b border-line bg-ink-1">
        <div className="flex items-center justify-between px-8 py-4 max-md:px-4">
          <NavLink to={ROUTES.radar.triage} className="flex items-center gap-3">
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-coral to-amber font-mono text-[13px] font-bold text-[#1a0f0a]">
              R
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">Radar</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-text-low">
                Downtown · Women's Homelessness Console
              </div>
            </div>
          </NavLink>

          <nav className="hidden gap-6 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.radar.triage}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3.5">
            <span className="hidden whitespace-nowrap font-mono text-[11px] text-text-low xl:inline-flex xl:items-center">
              <span className="mr-1.5 inline-block h-[7px] w-[7px] flex-shrink-0 rounded-full bg-teal shadow-[0_0_0_3px_var(--color-teal-dim)]" />
              live
            </span>
            <span className="hidden whitespace-nowrap font-mono text-[11px] text-text-low xl:inline-flex xl:items-center">
              <span className="mr-1.5 inline-block h-[7px] w-[7px] flex-shrink-0 rounded-full bg-amber shadow-[0_0_0_3px_var(--color-amber-dim)]" />
              Data verified through {DATA_VERIFIED_THROUGH}
            </span>
            <NavLink
              to={ROUTES.portal}
              className="whitespace-nowrap rounded-full bg-coral px-4 py-1.5 text-sm font-semibold text-[#1a0f0a] hover:bg-coral/90"
            >
              Start a project
            </NavLink>
            <button
              type="button"
              className="rounded-md border border-line px-2.5 py-1.5 text-sm text-text-hi lg:hidden"
              onClick={() => setNavOpen((open) => !open)}
            >
              Menu
            </button>
          </div>
        </div>

        {navOpen && (
          <nav className="flex flex-col gap-4 border-b border-line bg-ink-1 px-4 pb-4 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === ROUTES.radar.triage}
                className={({ isActive }) => navLinkClass(isActive)}
                onClick={() => setNavOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-text-low">
              <span className="inline-block h-[7px] w-[7px] flex-shrink-0 rounded-full bg-amber shadow-[0_0_0_3px_var(--color-amber-dim)]" />
              Data verified through {DATA_VERIFIED_THROUGH}
            </span>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1360px] px-8 py-7 max-md:px-4">
        <Outlet />
      </main>
    </div>
  );
};
