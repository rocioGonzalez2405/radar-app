# radar-web

Three hackathon prototypes in one single-page app.

| Product | Route | What it is |
| --- | --- | --- |
| **Radar** | `/` | Downtown women's homelessness prevention console — trend forecast, capacity gaps by subgroup, case-level triage, regional investment outcomes. |
| **Impact Portal** | `/portal`, `/projects` | Project browse, creation, volunteer signup, and legal-aid intake. `/portal` is the admin view inside Radar's shell; `/projects` is the same data in a public-facing frame. |
| **AffordAI** | `/affordai` | AI-powered affordability and subsidy intelligence — household vulnerability, a risk model, and a separate subsidy rules engine. |

AffordAI is reached from Radar's top bar and renders inside the same shell, so
the top bar stays visible and marks it as the active section. It contributes its
own sidebar for its nine sections; it is a section of the console, not a second
application.

## Requirements

- Node `^20.19.0 || >=22.12.0`
- npm

## Quick start

```bash
npm install
npm run dev
```

Vite prints a local URL. It opens on Radar's Triage page; **AffordAI** is the
last item in the top bar.

## Other commands

| Command             | What it does                                                  |
| -------------------- | -------------------------------------------------------------- |
| `npm test`           | Runs the AffordAI data-layer and model tests (Vitest)           |
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
| React Router      | Client-side routing across both products                                    |
| Recharts          | Chart primitives (area, bar, line) used across both consoles                |
| Vitest            | Tests for the AffordAI data layer and risk model                            |

## Project layout

```
src/
├── main.tsx                   entry point
├── index.css                  Tailwind entry point + design tokens
├── app/
│   ├── routes.ts               ROUTES.radar.* and ROUTES.affordai.*
│   └── AppRoutes.tsx            route table — AffordAI nests inside AppShell
├── layouts/AppShell/            Radar's top bar and page frame
├── pages/                       Radar: Triage, Forecast, Capacity, Simulator
│                                (labelled "Investment"), Sources
│   └── Portal/                  Impact Portal — project browse, create,
│                                volunteer signup, legal-aid intake
├── layouts/PublicPortalShell/   public-facing frame for /projects
├── affordai/
│   ├── layout/                  section sidebar, AI model status, provenance line
│   ├── pages/                   Overview, Households, HouseholdDetail,
│   │                            Vulnerability, Subsidies, MarketPrices,
│   │                            Predictions, Impact, DataSources, Settings
│   ├── components/              AiRationale, FactorBars, GeoPanel, …
│   ├── charts/                  Recharts wrappers for this section
│   ├── state/                   in-memory approval store
│   ├── data/                    dataset, provenance registry, selectors
│   └── model/                   features → risk model → subsidy engine
└── shared/
    ├── ui/                      Kpi, Card, Badge, Legend, Footnote — used by both
    ├── charts/                  Radar's chart wrappers
    └── data/radarData.ts        Radar's dataset
```

`shared/ui` is used by both products. `shared/charts` is Radar-only: its
wrappers have no counterpart for AffordAI's chart shapes, so that section has
its own module which copies the grid, tick, and tooltip constants verbatim so
both render identically.

No page imports a data module directly. Every page reads
`affordai/data/selectors.ts`, which is the single place a real backend would be
wired in.

## Data and provenance

Neither product invents a number without saying so.

**Radar** draws on verified public San Diego sources — RTFH, the Downtown San
Diego Partnership, California Housing Partnership, California EDD,
accountability.ca.gov, and the California State Auditor. Its case-level triage
rows remain simulated, because individual HMIS records are protected; the real
211 San Diego study backing that model is cited in the data module. The **Sources**
page carries per-source dates and public/protected status.

**AffordAI** classifies every figure into one of three tiers, visible wherever
the figure appears:

| Tier | Meaning |
| --- | --- |
| `verified` | Retrieved first-hand from the named public source. |
| `reported` | Real, named source that could not be retrieved from this environment — BLS and FRED refuse automated requests. Cited, and marked as not independently retrieved. |
| `simulated` | No public source exists, because the records are protected or the program is hypothetical. |

The 12,482-household population is `simulated` and labelled as such: no public
aggregate of individual household income exists, and no program caseload roster
is public. The county-level anchors — average asking rent, the cost-burden
distribution by income band — are `verified` from the California Housing
Partnership's 2026 report. The **Data Sources** page lists all of it.

## The model

`affordai/model/` deliberately keeps two things apart:

- **`riskModel.ts`** — a logistic model over eight features. Because it is
  linear, the Shapley value is exactly `coefficient × (feature − baseline)`, so
  the factor contributions shown in the UI are the model's own arithmetic rather
  than a hand-written table.
- **`subsidyEngine.ts`** — a configurable rules engine mapping risk to a
  percentage band, then modulating by the household's actual monthly shortfall
  and smoothing changes across cycles.

Separating them means the support can be explained, no prediction alone controls
a benefit, and the policy can change without touching the model.

Two things the **Settings** page states rather than hides:

- The coefficients are **hand-set, not fitted**. There is no ground truth to fit
  against, because the population is synthetic.
- The 90-day horizon is a **declared interpretation, not a fitted parameter**.
  The model has no time term; setting the horizon to 30 leaves every probability
  bit-identical. What justifies the label is the input window — six- and
  twelve-month trends — not the arithmetic.

`areaPressure` carries the smallest weight of the eight, deliberately: area is a
proxy for social characteristics, and a large weight there would launder that
proxy into a funding decision. `householdSize` was **removed** from the model for
the same reason and kept as audit-only — with a standalone size term, no
one-or-two-person household could reach the top support band at any income or
rent burden. Its real economic content is still fully modelled, through the
essentials burden.

## Not included yet

No API client, no authentication, no component tests, and no persistence —
AffordAI's approvals live in memory and reset on reload. The geographic view is
a panel of areas, not a map library. Tests cover the data layer and the model
only.

Two gaps worth naming rather than discovering later:

- **No fairness measurement.** The household-size problem above was caught by
  reading a list, not by a metric. A group-metrics view would have flagged it
  immediately.
- **Vulnerability is never formally defined.** The model outputs a probability
  of an event that no document in this repository specifies.
