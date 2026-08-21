# AffordAI — AI-Powered Dynamic Subsidy Console

Design document. Written 2026-08-21. Branch `feat/affordai-subsidy-console`.

## 1. Purpose

Add a second product to the `radar-web` repository: **AffordAI**, an
affordability and subsidy intelligence console for government program
managers, nonprofits, and social-impact administrators.

The console answers one question on open: *where is financial vulnerability
increasing, who needs help, and what should we do about it?*

The domain model is:

> historical data + socioeconomic signals + spending patterns → ML
> affordability assessment → recommended subsidy → measurable intervention

This is a hackathon prototype. The demo experience is the deliverable; there
is no backend.

## 2. Scope decisions

Four decisions were settled before design and constrain everything below.

| Decision | Choice | Consequence |
| --- | --- | --- |
| Relationship to Radar | Separate product, same repository | Radar keeps `/` and its top-bar shell untouched. AffordAI owns `/affordai/*` and a sidebar shell. |
| Breadth | All 9 sidebar sections, staged depth | No dead navigation links. Six screens go deep, four stay deliberately simple. |
| Visual system | Shared — same theme, same UI | Zero new design tokens. `shared/ui` is reused as-is. |
| Persistence | None | Approvals live in memory for the duration of the session. |

### Non-goals

Explicitly out of scope, matching the precedent Radar already set and
documented in its README:

- API client, authentication, tests
- Persistence of approvals across reloads
- A real geographic map library — the geographic view is a panel of areas,
  not Leaflet or Mapbox
- Light theme, theme toggle, or any new color tokens

## 3. Visual system

AffordAI reuses the tokens defined in `src/index.css`. No new tokens are
added. Radar's signal colors carry AffordAI's semantics:

| Token | AffordAI meaning |
| --- | --- |
| `teal` | Stable |
| `amber` | Emerging vulnerability |
| `coral` | High risk |
| `blue` | Projected values, neutral emphasis |
| `ink-0` / `ink-1` / `ink-2` | Page, card, and raised surfaces |
| `line` / `line-soft` | Borders |
| `text-hi` / `text-mid` / `text-low` | Text hierarchy |

### Component reuse

Reused unchanged from `src/shared/ui/`:

- `Card`, `SectionHead`, `Legend`, `Footnote` — token-neutral
- `Kpi` — tones `danger` / `warn` / `ok` / `neutral` map onto High risk /
  Emerging / Stable / Projected
- `Badge` — tones `crit` / `high` / `mod` map onto High risk / Emerging /
  Stable

**Not reused:** `src/shared/charts/RadarCharts.tsx`. Its wrappers hard-code
Radar's domain in their `dataKey` values (`criticalCases`, `bedCapacity`) and
its chart shapes do not match AffordAI's. AffordAI gets its own chart module
that copies the grid, tick, and tooltip constants verbatim so both products
render identically.

## 4. Structure

```
src/
├── app/
│   ├── routes.ts                 ROUTES.radar.* + ROUTES.affordai.*
│   └── AppRoutes.tsx             two shell subtrees
├── layouts/AppShell/             Radar — untouched except one nav link
├── pages/                        Radar — untouched
├── affordai/
│   ├── layout/
│   │   └── AffordShell.tsx       sidebar, AI Model Status, disclaimer
│   ├── pages/
│   │   ├── Overview/
│   │   ├── Households/
│   │   ├── HouseholdDetail/
│   │   ├── Vulnerability/
│   │   ├── Subsidies/
│   │   ├── MarketPrices/
│   │   ├── Predictions/
│   │   ├── Impact/
│   │   ├── DataSources/
│   │   └── Settings/
│   ├── components/
│   ├── charts/AffordCharts.tsx
│   ├── state/AffordStore.tsx
│   └── data/
└── shared/ui/                    reused by both products
```

### Routes

| Path | Page |
| --- | --- |
| `/affordai` | Overview |
| `/affordai/households` | Households |
| `/affordai/households/:householdId` | Household detail |
| `/affordai/vulnerability` | Vulnerability |
| `/affordai/subsidies` | Subsidies |
| `/affordai/market-prices` | Market Prices |
| `/affordai/predictions` | Predictions |
| `/affordai/impact` | Impact |
| `/affordai/data-sources` | Data Sources |
| `/affordai/settings` | Settings |

`ROUTES` in `src/app/routes.ts` is restructured into two namespaces. Existing
Radar paths keep their current values, so no Radar URL changes.

Cross-navigation: Radar's top bar gains one link to `/affordai`. AffordAI's
sidebar footer gains one link back to `/`.

## 5. Data layer

`src/affordai/data/`. All values are synthetic. The layer is the single place
a real backend would later be wired in, matching Radar's precedent.

### `seed.ts`

A deterministic PRNG (mulberry32) with a fixed seed. `Math.random` is not
used anywhere in the data layer. Consequence: the console renders identical
numbers on every reload, so a reviewer reloading mid-demo sees no drift.

### `households.ts`

Generates 12,482 household records at module load.

```ts
interface Household {
  id: number                  // 10000..22481
  size: number                // 1..7
  monthlyIncome: number
  monthlyRent: number
  employmentStability: 'High' | 'Medium' | 'Low'
  area: AreaId
  currentSubsidy: number      // percent
  recommendedSubsidy: number  // percent
  affordabilityScore: number  // 0..100
  rentBurden: number          // rent / income
  tier: 'stable' | 'emerging' | 'high-risk'
  riskProbability: number     // 0..1, 90-day horizon
  history: HouseholdYear[]    // 2024, 2025, 2026
}

interface HouseholdYear {
  year: number
  income: number
  rent: number
  affordabilityScore: number
}
```

**Tier calibration.** Tier thresholds are tuned so the derived counts land on
the brief's figures: 1,846 households in `emerging` or `high-risk`, of which
623 are `high-risk`. The KPI values are therefore computed from the
population by `selectors.ts`, not hard-coded. A unit-free calibration
constant at the top of the module documents the tuning so the numbers can be
re-derived if the generator changes.

### `heroes.ts`

Hand-authored records for the households the demo walks through, injected
into the generated population by id so search and filters find them.

Household #10482 carries the brief's exact figures: size 4, income $4,200,
rent $1,850, employment stability Medium, area Eastside, current subsidy 18%,
recommended subsidy 27%, affordability score 57, risk probability 0.82, and
the 2024/2025/2026 history (income $4,600 → $4,400 → $4,200; rent $1,500 →
$1,700 → $1,850; score 78 → 69 → 57).

Rationale: generated data will not land on the narrative beats. The beats are
authored; the population around them is generated.

### `areas.ts`

Four areas — Downtown, Eastside, North County, South County — each with
households monitored, vulnerability rate, average income, average rent
burden, average subsidy, and trend. Aggregates are derived from the
population, not written by hand.

### `factors.ts`

Contribution weights for the risk model, per household tier and for the hero
household: rent burden 34%, income decline 27%, food inflation 19%, household
size 12%, employment instability 8%. Weights sum to 100.

### `recommendations.ts`

AI recommendations, each shaped for the explainability contract:

```ts
interface Recommendation {
  id: string
  title: string
  areaId: AreaId
  impactPotential: 'High' | 'Medium' | 'Low'
  whatHappened: string
  whyItMatters: string
  modelPrediction: string
  recommendedAction: string
  drivers: { label: string; delta: string }[]
  subsidyFrom: number
  subsidyTo: number
}
```

Includes the brief's Eastside food-subsidy recommendation (18% → 25%, driven
by food prices +9.2%, median income −4.1%, rent burden +6.8%).

### `products.ts`

Product categories with market price, current subsidized price, and
recommended subsidized price. Includes Milk $4.50/$3.70/$3.20, Eggs
$6.20/$5.10/$4.40, Rice $8.00/$6.60/$5.80.

### `forecast.ts`

Historical vulnerability series plus a 90-day projection: 1,846 current →
2,213 projected (+19.9%), confidence 84%, with the predicted drivers
(housing costs, food inflation, income volatility, employment changes).

### `impact.ts`

Program-effectiveness figures: households stabilized, average subsidy per
household, reduction in vulnerability, cost per successful intervention, and
the hero metric — 412 households prevented from entering high-risk status —
with before/after pairs.

### `selectors.ts`

Pure functions over the modules above. No component reads a data module
directly; every page reads a selector.

```ts
kpis(): OverviewKpis
vulnerabilitySeries(range: TimeRange): VulnerabilityPoint[]
areaDetail(id: AreaId): AreaDetail
searchHouseholds(query: HouseholdQuery): HouseholdPage
householdById(id: number): Household | undefined
forecast90d(): Forecast
impactMetrics(): ImpactMetrics
```

`TimeRange` is `'30d' | '90d' | '6m' | '1y'`.

## 6. State

`src/affordai/state/AffordStore.tsx` — a React context provider mounted by
`AffordShell`. In-memory only.

```ts
interface AffordState {
  approvedRecommendations: string[]
  dismissedRecommendations: string[]
  approvedInterventions: { householdId: number; subsidy: number }[]
}
```

Actions: `approveRecommendation`, `dismissRecommendation`,
`approveIntervention`.

The Impact page reads `approvedInterventions` and adds them to its stabilized
count and its hero metric. This is what connects demo step 9 (approve the
intervention) to demo step 10 (show the projected impact) — without it the
narrative breaks one step before the end.

## 7. AI explainability

The product's differentiator, and a hard requirement on every screen that
surfaces a model output.

### `AiRationale`

One component, four fixed slots, used on Overview, Household detail, and
Predictions:

1. **What happened** — the observed change
2. **Why it matters** — the threshold or burden it crossed
3. **What the model predicts** — probability and horizon
4. **Recommended action** — the intervention

### `WhyThisRecommendation`

An expandable disclosure. Collapsed it reads "Why this recommendation?";
expanded it renders `FactorBars` — a horizontal contribution visualization of
the top factors influencing the model, plus a plain-language explanation.

### Language and disclaimer

Model output is always hedged: "AI recommendation", "predicted risk",
"estimated", "based on available data". Never presented as authoritative.

`AffordShell` renders the disclaimer persistently in its sidebar footer:

> AI-generated recommendations support program decisions and should be
> reviewed by authorized program administrators.

## 8. Screens

### 8.1 Shell — `AffordShell`

Left sidebar, main content area. Nine navigation items: Overview, Households,
Vulnerability, Subsidies, Market Prices, Predictions, Impact, Data Sources,
Settings.

Sidebar footer, in order: **AI Model Status** (Model: Affordability v1.4 ·
Last updated: 2 hours ago · Status: Operational), the explainability
disclaimer, a link back to Radar.

Responsive: the sidebar collapses to a toggled drawer below `md`, following
the pattern already in `AppShell`.

### 8.2 Deep screens

**Overview.** Five KPI cards with trend indicators — 12,482 households
monitored, 1,846 currently vulnerable, 623 at high risk, $184K allocated this
month, 87% intervention effectiveness. A stacked area chart of vulnerability
over time by category (Stable / Emerging / High risk) with a 30d/90d/6m/1y
range toggle. An AI insight callout. A geographic panel: four selectable
areas, the selected one revealing households monitored, vulnerability rate,
average income, average rent burden, average subsidy, and trend. A
**Recommended Interventions** section of recommendation cards, each with
`AiRationale`, `WhyThisRecommendation`, and Review / Approve / Dismiss.

**Households.** Search by id or area, filters for area, tier, and income
range, a sortable paginated table over the full population, and a row link
into the detail page. The result count is always visible so the scale of the
dataset reads immediately.

**Household detail.** Profile block (size, estimated monthly income, monthly
rent, employment stability, location, current subsidy, recommended subsidy).
A financial timeline for 2024/2025/2026 rendering income, rent, and
affordability score, with the deterioration visually obvious. An **AI
Vulnerability Assessment** card: High Risk, 82% probability of increased
financial vulnerability within 90 days, `FactorBars` for the five
contributing factors, the model's plain-language explanation, and the
recommended intervention (temporary 27% food subsidy) with an Approve action
that writes to `AffordStore`.

**Vulnerability.** The stacked area chart at full width with the range
toggle, plus breakdowns by area and by income band, and cohort counts per
tier.

**Predictions.** Titled *Financial Vulnerability Forecast*. Current
vulnerable households 1,846, projected in 90 days 2,213, +19.9%. A line chart
with the historical series solid and the projected period dashed. Prediction
confidence 84%. Main predicted drivers listed with their contribution.

**Impact.** Five KPIs — households stabilized, average subsidy per
household, reduction in vulnerability, cost per successful intervention,
estimated households prevented from entering high-risk status. The hero
metric *412 households prevented from entering high-risk status* rendered
prominently. A before/after comparison visualization.

### 8.3 Simple screens

Deliberately single-purpose. They complete the sidebar honestly rather than
pretending to depth they do not have.

**Subsidies.** Allocation table by product category and area, plus a list of
approved interventions read from `AffordStore`.

**Market Prices.** The subsidy calculator: select a household and a product
category, then a table of market price, current price, and recommended price
per product. A prominent statement that **market price remains unchanged** —
the platform sets the subsidy so qualifying households pay less. Product
category filter.

**Data Sources.** Provenance table for the input signals, a model card for
Affordability v1.4, and the explainability disclaimer.

**Settings.** Model thresholds and horizons, read-only. Labeled as read-only
so nothing looks broken.

## 9. Interactions

Functional, not decorative:

- Sidebar navigation, with the active item marked
- Time range toggle on the vulnerability chart (30d / 90d / 6m / 1y)
- Geographic area selection with drill-down metrics
- Household search, filters, sort, and pagination
- Household detail navigation
- Approve / dismiss on recommendations, with state reflected on Subsidies and
  Impact
- The subsidy calculator
- Chart hover states via Recharts tooltips
- Expandable AI explanations
- Product category filters

## 10. Testing

The repository has no test infrastructure and adding it is out of scope, per
Radar's precedent. Verification for this work is:

1. `npm run typecheck` passes
2. `npm run build` passes
3. Every one of the ten routes renders without a console error
4. The ten-step demo flow completes end to end: open Overview → see
   vulnerability rising → select Eastside → open household #10482 → see the
   financial deterioration → see the AI prediction → expand why the model
   flagged it → see the recommended subsidy → approve → see the number move
   on Impact

Step 4 is the acceptance criterion that matters. Each of the other three is
necessary but proves nothing about the demo.

## 11. Risks

| Risk | Mitigation |
| --- | --- |
| Generating 12,482 records with history at module load costs startup time | Records are flat and generated once; history is three points each. Measured against the dev server before proceeding past the data layer. |
| Tier calibration drifts from the brief's KPI figures | Calibration constants live at the top of `households.ts` with the target counts written next to them, and `selectors.kpis()` derives from the population so drift is visible immediately. |
| Two products in one repository confuse the demo | Distinct shells, distinct route namespaces, and one explicit cross-link in each direction. |
| The four simple screens read as unfinished | Each does one thing completely. Settings is labeled read-only rather than shipping dead inputs. |
