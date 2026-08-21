# radar-web

Downtown women's homelessness prevention console — hackathon prototype.

## What this is

A forecasting and decision-support tool for the "Downtown Homelessness"
challenge, focused on the women's sector: a trend forecast, a capacity-gap
breakdown by subgroup, a case-level triage ranking, and a what-if budget
simulator, built as a real single-page app rather than a static dashboard.

## Requirements

- Node `^20.19.0 || >=22.12.0`
- npm

## Quick start

```bash
npm install
npm run dev
```

Vite prints a local URL — open it and you should see the Triage page.

## Other commands

| Command             | What it does                                                  |
| -------------------- | -------------------------------------------------------------- |
| `npm run build`      | Type-checks the project and produces a production bundle in `dist/` |
| `npm run preview`    | Serves the production bundle locally                            |
| `npm run typecheck`  | Runs the TypeScript compiler without emitting output            |

## Stack

| Technology       | Why it's here                                                              |
| ----------------- | --------------------------------------------------------------------------- |
| React 19          | UI layer                                                                     |
| TypeScript        | Strict by default, mistakes surface at build time                           |
| Vite              | Dev server + build, resolves the `@/` path alias                            |
| Tailwind CSS v4   | Utility-first styling, tokens live in `src/index.css` — no config file      |
| React Router      | Client-side routing between the five pages                                  |
| Recharts          | Chart primitives (area, bar, line) used across the console                  |

## Project layout

```
src/
├── App.tsx                    app shell, mounts the router
├── main.tsx                   entry point
├── index.css                  Tailwind entry point + design tokens
├── app/
│   ├── routes.ts               route path constants
│   └── AppRoutes.tsx            route table
├── layouts/AppShell/            top bar, nav, page frame (React Router Outlet)
├── pages/
│   ├── Triage/                  home — case-level urgency ranking
│   ├── Forecast/                 trend + leading indicators
│   ├── Capacity/                  subgroup demand vs. capacity
│   ├── Simulator/                  interactive what-if budget tool
│   └── Sources/                    data provenance — public vs. protected
└── shared/
    ├── ui/                       Kpi, Card, Badge, Legend, Footnote
    ├── charts/                    Recharts wrappers themed to the console
    └── data/radarData.ts          synthetic dataset standing in for a real API
```

## Data

All numbers in `shared/data/radarData.ts` are synthetic, modeled on
plausible distributions from public sources (HUD PIT Count/AHAR, Eviction
Lab, ACS). See the in-app **Sources** page for which indicators are public
vs. protected in a real deployment, and what it would take to wire this up
to a real Continuum of Care's HMIS export.

## Not included yet

A real API client, authentication, and tests. Each was left out on purpose
for a hackathon prototype — the data module (`radarData.ts`) is the single
place to swap in a real backend later.
