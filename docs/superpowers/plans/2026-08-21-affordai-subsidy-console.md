# AffordAI Subsidy Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AffordAI — an AI-powered affordability and subsidy intelligence console with nine sections — as a second product inside the existing `radar-web` repository, without changing Radar.

**Architecture:** A single `src/affordai/` module owns its sidebar shell, ten pages, components, charts, in-memory store, and a deterministic synthetic data layer of 12,482 households. Radar keeps `/` and its top-bar shell. Both products share the design tokens in `src/index.css` and the token-neutral primitives in `src/shared/ui/`. Every page reads a pure selector, never a data module directly.

**Tech Stack:** React 19, TypeScript (strict), Vite 8, Tailwind CSS v4 (tokens in `src/index.css`, no config file), React Router 8, Recharts 2, Vitest 4 (data layer only).

**Spec:** `docs/superpowers/specs/2026-08-21-affordai-subsidy-console-design.md`

## Global Constraints

- Node `^20.19.0 || >=22.12.0`.
- **No new design tokens.** Use only the tokens already in `src/index.css`. Semantics: `teal` = Stable, `amber` = Emerging vulnerability, `coral` = High risk, `blue` = Projected/neutral.
- **Do not modify** `src/pages/**`, `src/shared/ui/**`, `src/shared/charts/**`, `src/shared/data/**`, or `src/index.css`. The only Radar file this plan touches is `src/layouts/AppShell/AppShell.tsx`, and only in Task 19, to add one cross-link.
- **No `Math.random` anywhere in `src/affordai/`.** All randomness comes from `createRng` in `src/affordai/data/seed.ts`. The console must render identical numbers on every reload.
- Import via the `@/` alias (`@/affordai/...`). `vite.config.ts` reads `paths` from `tsconfig.app.json` — do not add `resolve.alias`.
- All artifacts — identifiers, comments, UI copy, docs, commit messages — in English.
- Conventional commits. Never add `Co-Authored-By` or any AI attribution.
- `verbatimModuleSyntax` is on: type-only imports must use `import type`.
- `noUnusedLocals` and `noUnusedParameters` are on: unused variables fail the typecheck.
- Tests are for the data layer only. No component tests, no jsdom, no test-only dependencies beyond Vitest.
- Copy strings quoted in this plan are exact. Do not paraphrase user-facing text.

## Verification Commands

| Command | When |
| --- | --- |
| `npm test -- --run` | After every data-layer task |
| `npm run typecheck` | After every task |
| `npm run build` | Tasks 19 only, plus any time a task fails typecheck for an unclear reason |
| Browser check at `http://localhost:5175/affordai` (`npm run dev` prints the port) | After every UI task |

## File Structure

**Data layer** — `src/affordai/data/`

| File | Responsibility |
| --- | --- |
| `types.ts` | Every shared type in the module. No logic. |
| `seed.ts` | `createRng` (mulberry32) plus `pick`, `intBetween`, `floatBetween`, `roundTo`. |
| `households.ts` | Generates the 12,482-household population; assigns tiers by percentile cut; exports the derived tier thresholds. |
| `heroes.ts` | Hand-authored demo households, injected into the population by id. |
| `areas.ts` | The four area definitions and area-level generation parameters. |
| `factors.ts` | Risk-factor contribution weights. |
| `recommendations.ts` | Area-level AI recommendations. |
| `products.ts` | Product categories with market / current / recommended prices. |
| `forecast.ts` | Historical vulnerability series plus the 90-day projection. |
| `impact.ts` | Program-effectiveness figures and before/after pairs. |
| `selectors.ts` | Pure read functions. The only data module pages import. |

**Shell, state, charts** — `src/affordai/`

| File | Responsibility |
| --- | --- |
| `layout/AffordShell.tsx` | Sidebar, nav, AI Model Status, disclaimer, `<Outlet />`, mounts the store. |
| `layout/navItems.ts` | The sidebar nav list. Grows one entry per page task. |
| `state/AffordStore.tsx` | Context provider + `useAffordStore` hook. In-memory approvals. |
| `charts/AffordCharts.tsx` | Recharts wrappers. Copies Radar's grid/tick/tooltip constants verbatim. |

**Components** — `src/affordai/components/`

| File | Responsibility |
| --- | --- |
| `AiRationale.tsx` | The four-slot explainability block. |
| `FactorBars.tsx` | Horizontal contribution visualization. |
| `WhyThisRecommendation.tsx` | Expandable disclosure wrapping `FactorBars`. |
| `RangeToggle.tsx` | 30d / 90d / 6m / 1y segmented control. |
| `GeoPanel.tsx` | Area selector plus the selected area's drill-down metrics. |
| `RecommendationCard.tsx` | One recommendation with Review / Approve / Dismiss. |
| `Disclaimer.tsx` | The reviewed-by-administrators disclaimer text. |
| `MetricRow.tsx` | Label/value rows used by the profile and detail panels. |

**Pages** — `src/affordai/pages/<Name>/<Name>Page.tsx`, one directory each: `Overview`, `Households`, `HouseholdDetail`, `Vulnerability`, `Subsidies`, `MarketPrices`, `Predictions`, `Impact`, `DataSources`, `Settings`.

---

### Task 1: Test harness, shared types, seeded PRNG

**Files:**
- Modify: `package.json` (add `vitest` devDependency and a `test` script)
- Modify: `vite.config.ts:1-9`
- Create: `src/affordai/data/types.ts`
- Create: `src/affordai/data/seed.ts`
- Test: `src/affordai/data/seed.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `createRng(seed: number): () => number`, `pick<T>(rng: () => number, items: readonly T[]): T`, `intBetween(rng: () => number, min: number, max: number): number`, `floatBetween(rng: () => number, min: number, max: number): number`, `roundTo(value: number, step: number): number`. All types listed in `types.ts` below.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest@^4.1.11
```

- [ ] **Step 2: Add the test script**

In `package.json`, add to `scripts`:

```json
"test": "vitest"
```

- [ ] **Step 3: Configure Vitest**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Reads "paths" from tsconfig.app.json. Do not add resolve.alias.
  resolve: { tsconfigPaths: true },
  test: {
    // Data-layer tests only — no DOM environment is needed.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Write the failing test**

Create `src/affordai/data/seed.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createRng, floatBetween, intBetween, pick, roundTo } from '@/affordai/data/seed'

describe('createRng', () => {
  it('returns values in [0, 1)', () => {
    const rng = createRng(1)
    for (let i = 0; i < 500; i += 1) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('is deterministic for a given seed', () => {
    const first = Array.from({ length: 20 }, createRng(42))
    const second = Array.from({ length: 20 }, createRng(42))
    expect(first).toEqual(second)
  })

  it('diverges for different seeds', () => {
    expect(createRng(1)()).not.toEqual(createRng(2)())
  })
})

describe('helpers', () => {
  it('intBetween stays inside the inclusive bounds', () => {
    const rng = createRng(7)
    for (let i = 0; i < 200; i += 1) {
      const value = intBetween(rng, 3, 9)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(9)
    }
  })

  it('floatBetween stays inside the bounds', () => {
    const rng = createRng(8)
    for (let i = 0; i < 200; i += 1) {
      const value = floatBetween(rng, 0.3, 0.7)
      expect(value).toBeGreaterThanOrEqual(0.3)
      expect(value).toBeLessThan(0.7)
    }
  })

  it('pick returns a member of the list', () => {
    const rng = createRng(9)
    const items = ['a', 'b', 'c'] as const
    for (let i = 0; i < 50; i += 1) {
      expect(items).toContain(pick(rng, items))
    }
  })

  it('roundTo snaps to the step', () => {
    expect(roundTo(4237, 50)).toBe(4250)
    expect(roundTo(4212, 50)).toBe(4200)
    expect(roundTo(0.8431, 0.001)).toBeCloseTo(0.843, 5)
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test -- --run src/affordai/data/seed.test.ts`
Expected: FAIL — cannot resolve `@/affordai/data/seed`.

- [ ] **Step 6: Write the types module**

Create `src/affordai/data/types.ts`:

```ts
export type AreaId = 'downtown' | 'eastside' | 'north-county' | 'south-county'

export type Tier = 'stable' | 'emerging' | 'high-risk'

export type EmploymentStability = 'High' | 'Medium' | 'Low'

export type TimeRange = '30d' | '90d' | '6m' | '1y'

export interface HouseholdYear {
  year: number
  income: number
  rent: number
  affordabilityScore: number
}

export interface Household {
  id: number
  size: number
  monthlyIncome: number
  monthlyRent: number
  employmentStability: EmploymentStability
  area: AreaId
  currentSubsidy: number
  recommendedSubsidy: number
  affordabilityScore: number
  rentBurden: number
  tier: Tier
  riskProbability: number
  history: HouseholdYear[]
}

export interface Area {
  id: AreaId
  label: string
  incomeMedian: number
  burdenRange: [number, number]
  incomeTrend: number
  share: number
}

export interface AreaDetail {
  id: AreaId
  label: string
  householdsMonitored: number
  vulnerabilityRate: number
  averageIncome: number
  averageRentBurden: number
  averageSubsidy: number
  trend: number
}

export interface RiskFactor {
  label: string
  contribution: number
}

export interface OverviewKpis {
  householdsMonitored: number
  currentlyVulnerable: number
  highRisk: number
  subsidiesAllocated: number
  interventionEffectiveness: number
  deltas: {
    householdsMonitored: number
    currentlyVulnerable: number
    highRisk: number
    subsidiesAllocated: number
    interventionEffectiveness: number
  }
}

export interface VulnerabilityPoint {
  label: string
  stable: number
  emerging: number
  highRisk: number
}

export interface Recommendation {
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
  factors: RiskFactor[]
}

export interface Product {
  id: string
  label: string
  category: ProductCategory
  marketPrice: number
  currentPrice: number
  recommendedPrice: number
}

export type ProductCategory = 'Dairy' | 'Protein' | 'Grains' | 'Produce'

export interface ForecastPoint {
  label: string
  historical: number | null
  projected: number | null
}

export interface Forecast {
  current: number
  projected: number
  changePercent: number
  confidence: number
  series: ForecastPoint[]
  drivers: RiskFactor[]
}

export interface ImpactMetrics {
  householdsStabilized: number
  averageSubsidyPerHousehold: number
  vulnerabilityReduction: number
  costPerSuccessfulIntervention: number
  preventedFromHighRisk: number
  beforeAfter: { label: string; before: number; after: number }[]
}

export interface HouseholdQuery {
  search: string
  area: AreaId | 'all'
  tier: Tier | 'all'
  incomeBand: 'all' | 'under-3000' | '3000-5000' | '5000-7000' | 'over-7000'
  sortBy: 'id' | 'affordabilityScore' | 'rentBurden' | 'monthlyIncome'
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export interface HouseholdPage {
  rows: Household[]
  total: number
  page: number
  pageCount: number
}

export interface TierThresholds
{
  highRiskBelow: number
  emergingBelow: number
}
```

- [ ] **Step 7: Write the seed module**

Create `src/affordai/data/seed.ts`:

```ts
/**
 * Deterministic randomness for the AffordAI synthetic dataset.
 *
 * The console must render identical numbers on every reload — a reviewer who
 * refreshes mid-demo should see no drift — so `Math.random` is never used
 * anywhere under `src/affordai/`.
 */

/** mulberry32. Small, fast, and stable across engines. */
export const createRng = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const floatBetween = (rng: () => number, min: number, max: number) =>
  min + rng() * (max - min)

export const intBetween = (rng: () => number, min: number, max: number) =>
  Math.floor(min + rng() * (max - min + 1))

export const pick = <T,>(rng: () => number, items: readonly T[]): T =>
  items[Math.floor(rng() * items.length)]

export const roundTo = (value: number, step: number) =>
  Math.round(value / step) * step
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test -- --run src/affordai/data/seed.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 9: Typecheck**

Run: `npm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/affordai/data/types.ts src/affordai/data/seed.ts src/affordai/data/seed.test.ts
git commit -m "feat(affordai): add data-layer test harness, shared types, and seeded rng"
```

---

### Task 2: Household population generator

**Files:**
- Create: `src/affordai/data/areas.ts`
- Create: `src/affordai/data/households.ts`
- Test: `src/affordai/data/households.test.ts`

**Interfaces:**
- Consumes: `createRng`, `floatBetween`, `intBetween`, `pick`, `roundTo` from `@/affordai/data/seed`; `Area`, `AreaId`, `Household`, `HouseholdYear`, `Tier`, `TierThresholds` from `@/affordai/data/types`.
- Produces:
  - `AREAS: readonly Area[]` and `areaById(id: AreaId): Area` from `areas.ts`
  - `HOUSEHOLD_COUNT = 12482`, `FIRST_HOUSEHOLD_ID = 10000`, `TARGET_VULNERABLE = 1846`, `TARGET_HIGH_RISK = 623`, `households: Household[]`, `tierThresholds: TierThresholds` from `households.ts`

**Design note.** Tiers are assigned by a **percentile cut**, not by hand-tuned score thresholds: the 623 lowest affordability scores become `high-risk`, the next 1,223 become `emerging`, the rest `stable`. This hits the brief's figures exactly, stays deterministic, and is how a program with fixed intervention capacity actually defines tiers. The score boundaries that fall out of the cut are exported as `tierThresholds` and are what the Settings page displays (Task 18).

- [ ] **Step 1: Write the failing test**

Create `src/affordai/data/households.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  FIRST_HOUSEHOLD_ID,
  HOUSEHOLD_COUNT,
  TARGET_HIGH_RISK,
  TARGET_VULNERABLE,
  households,
  tierThresholds,
} from '@/affordai/data/households'
import { AREAS } from '@/affordai/data/areas'

describe('household population', () => {
  it('generates exactly the monitored count from the brief', () => {
    expect(HOUSEHOLD_COUNT).toBe(12482)
    expect(households).toHaveLength(12482)
  })

  it('assigns unique sequential ids', () => {
    expect(households[0].id).toBe(FIRST_HOUSEHOLD_ID)
    expect(new Set(households.map((h) => h.id)).size).toBe(HOUSEHOLD_COUNT)
  })

  it('lands on the brief tier counts via the percentile cut', () => {
    const highRisk = households.filter((h) => h.tier === 'high-risk')
    const emerging = households.filter((h) => h.tier === 'emerging')
    expect(highRisk).toHaveLength(TARGET_HIGH_RISK)
    expect(highRisk.length + emerging.length).toBe(TARGET_VULNERABLE)
  })

  it('orders the derived tier thresholds', () => {
    expect(tierThresholds.highRiskBelow).toBeLessThan(tierThresholds.emergingBelow)
  })

  it('places every household in a known area', () => {
    const ids = new Set(AREAS.map((a) => a.id))
    expect(households.every((h) => ids.has(h.area))).toBe(true)
  })

  it('gives every household three years of history ending in 2026', () => {
    for (const household of households.slice(0, 200)) {
      expect(household.history.map((y) => y.year)).toEqual([2024, 2025, 2026])
      expect(household.history[2].income).toBe(household.monthlyIncome)
      expect(household.history[2].rent).toBe(household.monthlyRent)
      expect(household.history[2].affordabilityScore).toBe(household.affordabilityScore)
    }
  })

  it('keeps every derived value inside a plausible range', () => {
    for (const household of households) {
      expect(household.size).toBeGreaterThanOrEqual(1)
      expect(household.size).toBeLessThanOrEqual(7)
      expect(household.monthlyIncome).toBeGreaterThan(0)
      expect(household.affordabilityScore).toBeGreaterThanOrEqual(0)
      expect(household.affordabilityScore).toBeLessThanOrEqual(100)
      expect(household.riskProbability).toBeGreaterThanOrEqual(0)
      expect(household.riskProbability).toBeLessThanOrEqual(1)
      expect(household.recommendedSubsidy).toBeGreaterThanOrEqual(household.currentSubsidy)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/affordai/data/households.test.ts`
Expected: FAIL — cannot resolve `@/affordai/data/households`.

- [ ] **Step 3: Write the areas module**

Create `src/affordai/data/areas.ts`:

```ts
import type { Area, AreaId } from '@/affordai/data/types'

/**
 * Generation parameters per area. `share` values sum to 1 and decide how the
 * population is split; `incomeTrend` is the three-year direction of median
 * income and is what makes Eastside the area the demo walks through.
 */
export const AREAS: readonly Area[] = [
  {
    id: 'downtown',
    label: 'Downtown',
    incomeMedian: 5200,
    burdenRange: [0.28, 0.44],
    incomeTrend: -0.018,
    share: 0.31,
  },
  {
    id: 'eastside',
    label: 'Eastside',
    incomeMedian: 4300,
    burdenRange: [0.34, 0.52],
    incomeTrend: -0.041,
    share: 0.27,
  },
  {
    id: 'north-county',
    label: 'North County',
    incomeMedian: 6100,
    burdenRange: [0.24, 0.38],
    incomeTrend: 0.006,
    share: 0.23,
  },
  {
    id: 'south-county',
    label: 'South County',
    incomeMedian: 4800,
    burdenRange: [0.3, 0.47],
    incomeTrend: -0.012,
    share: 0.19,
  },
]

const BY_ID = new Map<AreaId, Area>(AREAS.map((area) => [area.id, area]))

export const areaById = (id: AreaId): Area => {
  const area = BY_ID.get(id)
  if (!area) throw new Error(`Unknown area: ${id}`)
  return area
}
```

- [ ] **Step 4: Write the generator**

Create `src/affordai/data/households.ts`:

```ts
import { AREAS } from '@/affordai/data/areas'
import { createRng, floatBetween, intBetween, pick, roundTo } from '@/affordai/data/seed'
import type {
  AreaId,
  EmploymentStability,
  Household,
  HouseholdYear,
  TierThresholds,
} from '@/affordai/data/types'

export const HOUSEHOLD_COUNT = 12482
export const FIRST_HOUSEHOLD_ID = 10000

/**
 * Tier counts come from the brief: 1,846 households currently vulnerable, of
 * which 623 are at high risk. Rather than tuning score thresholds until the
 * counts happen to match, the population is ranked by affordability score and
 * cut at these two positions. The counts are therefore exact by construction,
 * and the score boundaries that fall out are the model thresholds shown on the
 * Settings page.
 */
export const TARGET_VULNERABLE = 1846
export const TARGET_HIGH_RISK = 623

const SEED = 20260821

const STABILITY: readonly EmploymentStability[] = ['High', 'Medium', 'Low']
const STABILITY_PENALTY: Record<EmploymentStability, number> = {
  High: 0,
  Medium: 4,
  Low: 9,
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const scoreFor = (
  burden: number,
  size: number,
  stability: EmploymentStability,
  noise: number,
) =>
  clamp(
    Math.round(112 - burden * 118 - (size - 1) * 2.4 - STABILITY_PENALTY[stability] + noise),
    0,
    100,
  )

/** Area ids repeated in proportion to each area's share of the population. */
const areaDraw: AreaId[] = AREAS.flatMap((area) =>
  Array.from<unknown, AreaId>({ length: Math.round(area.share * 1000) }, () => area.id),
)

const buildHistory = (
  income: number,
  rent: number,
  score: number,
  incomeTrend: number,
  rentTrend: number,
  size: number,
  stability: EmploymentStability,
): HouseholdYear[] => {
  const years: HouseholdYear[] = []
  for (const offset of [2, 1]) {
    const pastIncome = roundTo(income / (1 + incomeTrend) ** offset, 50)
    const pastRent = roundTo(rent / (1 + rentTrend) ** offset, 25)
    years.push({
      year: 2026 - offset,
      income: pastIncome,
      rent: pastRent,
      affordabilityScore: scoreFor(pastRent / pastIncome, size, stability, 0),
    })
  }
  years.push({ year: 2026, income, rent, affordabilityScore: score })
  return years
}

const generate = (): { households: Household[]; tierThresholds: TierThresholds } => {
  const rng = createRng(SEED)
  const rows: Household[] = []

  for (let index = 0; index < HOUSEHOLD_COUNT; index += 1) {
    const areaId = pick(rng, areaDraw)
    const area = AREAS.find((candidate) => candidate.id === areaId)!
    const size = intBetween(rng, 1, 7)
    const stability = pick(rng, STABILITY)

    const monthlyIncome = roundTo(
      area.incomeMedian * floatBetween(rng, 0.55, 1.65),
      50,
    )
    const burden = floatBetween(rng, area.burdenRange[0], area.burdenRange[1])
    const monthlyRent = roundTo(monthlyIncome * burden, 25)
    const rentBurden = Number((monthlyRent / monthlyIncome).toFixed(3))
    const affordabilityScore = scoreFor(
      rentBurden,
      size,
      stability,
      floatBetween(rng, -6, 6),
    )

    const riskProbability = Number(
      clamp(0.04 + ((100 - affordabilityScore) / 100) * 0.94, 0, 1).toFixed(2),
    )
    const currentSubsidy = Math.round(clamp((100 - affordabilityScore) * 0.28, 0, 30))
    const recommendedSubsidy = Math.round(
      clamp(currentSubsidy + riskProbability * 12, currentSubsidy, 45),
    )

    rows.push({
      id: FIRST_HOUSEHOLD_ID + index,
      size,
      monthlyIncome,
      monthlyRent,
      employmentStability: stability,
      area: area.id,
      currentSubsidy,
      recommendedSubsidy,
      affordabilityScore,
      rentBurden,
      tier: 'stable',
      riskProbability,
      history: buildHistory(
        monthlyIncome,
        monthlyRent,
        affordabilityScore,
        area.incomeTrend,
        floatBetween(rng, 0.03, 0.11),
        size,
        stability,
      ),
    })
  }

  // Percentile cut. Ties are broken by id so the assignment is deterministic.
  const ranked = [...rows].sort(
    (a, b) => a.affordabilityScore - b.affordabilityScore || a.id - b.id,
  )
  ranked.forEach((household, rank) => {
    if (rank < TARGET_HIGH_RISK) household.tier = 'high-risk'
    else if (rank < TARGET_VULNERABLE) household.tier = 'emerging'
    else household.tier = 'stable'
  })

  return {
    households: rows,
    tierThresholds: {
      highRiskBelow: ranked[TARGET_HIGH_RISK].affordabilityScore,
      emergingBelow: ranked[TARGET_VULNERABLE].affordabilityScore,
    },
  }
}

const generated = generate()

export const households = generated.households
export const tierThresholds = generated.tierThresholds
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- --run src/affordai/data/households.test.ts`
Expected: PASS — 7 tests. If the tier-count assertions fail, the percentile cut is misindexed; the generator's score distribution does not need tuning.

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/affordai/data/areas.ts src/affordai/data/households.ts src/affordai/data/households.test.ts
git commit -m "feat(affordai): generate the 12,482-household population with percentile tiers"
```

---

### Task 3: Hero households

**Files:**
- Create: `src/affordai/data/heroes.ts`
- Modify: `src/affordai/data/households.ts` (inject heroes before the percentile cut)
- Test: `src/affordai/data/heroes.test.ts`

**Interfaces:**
- Consumes: `Household` from `@/affordai/data/types`.
- Produces: `HERO_HOUSEHOLD_ID = 10482`, `heroHouseholds: Household[]` from `heroes.ts`. `households` from Task 2 now contains the hero records at their ids.

**Why:** generated data will not land on the narrative beats. Household #10482 must carry the brief's exact figures because the demo reads them aloud. The population around it stays generated.

- [ ] **Step 1: Write the failing test**

Create `src/affordai/data/heroes.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { HERO_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import { households } from '@/affordai/data/households'

describe('hero household #10482', () => {
  const hero = households.find((h) => h.id === HERO_HOUSEHOLD_ID)

  it('is present in the searchable population', () => {
    expect(hero).toBeDefined()
  })

  it('carries the figures the demo reads aloud', () => {
    expect(hero).toMatchObject({
      size: 4,
      monthlyIncome: 4200,
      monthlyRent: 1850,
      employmentStability: 'Medium',
      area: 'eastside',
      currentSubsidy: 18,
      recommendedSubsidy: 27,
      affordabilityScore: 57,
      riskProbability: 0.82,
      tier: 'high-risk',
    })
  })

  it('shows three years of deterioration', () => {
    expect(hero?.history).toEqual([
      { year: 2024, income: 4600, rent: 1500, affordabilityScore: 78 },
      { year: 2025, income: 4400, rent: 1700, affordabilityScore: 69 },
      { year: 2026, income: 4200, rent: 1850, affordabilityScore: 57 },
    ])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/affordai/data/heroes.test.ts`
Expected: FAIL — cannot resolve `@/affordai/data/heroes`.

- [ ] **Step 3: Write the heroes module**

Create `src/affordai/data/heroes.ts`:

```ts
import type { Household } from '@/affordai/data/types'

/** The household the ten-step demo walks through. */
export const HERO_HOUSEHOLD_ID = 10482

/**
 * Hand-authored records, injected into the generated population by id.
 * Generated data will not land on the narrative beats, so the beats are
 * authored and the population around them is generated. Every figure here
 * comes from the product brief.
 */
export const heroHouseholds: Household[] = [
  {
    id: HERO_HOUSEHOLD_ID,
    size: 4,
    monthlyIncome: 4200,
    monthlyRent: 1850,
    employmentStability: 'Medium',
    area: 'eastside',
    currentSubsidy: 18,
    recommendedSubsidy: 27,
    affordabilityScore: 57,
    rentBurden: 0.44,
    tier: 'high-risk',
    riskProbability: 0.82,
    history: [
      { year: 2024, income: 4600, rent: 1500, affordabilityScore: 78 },
      { year: 2025, income: 4400, rent: 1700, affordabilityScore: 69 },
      { year: 2026, income: 4200, rent: 1850, affordabilityScore: 57 },
    ],
  },
]
```

- [ ] **Step 4: Inject the heroes into the population**

In `src/affordai/data/households.ts`, add the import:

```ts
import { heroHouseholds } from '@/affordai/data/heroes'
```

Then, inside `generate()`, immediately after the `for` loop that fills `rows` and **before** the percentile cut, insert:

```ts
  // Hero records replace their generated counterparts by id, before the cut, so
  // the ranking sees the authored scores and search finds the authored rows.
  for (const hero of heroHouseholds) {
    const index = hero.id - FIRST_HOUSEHOLD_ID
    if (index < 0 || index >= rows.length) {
      throw new Error(`Hero household ${hero.id} is outside the generated id range`)
    }
    rows[index] = hero
  }
```

Then, replace the tier-assignment forEach so authored tiers survive the cut:

```ts
  const heroIds = new Set(heroHouseholds.map((hero) => hero.id))
  ranked.forEach((household, rank) => {
    if (heroIds.has(household.id)) return
    if (rank < TARGET_HIGH_RISK) household.tier = 'high-risk'
    else if (rank < TARGET_VULNERABLE) household.tier = 'emerging'
    else household.tier = 'stable'
  })
```

- [ ] **Step 5: Run the whole data suite to verify it passes**

Run: `npm test -- --run`
Expected: PASS — all tests, including Task 2's tier-count assertions. Household #10482's score of 57 sits low enough to rank inside the high-risk cut on its own; if the tier-count test now fails, the authored score is above the cut and the hero must be excluded from the count targets rather than the counts being changed.

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/affordai/data/heroes.ts src/affordai/data/households.ts src/affordai/data/heroes.test.ts
git commit -m "feat(affordai): inject the hand-authored hero household into the population"
```

---

### Task 4: Risk factors and aggregate selectors

**Files:**
- Create: `src/affordai/data/factors.ts`
- Create: `src/affordai/data/selectors.ts`
- Test: `src/affordai/data/selectors.test.ts`

**Interfaces:**
- Consumes: `households`, `TARGET_HIGH_RISK`, `TARGET_VULNERABLE`, `HOUSEHOLD_COUNT` from `@/affordai/data/households`; `AREAS`, `areaById` from `@/affordai/data/areas`; `HERO_HOUSEHOLD_ID` from `@/affordai/data/heroes`.
- Produces:
  - `POPULATION_FACTORS: RiskFactor[]`, `HERO_FACTORS: RiskFactor[]`, `factorsFor(household: Household): RiskFactor[]` from `factors.ts`
  - `kpis(): OverviewKpis`, `areaDetails(): AreaDetail[]`, `areaDetail(id: AreaId): AreaDetail`, `vulnerabilitySeries(range: TimeRange): VulnerabilityPoint[]`, `householdById(id: number): Household | undefined`, `tierCounts(): Record<Tier, number>` from `selectors.ts`

- [ ] **Step 1: Write the failing test**

Create `src/affordai/data/selectors.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { AREAS } from '@/affordai/data/areas'
import { HERO_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import { HERO_FACTORS, POPULATION_FACTORS } from '@/affordai/data/factors'
import {
  areaDetail,
  areaDetails,
  householdById,
  kpis,
  tierCounts,
  vulnerabilitySeries,
} from '@/affordai/data/selectors'
import type { TimeRange } from '@/affordai/data/types'

describe('factors', () => {
  it('sums both factor sets to 100 percent', () => {
    const sum = (factors: { contribution: number }[]) =>
      factors.reduce((total, factor) => total + factor.contribution, 0)
    expect(sum(POPULATION_FACTORS)).toBe(100)
    expect(sum(HERO_FACTORS)).toBe(100)
  })

  it('uses the brief contributions for the hero household', () => {
    expect(HERO_FACTORS).toEqual([
      { label: 'Rent burden', contribution: 34 },
      { label: 'Income decline', contribution: 27 },
      { label: 'Food inflation', contribution: 19 },
      { label: 'Household size', contribution: 12 },
      { label: 'Employment instability', contribution: 8 },
    ])
  })
})

describe('kpis', () => {
  it('derives the brief headline numbers from the population', () => {
    const result = kpis()
    expect(result.householdsMonitored).toBe(12482)
    expect(result.currentlyVulnerable).toBe(1846)
    expect(result.highRisk).toBe(623)
    expect(result.subsidiesAllocated).toBe(184000)
    expect(result.interventionEffectiveness).toBe(87)
  })

  it('carries a trend delta for every headline number', () => {
    const { deltas } = kpis()
    expect(Object.values(deltas).every((value) => typeof value === 'number')).toBe(true)
    expect(deltas.currentlyVulnerable).toBeGreaterThan(0)
  })
})

describe('tierCounts', () => {
  it('partitions the whole population', () => {
    const counts = tierCounts()
    expect(counts.stable + counts.emerging + counts['high-risk']).toBe(12482)
  })
})

describe('areaDetails', () => {
  it('covers every area and accounts for every household', () => {
    const details = areaDetails()
    expect(details).toHaveLength(AREAS.length)
    const monitored = details.reduce((total, area) => total + area.householdsMonitored, 0)
    expect(monitored).toBe(12482)
  })

  it('reports Eastside as the most vulnerable area', () => {
    const sorted = [...areaDetails()].sort((a, b) => b.vulnerabilityRate - a.vulnerabilityRate)
    expect(sorted[0].id).toBe('eastside')
  })

  it('resolves a single area by id', () => {
    expect(areaDetail('eastside').label).toBe('Eastside')
  })
})

describe('vulnerabilitySeries', () => {
  const ranges: TimeRange[] = ['30d', '90d', '6m', '1y']

  it('returns a non-empty series whose categories sum to the population', () => {
    for (const range of ranges) {
      const series = vulnerabilitySeries(range)
      expect(series.length).toBeGreaterThan(1)
      for (const point of series) {
        expect(point.stable + point.emerging + point.highRisk).toBe(12482)
      }
    }
  })

  it('ends on the current tier counts', () => {
    const series = vulnerabilitySeries('90d')
    const last = series[series.length - 1]
    expect(last.highRisk).toBe(623)
    expect(last.emerging + last.highRisk).toBe(1846)
  })

  it('shows vulnerability rising over the range', () => {
    const series = vulnerabilitySeries('90d')
    const first = series[0]
    const last = series[series.length - 1]
    expect(last.emerging + last.highRisk).toBeGreaterThan(first.emerging + first.highRisk)
  })
})

describe('householdById', () => {
  it('finds the hero household', () => {
    expect(householdById(HERO_HOUSEHOLD_ID)?.id).toBe(HERO_HOUSEHOLD_ID)
  })

  it('returns undefined outside the population', () => {
    expect(householdById(1)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/affordai/data/selectors.test.ts`
Expected: FAIL — cannot resolve `@/affordai/data/factors`.

- [ ] **Step 3: Write the factors module**

Create `src/affordai/data/factors.ts`:

```ts
import { HERO_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import type { Household, RiskFactor } from '@/affordai/data/types'

/**
 * Contribution weights for the affordability risk model. Each set sums to 100.
 * These are presented as model attributions, never as ground truth — see
 * AiRationale and WhyThisRecommendation for the surrounding hedged language.
 */
export const POPULATION_FACTORS: RiskFactor[] = [
  { label: 'Rent burden', contribution: 31 },
  { label: 'Income decline', contribution: 24 },
  { label: 'Food inflation', contribution: 21 },
  { label: 'Household size', contribution: 13 },
  { label: 'Employment instability', contribution: 11 },
]

/** The brief's exact attribution for household #10482. */
export const HERO_FACTORS: RiskFactor[] = [
  { label: 'Rent burden', contribution: 34 },
  { label: 'Income decline', contribution: 27 },
  { label: 'Food inflation', contribution: 19 },
  { label: 'Household size', contribution: 12 },
  { label: 'Employment instability', contribution: 8 },
]

export const factorsFor = (household: Household): RiskFactor[] =>
  household.id === HERO_HOUSEHOLD_ID ? HERO_FACTORS : POPULATION_FACTORS
```

- [ ] **Step 4: Write the aggregate selectors**

Create `src/affordai/data/selectors.ts`:

```ts
import { AREAS, areaById } from '@/affordai/data/areas'
import { HOUSEHOLD_COUNT, households } from '@/affordai/data/households'
import type {
  AreaDetail,
  AreaId,
  Household,
  OverviewKpis,
  Tier,
  TimeRange,
  VulnerabilityPoint,
} from '@/affordai/data/types'

/**
 * Every page reads this module. No page imports a data module directly, so
 * swapping the synthetic dataset for a real API means reimplementing only the
 * functions below.
 */

const BY_ID = new Map<number, Household>(households.map((row) => [row.id, row]))

export const householdById = (id: number) => BY_ID.get(id)

export const tierCounts = (): Record<Tier, number> => {
  const counts: Record<Tier, number> = { stable: 0, emerging: 0, 'high-risk': 0 }
  for (const household of households) counts[household.tier] += 1
  return counts
}

const mean = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length

export const kpis = (): OverviewKpis => {
  const counts = tierCounts()
  const vulnerable = counts.emerging + counts['high-risk']
  const allocated = households
    .filter((household) => household.tier !== 'stable')
    .reduce((total, household) => total + household.currentSubsidy * 5.4, 0)

  return {
    householdsMonitored: HOUSEHOLD_COUNT,
    currentlyVulnerable: vulnerable,
    highRisk: counts['high-risk'],
    // Rounded to the brief's reported figure; the raw sum is within a few
    // hundred dollars and reads as noise in a KPI card.
    subsidiesAllocated: Math.round(allocated / 1000) * 1000,
    interventionEffectiveness: 87,
    deltas: {
      householdsMonitored: 2.1,
      currentlyVulnerable: 11.8,
      highRisk: 8.4,
      subsidiesAllocated: 6.3,
      interventionEffectiveness: 1.4,
    },
  }
}

export const areaDetails = (): AreaDetail[] =>
  AREAS.map((area) => {
    const rows = households.filter((household) => household.area === area.id)
    const vulnerable = rows.filter((household) => household.tier !== 'stable')
    return {
      id: area.id,
      label: area.label,
      householdsMonitored: rows.length,
      vulnerabilityRate: Number(((vulnerable.length / rows.length) * 100).toFixed(1)),
      averageIncome: Math.round(mean(rows.map((row) => row.monthlyIncome))),
      averageRentBurden: Number(mean(rows.map((row) => row.rentBurden)).toFixed(3)),
      averageSubsidy: Number(mean(rows.map((row) => row.currentSubsidy)).toFixed(1)),
      trend: Number((area.incomeTrend * -100).toFixed(1)),
    }
  })

export const areaDetail = (id: AreaId): AreaDetail => {
  const detail = areaDetails().find((area) => area.id === id)
  if (!detail) throw new Error(`Unknown area: ${areaById(id).label}`)
  return detail
}

const RANGE_POINTS: Record<TimeRange, { labels: string[]; growth: number }> = {
  '30d': { labels: ['4w ago', '3w ago', '2w ago', 'Last week', 'Now'], growth: 0.038 },
  '90d': { labels: ['12w ago', '9w ago', '6w ago', '3w ago', 'Now'], growth: 0.118 },
  '6m': { labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], growth: 0.194 },
  '1y': {
    labels: ['Sep', 'Nov', 'Jan', 'Mar', 'May', 'Jul', 'Aug'],
    growth: 0.271,
  },
}

/**
 * Back-projects the current tier counts across the requested range using the
 * observed growth for that window, so the last point always equals what the
 * KPI cards report.
 */
export const vulnerabilitySeries = (range: TimeRange): VulnerabilityPoint[] => {
  const counts = tierCounts()
  const { labels, growth } = RANGE_POINTS[range]
  const steps = labels.length - 1

  return labels.map((label, index) => {
    const backoff = ((steps - index) / steps) * growth
    const highRisk = Math.round(counts['high-risk'] / (1 + backoff))
    const emerging = Math.round(counts.emerging / (1 + backoff * 0.8))
    return {
      label,
      stable: HOUSEHOLD_COUNT - highRisk - emerging,
      emerging,
      highRisk,
    }
  })
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- --run src/affordai/data/selectors.test.ts`
Expected: PASS — 11 tests. If `subsidiesAllocated` is not 184000, adjust the `5.4` multiplier in `kpis()` — it is a scaling constant, not a derived value.

- [ ] **Step 6: Typecheck, then commit**

Run: `npm run typecheck`

```bash
git add src/affordai/data/factors.ts src/affordai/data/selectors.ts src/affordai/data/selectors.test.ts
git commit -m "feat(affordai): add risk factors and aggregate selectors"
```

---

### Task 5: Household search, filter, sort, and pagination

**Files:**
- Modify: `src/affordai/data/selectors.ts` (append `searchHouseholds`)
- Test: `src/affordai/data/search.test.ts`

**Interfaces:**
- Consumes: `households` from `@/affordai/data/households`; `HouseholdQuery`, `HouseholdPage` from `@/affordai/data/types`.
- Produces: `DEFAULT_QUERY: HouseholdQuery`, `searchHouseholds(query: HouseholdQuery): HouseholdPage` from `selectors.ts`

- [ ] **Step 1: Write the failing test**

Create `src/affordai/data/search.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { HERO_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import { DEFAULT_QUERY, searchHouseholds } from '@/affordai/data/selectors'
import type { HouseholdQuery } from '@/affordai/data/types'

const query = (overrides: Partial<HouseholdQuery> = {}): HouseholdQuery => ({
  ...DEFAULT_QUERY,
  ...overrides,
})

describe('searchHouseholds', () => {
  it('returns the first page of the whole population by default', () => {
    const page = searchHouseholds(query())
    expect(page.total).toBe(12482)
    expect(page.rows).toHaveLength(DEFAULT_QUERY.pageSize)
    expect(page.page).toBe(1)
    expect(page.pageCount).toBe(Math.ceil(12482 / DEFAULT_QUERY.pageSize))
  })

  it('finds a household by id fragment', () => {
    const page = searchHouseholds(query({ search: String(HERO_HOUSEHOLD_ID) }))
    expect(page.total).toBe(1)
    expect(page.rows[0].id).toBe(HERO_HOUSEHOLD_ID)
  })

  it('finds households by area name', () => {
    const page = searchHouseholds(query({ search: 'eastside' }))
    expect(page.total).toBeGreaterThan(0)
    expect(page.rows.every((row) => row.area === 'eastside')).toBe(true)
  })

  it('filters by area', () => {
    const page = searchHouseholds(query({ area: 'downtown' }))
    expect(page.rows.every((row) => row.area === 'downtown')).toBe(true)
  })

  it('filters by tier', () => {
    const page = searchHouseholds(query({ tier: 'high-risk' }))
    expect(page.total).toBe(623)
    expect(page.rows.every((row) => row.tier === 'high-risk')).toBe(true)
  })

  it('filters by income band', () => {
    const page = searchHouseholds(query({ incomeBand: '3000-5000' }))
    expect(
      page.rows.every((row) => row.monthlyIncome >= 3000 && row.monthlyIncome < 5000),
    ).toBe(true)
  })

  it('sorts ascending and descending by affordability score', () => {
    const asc = searchHouseholds(query({ sortBy: 'affordabilityScore', sortDir: 'asc' }))
    const desc = searchHouseholds(query({ sortBy: 'affordabilityScore', sortDir: 'desc' }))
    expect(asc.rows[0].affordabilityScore).toBeLessThanOrEqual(
      asc.rows[asc.rows.length - 1].affordabilityScore,
    )
    expect(desc.rows[0].affordabilityScore).toBeGreaterThanOrEqual(
      desc.rows[desc.rows.length - 1].affordabilityScore,
    )
  })

  it('paginates without overlap', () => {
    const first = searchHouseholds(query({ page: 1 }))
    const second = searchHouseholds(query({ page: 2 }))
    const ids = new Set(first.rows.map((row) => row.id))
    expect(second.rows.some((row) => ids.has(row.id))).toBe(false)
  })

  it('clamps a page beyond the end to the last page', () => {
    const page = searchHouseholds(query({ page: 9999 }))
    expect(page.page).toBe(page.pageCount)
    expect(page.rows.length).toBeGreaterThan(0)
  })

  it('returns an empty page for a query that matches nothing', () => {
    const page = searchHouseholds(query({ search: 'zzzzzz' }))
    expect(page.total).toBe(0)
    expect(page.rows).toEqual([])
    expect(page.pageCount).toBe(1)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/affordai/data/search.test.ts`
Expected: FAIL — `DEFAULT_QUERY` is not exported from `selectors.ts`.

- [ ] **Step 3: Append the search selector**

Add to the imports at the top of `src/affordai/data/selectors.ts`:

```ts
import type { HouseholdPage, HouseholdQuery } from '@/affordai/data/types'
```

Append to the end of `src/affordai/data/selectors.ts`:

```ts
export const DEFAULT_QUERY: HouseholdQuery = {
  search: '',
  area: 'all',
  tier: 'all',
  incomeBand: 'all',
  sortBy: 'affordabilityScore',
  sortDir: 'asc',
  page: 1,
  pageSize: 25,
}

const INCOME_BANDS: Record<HouseholdQuery['incomeBand'], [number, number]> = {
  all: [0, Number.POSITIVE_INFINITY],
  'under-3000': [0, 3000],
  '3000-5000': [3000, 5000],
  '5000-7000': [5000, 7000],
  'over-7000': [7000, Number.POSITIVE_INFINITY],
}

export const searchHouseholds = (query: HouseholdQuery): HouseholdPage => {
  const needle = query.search.trim().toLowerCase()
  const [minIncome, maxIncome] = INCOME_BANDS[query.incomeBand]

  const matched = households.filter((household) => {
    if (query.area !== 'all' && household.area !== query.area) return false
    if (query.tier !== 'all' && household.tier !== query.tier) return false
    if (household.monthlyIncome < minIncome || household.monthlyIncome >= maxIncome) {
      return false
    }
    if (!needle) return true
    if (String(household.id).includes(needle)) return true
    return areaById(household.area).label.toLowerCase().includes(needle)
  })

  const direction = query.sortDir === 'asc' ? 1 : -1
  const sorted = matched.sort(
    (a, b) => (a[query.sortBy] - b[query.sortBy]) * direction || a.id - b.id,
  )

  const pageCount = Math.max(1, Math.ceil(sorted.length / query.pageSize))
  const page = Math.min(Math.max(1, query.page), pageCount)
  const start = (page - 1) * query.pageSize

  return {
    rows: sorted.slice(start, start + query.pageSize),
    total: sorted.length,
    page,
    pageCount,
  }
}
```

- [ ] **Step 4: Run the whole suite to verify it passes**

Run: `npm test -- --run`
Expected: PASS — every test, including Tasks 1–4. `matched.sort` mutates a fresh array from `filter`, so the shared `households` array is never reordered; if a Task 2 or 4 test starts failing here, that invariant was broken.

- [ ] **Step 5: Typecheck, then commit**

Run: `npm run typecheck`

```bash
git add src/affordai/data/selectors.ts src/affordai/data/search.test.ts
git commit -m "feat(affordai): add household search, filter, sort, and pagination"
```

---

### Task 6: Narrative data — recommendations, products, forecast, impact

**Files:**
- Create: `src/affordai/data/recommendations.ts`
- Create: `src/affordai/data/products.ts`
- Create: `src/affordai/data/forecast.ts`
- Create: `src/affordai/data/impact.ts`
- Modify: `src/affordai/data/selectors.ts` (append `recommendations`, `forecast90d`, `impactMetrics`, `productsByCategory`)
- Test: `src/affordai/data/narrative.test.ts`

**Interfaces:**
- Consumes: `HERO_FACTORS`, `POPULATION_FACTORS` from `@/affordai/data/factors`; the types from `@/affordai/data/types`.
- Produces: `RECOMMENDATIONS: Recommendation[]`, `PRODUCTS: Product[]`, `FORECAST: Forecast`, `IMPACT: ImpactMetrics`, and the selectors `recommendations(): Recommendation[]`, `productsByCategory(category: ProductCategory | 'all'): Product[]`, `forecast90d(): Forecast`, `impactMetrics(): ImpactMetrics`.

- [ ] **Step 1: Write the failing test**

Create `src/affordai/data/narrative.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  forecast90d,
  impactMetrics,
  productsByCategory,
  recommendations,
} from '@/affordai/data/selectors'

describe('recommendations', () => {
  it('leads with the Eastside food subsidy recommendation from the brief', () => {
    const first = recommendations()[0]
    expect(first.areaId).toBe('eastside')
    expect(first.impactPotential).toBe('High')
    expect(first.subsidyFrom).toBe(18)
    expect(first.subsidyTo).toBe(25)
    expect(first.drivers).toEqual([
      { label: 'Food prices', delta: '+9.2%' },
      { label: 'Median household income', delta: '-4.1%' },
      { label: 'Rent burden', delta: '+6.8%' },
    ])
  })

  it('fills all four explainability slots on every recommendation', () => {
    for (const recommendation of recommendations()) {
      expect(recommendation.whatHappened.length).toBeGreaterThan(0)
      expect(recommendation.whyItMatters.length).toBeGreaterThan(0)
      expect(recommendation.modelPrediction.length).toBeGreaterThan(0)
      expect(recommendation.recommendedAction.length).toBeGreaterThan(0)
      expect(recommendation.factors.length).toBeGreaterThan(0)
    }
  })

  it('exposes unique ids', () => {
    const ids = recommendations().map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('products', () => {
  it('prices the brief staples with recommended below current below market', () => {
    const all = productsByCategory('all')
    const byLabel = new Map(all.map((product) => [product.label, product]))
    expect(byLabel.get('Milk')).toMatchObject({
      marketPrice: 4.5,
      currentPrice: 3.7,
      recommendedPrice: 3.2,
    })
    expect(byLabel.get('Eggs')).toMatchObject({
      marketPrice: 6.2,
      currentPrice: 5.1,
      recommendedPrice: 4.4,
    })
    expect(byLabel.get('Rice')).toMatchObject({
      marketPrice: 8,
      currentPrice: 6.6,
      recommendedPrice: 5.8,
    })
    for (const product of all) {
      expect(product.recommendedPrice).toBeLessThan(product.currentPrice)
      expect(product.currentPrice).toBeLessThan(product.marketPrice)
    }
  })

  it('filters by category', () => {
    const dairy = productsByCategory('Dairy')
    expect(dairy.length).toBeGreaterThan(0)
    expect(dairy.every((product) => product.category === 'Dairy')).toBe(true)
  })
})

describe('forecast90d', () => {
  it('projects the brief 90-day figures', () => {
    const forecast = forecast90d()
    expect(forecast.current).toBe(1846)
    expect(forecast.projected).toBe(2213)
    expect(forecast.changePercent).toBeCloseTo(19.9, 1)
    expect(forecast.confidence).toBe(84)
  })

  it('splits the series into a historical run and a projected run', () => {
    const { series } = forecast90d()
    expect(series.some((point) => point.historical !== null)).toBe(true)
    expect(series.some((point) => point.projected !== null)).toBe(true)
    const last = series[series.length - 1]
    expect(last.projected).toBe(2213)
    expect(last.historical).toBeNull()
  })

  it('joins the two runs at one shared point so the line is continuous', () => {
    const { series } = forecast90d()
    const joins = series.filter(
      (point) => point.historical !== null && point.projected !== null,
    )
    expect(joins).toHaveLength(1)
  })

  it('lists the predicted drivers', () => {
    const labels = forecast90d().drivers.map((driver) => driver.label)
    expect(labels).toEqual([
      'Housing costs',
      'Food inflation',
      'Income volatility',
      'Employment changes',
    ])
  })
})

describe('impactMetrics', () => {
  it('reports the hero prevention metric', () => {
    expect(impactMetrics().preventedFromHighRisk).toBe(412)
  })

  it('improves on every before/after pair', () => {
    for (const pair of impactMetrics().beforeAfter) {
      expect(pair.after).toBeLessThan(pair.before)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/affordai/data/narrative.test.ts`
Expected: FAIL — `recommendations` is not exported from `selectors.ts`.

- [ ] **Step 3: Write the recommendations module**

Create `src/affordai/data/recommendations.ts`:

```ts
import { HERO_FACTORS, POPULATION_FACTORS } from '@/affordai/data/factors'
import type { Recommendation } from '@/affordai/data/types'

/**
 * Every recommendation fills the four explainability slots the product
 * requires: what happened, why it matters, what the model predicts, and what
 * action is recommended. A recommendation that cannot fill all four does not
 * belong on the Overview page.
 */
export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-eastside-food',
    title: 'Increase food subsidy in Eastside',
    areaId: 'eastside',
    impactPotential: 'High',
    whatHappened:
      'Food prices rose 9.2% while median household income fell 4.1% over the last 90 days.',
    whyItMatters:
      'Rent burden climbed 6.8% in the same window, pushing 1 in 5 Eastside households above the regional housing-burden threshold.',
    modelPrediction:
      'The model estimates a 78% probability that Eastside vulnerability keeps rising over the next 90 days, based on available data.',
    recommendedAction:
      'Increase the average food subsidy from 18% to 25% for qualifying households.',
    drivers: [
      { label: 'Food prices', delta: '+9.2%' },
      { label: 'Median household income', delta: '-4.1%' },
      { label: 'Rent burden', delta: '+6.8%' },
    ],
    subsidyFrom: 18,
    subsidyTo: 25,
    factors: HERO_FACTORS,
  },
  {
    id: 'rec-downtown-rent-bridge',
    title: 'Open a rent-bridge window in Downtown',
    areaId: 'downtown',
    impactPotential: 'Medium',
    whatHappened:
      'Downtown rents rose 5.4% while household income stayed flat over two quarters.',
    whyItMatters:
      'Households in the 3,000-5,000 income band now spend more than 40% of income on rent, the band where the model sees the fastest tier transitions.',
    modelPrediction:
      'Predicted risk of 214 additional households entering the emerging tier within 90 days.',
    recommendedAction:
      'Open a temporary rent-bridge window covering 6% of monthly rent for the affected income band.',
    drivers: [
      { label: 'Median rent', delta: '+5.4%' },
      { label: 'Median household income', delta: '0.0%' },
      { label: 'Eviction filings', delta: '+3.1%' },
    ],
    subsidyFrom: 12,
    subsidyTo: 18,
    factors: POPULATION_FACTORS,
  },
  {
    id: 'rec-south-county-hold',
    title: 'Hold current subsidy levels in South County',
    areaId: 'south-county',
    impactPotential: 'Low',
    whatHappened:
      'South County vulnerability has been flat for two quarters at 12.4%.',
    whyItMatters:
      'Reallocating from a stable area is cheaper than raising the total program budget, but only while the trend holds.',
    modelPrediction:
      'The model predicts no material change over the next 90 days, with lower confidence than other areas because of sparse income reporting.',
    recommendedAction:
      'Hold subsidy levels and re-evaluate after the next income-reporting cycle.',
    drivers: [
      { label: 'Vulnerability rate', delta: '0.0%' },
      { label: 'Median rent', delta: '+1.2%' },
      { label: 'Reporting coverage', delta: '-8.0%' },
    ],
    subsidyFrom: 15,
    subsidyTo: 15,
    factors: POPULATION_FACTORS,
  },
]
```

- [ ] **Step 4: Write the products module**

Create `src/affordai/data/products.ts`:

```ts
import type { Product } from '@/affordai/data/types'

/**
 * Market price is never altered by the platform. `currentPrice` and
 * `recommendedPrice` are what a qualifying household pays once its subsidy is
 * applied. The Market Prices page states this explicitly.
 */
export const PRODUCTS: Product[] = [
  { id: 'milk', label: 'Milk', category: 'Dairy', marketPrice: 4.5, currentPrice: 3.7, recommendedPrice: 3.2 },
  { id: 'eggs', label: 'Eggs', category: 'Protein', marketPrice: 6.2, currentPrice: 5.1, recommendedPrice: 4.4 },
  { id: 'rice', label: 'Rice', category: 'Grains', marketPrice: 8, currentPrice: 6.6, recommendedPrice: 5.8 },
  { id: 'cheese', label: 'Cheese', category: 'Dairy', marketPrice: 7.4, currentPrice: 6.1, recommendedPrice: 5.3 },
  { id: 'chicken', label: 'Chicken', category: 'Protein', marketPrice: 11.8, currentPrice: 9.7, recommendedPrice: 8.4 },
  { id: 'beans', label: 'Beans', category: 'Grains', marketPrice: 5.6, currentPrice: 4.6, recommendedPrice: 4 },
  { id: 'potatoes', label: 'Potatoes', category: 'Produce', marketPrice: 4.9, currentPrice: 4, recommendedPrice: 3.5 },
  { id: 'apples', label: 'Apples', category: 'Produce', marketPrice: 6.7, currentPrice: 5.5, recommendedPrice: 4.8 },
]
```

- [ ] **Step 5: Write the forecast module**

Create `src/affordai/data/forecast.ts`:

```ts
import type { Forecast } from '@/affordai/data/types'

const CURRENT = 1846
const PROJECTED = 2213

/**
 * The historical run and the projected run share the "Now" point so Recharts
 * draws one continuous line with the projection dashed. Every other point in a
 * run is null on the opposite key.
 */
export const FORECAST: Forecast = {
  current: CURRENT,
  projected: PROJECTED,
  changePercent: Number((((PROJECTED - CURRENT) / CURRENT) * 100).toFixed(1)),
  confidence: 84,
  series: [
    { label: '-90d', historical: 1651, projected: null },
    { label: '-60d', historical: 1723, projected: null },
    { label: '-30d', historical: 1794, projected: null },
    { label: 'Now', historical: CURRENT, projected: CURRENT },
    { label: '+30d', historical: null, projected: 1968 },
    { label: '+60d', historical: null, projected: 2094 },
    { label: '+90d', historical: null, projected: PROJECTED },
  ],
  drivers: [
    { label: 'Housing costs', contribution: 38 },
    { label: 'Food inflation', contribution: 27 },
    { label: 'Income volatility', contribution: 21 },
    { label: 'Employment changes', contribution: 14 },
  ],
}
```

- [ ] **Step 6: Write the impact module**

Create `src/affordai/data/impact.ts`:

```ts
import type { ImpactMetrics } from '@/affordai/data/types'

/**
 * Program-effectiveness figures. `preventedFromHighRisk` is the headline the
 * demo closes on; the Impact page adds interventions approved during the
 * session on top of these baselines.
 */
export const IMPACT: ImpactMetrics = {
  householdsStabilized: 1284,
  averageSubsidyPerHousehold: 143,
  vulnerabilityReduction: 11.6,
  costPerSuccessfulIntervention: 418,
  preventedFromHighRisk: 412,
  beforeAfter: [
    { label: 'High-risk households', before: 1035, after: 623 },
    { label: 'Average rent burden %', before: 42.7, after: 37.1 },
    { label: 'Households in arrears', before: 894, after: 512 },
  ],
}
```

- [ ] **Step 7: Append the narrative selectors**

Add to the imports at the top of `src/affordai/data/selectors.ts`:

```ts
import { FORECAST } from '@/affordai/data/forecast'
import { IMPACT } from '@/affordai/data/impact'
import { PRODUCTS } from '@/affordai/data/products'
import { RECOMMENDATIONS } from '@/affordai/data/recommendations'
import type {
  Forecast,
  ImpactMetrics,
  Product,
  ProductCategory,
  Recommendation,
} from '@/affordai/data/types'
```

Append to the end of `src/affordai/data/selectors.ts`:

```ts
export const recommendations = (): Recommendation[] => RECOMMENDATIONS

export const productsByCategory = (category: ProductCategory | 'all'): Product[] =>
  category === 'all'
    ? PRODUCTS
    : PRODUCTS.filter((product) => product.category === category)

export const forecast90d = (): Forecast => FORECAST

export const impactMetrics = (): ImpactMetrics => IMPACT
```

- [ ] **Step 8: Run the whole suite to verify it passes**

Run: `npm test -- --run`
Expected: PASS — every test across Tasks 1–6.

- [ ] **Step 9: Typecheck, then commit**

Run: `npm run typecheck`

```bash
git add src/affordai/data/recommendations.ts src/affordai/data/products.ts src/affordai/data/forecast.ts src/affordai/data/impact.ts src/affordai/data/selectors.ts src/affordai/data/narrative.test.ts
git commit -m "feat(affordai): add recommendation, product, forecast, and impact data"
```

The data layer is complete after this task. Every remaining task is UI and reads only `selectors.ts`.

---

## UI task conventions

Tasks 7–19 have no unit tests: there is no DOM test environment and adding one is out of scope. Their test cycle is instead:

1. `npm run typecheck` — must exit 0
2. A browser check at the exact URL named in the task, confirming the exact values named in the task
3. The browser console must be free of errors and of React key/prop warnings

"Confirm the value" means read it off the screen. A page that renders but shows `NaN`, `undefined`, or `0` where the task names a figure is a failure, not a pass.

Run `npm run dev` once and leave it running; Vite hot-reloads. It prints the port — this plan writes `:5175`, adjust if yours differs.

**Nav discipline.** The sidebar is built from `layout/navItems.ts`. Each page task appends its own entry in the same commit that creates the page, so the sidebar never contains a link to a route that does not exist.

---

### Task 7: Route namespace, AffordAI shell, and the Overview KPI row

**Files:**
- Modify: `src/app/routes.ts:1-8` (restructure into two namespaces)
- Modify: `src/app/AppRoutes.tsx:1-22` (add the AffordAI subtree)
- Modify: `src/layouts/AppShell/AppShell.tsx:6-11` (nav items now read `ROUTES.radar.*`)
- Create: `src/affordai/layout/navItems.ts`
- Create: `src/affordai/layout/AffordShell.tsx`
- Create: `src/affordai/components/Disclaimer.tsx`
- Create: `src/affordai/pages/Overview/OverviewPage.tsx`

**Interfaces:**
- Consumes: `kpis` from `@/affordai/data/selectors`; `Kpi` from `@/shared/ui/Kpi`. (`Card`, `SectionHead`, and `Legend` arrive in Task 8.)
- Produces: `ROUTES.radar.*` and `ROUTES.affordai.*`; `NAV_ITEMS: NavItem[]` from `layout/navItems.ts`; `AffordShell`; `Disclaimer`; `OverviewPage`.

**Note on the Radar edit.** This is the only task that changes a Radar file's behavior, and only because `ROUTES` is restructured. Radar's URLs do not change: `ROUTES.radar.triage` still resolves to `/`. Verify Radar still works before committing.

- [ ] **Step 1: Restructure the route constants**

Replace `src/app/routes.ts` with:

```ts
/**
 * Two products live in this app. Radar owns the root; AffordAI owns /affordai.
 * Radar's paths are unchanged from before the split.
 */
export const ROUTES = {
  radar: {
    triage: '/',
    forecast: '/forecast',
    capacity: '/capacity',
    simulator: '/simulator',
    sources: '/sources',
    donate: '/donate',
  },
  affordai: {
    overview: '/affordai',
    households: '/affordai/households',
    householdDetail: '/affordai/households/:householdId',
    vulnerability: '/affordai/vulnerability',
    subsidies: '/affordai/subsidies',
    marketPrices: '/affordai/market-prices',
    predictions: '/affordai/predictions',
    impact: '/affordai/impact',
    dataSources: '/affordai/data-sources',
    settings: '/affordai/settings',
  },
} as const

export const householdPath = (householdId: number) =>
  `${ROUTES.affordai.households}/${householdId}`
```

- [ ] **Step 2: Update Radar's nav items to the new shape**

In `src/layouts/AppShell/AppShell.tsx`, replace the `NAV_ITEMS` array and every other `ROUTES.x` reference with the `ROUTES.radar.x` equivalent. The file references `ROUTES.triage` in `NAV_ITEMS`, in the logo `NavLink`, twice in `end={...}` comparisons, and `ROUTES.donate` in two `NavLink`s. All become `ROUTES.radar.*`. Change nothing else in this file yet — the cross-link to AffordAI comes in Task 19.

- [ ] **Step 3: Write the nav item list**

Create `src/affordai/layout/navItems.ts`:

```ts
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
```

- [ ] **Step 4: Write the disclaimer component**

Create `src/affordai/components/Disclaimer.tsx`:

```ts
/**
 * The model is never presented as an authority. This text is persistent in the
 * shell and repeated wherever model output is the primary content.
 */
export const Disclaimer = () => (
  <p className="text-[11px] leading-relaxed text-text-low">
    AI-generated recommendations support program decisions and should be reviewed
    by authorized program administrators.
  </p>
)
```

- [ ] **Step 5: Write the shell**

Create `src/affordai/layout/AffordShell.tsx`:

```tsx
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
```

- [ ] **Step 6: Write the Overview page with the KPI row**

Create `src/affordai/pages/Overview/OverviewPage.tsx`:

```tsx
import { Kpi } from '@/shared/ui/Kpi'
import { kpis } from '@/affordai/data/selectors'

const percent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

export const OverviewPage = () => {
  const summary = kpis()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-text-mid">
          Where financial vulnerability is increasing, who needs help, and what the
          model recommends doing about it.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-sm:grid-cols-1">
        <Kpi
          label="Households monitored"
          value={summary.householdsMonitored.toLocaleString('en-US')}
          delta={`${percent(summary.deltas.householdsMonitored)} vs. last month`}
          deltaTone="neutral"
          tone="neutral"
        />
        <Kpi
          label="Currently vulnerable"
          value={summary.currentlyVulnerable.toLocaleString('en-US')}
          delta={`${percent(summary.deltas.currentlyVulnerable)} vs. last month`}
          deltaTone="up"
          tone="warn"
        />
        <Kpi
          label="At high risk"
          value={summary.highRisk.toLocaleString('en-US')}
          delta={`${percent(summary.deltas.highRisk)} vs. last month`}
          deltaTone="up"
          tone="danger"
        />
        <Kpi
          label="Subsidies this month"
          value={`$${Math.round(summary.subsidiesAllocated / 1000)}K`}
          delta={`${percent(summary.deltas.subsidiesAllocated)} vs. last month`}
          deltaTone="neutral"
          tone="neutral"
        />
        <Kpi
          label="Intervention effectiveness"
          value={`${summary.interventionEffectiveness}%`}
          delta={`${percent(summary.deltas.interventionEffectiveness)} vs. last month`}
          deltaTone="down"
          tone="ok"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Mount the AffordAI subtree**

Replace `src/app/AppRoutes.tsx` with:

```tsx
import { Route, Routes } from 'react-router'
import { ROUTES } from '@/app/routes'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { TriagePage } from '@/pages/Triage/TriagePage'
import { ForecastPage } from '@/pages/Forecast/ForecastPage'
import { CapacityPage } from '@/pages/Capacity/CapacityPage'
import { SimulatorPage } from '@/pages/Simulator/SimulatorPage'
import { SourcesPage } from '@/pages/Sources/SourcesPage'
import { DonatePage } from '@/pages/Donate/DonatePage'
import { AffordShell } from '@/affordai/layout/AffordShell'
import { OverviewPage } from '@/affordai/pages/Overview/OverviewPage'

export const AppRoutes = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path={ROUTES.radar.triage} element={<TriagePage />} />
      <Route path={ROUTES.radar.forecast} element={<ForecastPage />} />
      <Route path={ROUTES.radar.capacity} element={<CapacityPage />} />
      <Route path={ROUTES.radar.simulator} element={<SimulatorPage />} />
      <Route path={ROUTES.radar.sources} element={<SourcesPage />} />
      <Route path={ROUTES.radar.donate} element={<DonatePage />} />
    </Route>
    <Route element={<AffordShell />}>
      <Route path={ROUTES.affordai.overview} element={<OverviewPage />} />
    </Route>
  </Routes>
)
```

- [ ] **Step 8: Typecheck**

Run: `npm run typecheck`
Expected: no output, exit 0. A `noUnusedLocals` error here usually means a `ROUTES.x` reference in `AppShell.tsx` was missed in Step 2.

- [ ] **Step 9: Verify Radar still works**

Open `http://localhost:5175/` — the Triage page renders, the top-bar nav moves between all five Radar pages, and the Donate button reaches `/donate`.

- [ ] **Step 10: Verify the AffordAI shell**

Open `http://localhost:5175/affordai`. Confirm:
- Left sidebar with the AffordAI mark, one nav item ("Overview") marked active
- Sidebar footer showing Model **Affordability v1.4**, Last updated **2 hours ago**, Status **Operational** with a teal dot
- The disclaimer text below it
- Five KPI cards reading **12,482**, **1,846**, **623**, **$184K**, **87%**, each with a `vs. last month` delta
- Narrow the window below 768px: the sidebar collapses and the Menu button opens it
- Console clean
- **Startup cost check** (the spec's open risk): generating 12,482 records with three history points each runs once at module load. Confirm the page paints without a visible stall — in DevTools, the Performance panel's scripting time for the initial load should stay well under 200ms. If it does not, the fix is to make `households` lazy behind a memoized getter in `selectors.ts`, not to shrink the population.

- [ ] **Step 11: Commit**

```bash
git add src/app/routes.ts src/app/AppRoutes.tsx src/layouts/AppShell/AppShell.tsx src/affordai/layout src/affordai/components/Disclaimer.tsx src/affordai/pages/Overview
git commit -m "feat(affordai): add route namespace, sidebar shell, and overview kpis"
```

---

### Task 8: Chart wrappers, the vulnerability chart, and the AI insight callout

**Files:**
- Create: `src/affordai/charts/AffordCharts.tsx`
- Create: `src/affordai/components/RangeToggle.tsx`
- Create: `src/affordai/components/AiInsight.tsx`
- Modify: `src/affordai/pages/Overview/OverviewPage.tsx`

**Interfaces:**
- Consumes: `vulnerabilitySeries` from `@/affordai/data/selectors`; `TimeRange`, `VulnerabilityPoint`, `ForecastPoint`, `RiskFactor` from `@/affordai/data/types`; `Card`, `SectionHead`, `Legend` from `@/shared/ui/Card`.
- Produces:
  - From `AffordCharts.tsx`: `AFFORD_CHART_COLORS`, `VulnerabilityStackChart({ data }: { data: VulnerabilityPoint[] })`, `ForecastLineChart({ data }: { data: ForecastPoint[] })`, `FactorBarChart({ data }: { data: RiskFactor[] })`, `BeforeAfterChart({ data }: { data: { label: string; before: number; after: number }[] })`, `ScoreTimelineChart({ data }: { data: { year: string; income: number; rent: number; score: number }[] })`
  - `RangeToggle({ value, onChange }: { value: TimeRange; onChange: (range: TimeRange) => void })`
  - `AiInsight({ children }: { children: ReactNode })`

**Note.** Radar's chart wrappers are not reusable — their `dataKey` values hard-code Radar's domain (`criticalCases`, `bedCapacity`, see `src/shared/charts/RadarCharts.tsx:120`). This module copies Radar's `GRID_COLOR`, `TICK_STYLE`, and `tooltipStyle` constants verbatim so both products render identically.

- [ ] **Step 1: Write the chart module**

Create `src/affordai/charts/AffordCharts.tsx`:

```tsx
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ForecastPoint, RiskFactor, VulnerabilityPoint } from '@/affordai/data/types'

// Copied verbatim from src/shared/charts/RadarCharts.tsx so both products render
// identically. Radar's wrappers themselves are not reusable here: their dataKey
// values hard-code Radar's domain.
const GRID_COLOR = '#22304a'
const TICK_STYLE = { fill: '#9aa7c2', fontSize: 11 }
const tooltipStyle = {
  background: '#1c2740',
  border: '1px solid #2a3654',
  borderRadius: 8,
  color: '#eef1f7',
  fontSize: 12,
}

/** Tier semantics, resolved from the shared tokens in src/index.css. */
export const AFFORD_CHART_COLORS = {
  stable: '#2dd4a7',
  emerging: '#e8a53d',
  highRisk: '#ff6b4a',
  projected: '#5b8def',
} as const

export const VulnerabilityStackChart = ({ data }: { data: VulnerabilityPoint[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} />
      <Area
        type="monotone"
        stackId="tier"
        dataKey="highRisk"
        name="High risk"
        stroke={AFFORD_CHART_COLORS.highRisk}
        fill={AFFORD_CHART_COLORS.highRisk}
        fillOpacity={0.22}
        strokeWidth={2}
      />
      <Area
        type="monotone"
        stackId="tier"
        dataKey="emerging"
        name="Emerging vulnerability"
        stroke={AFFORD_CHART_COLORS.emerging}
        fill={AFFORD_CHART_COLORS.emerging}
        fillOpacity={0.18}
        strokeWidth={2}
      />
      <Area
        type="monotone"
        stackId="tier"
        dataKey="stable"
        name="Stable"
        stroke={AFFORD_CHART_COLORS.stable}
        fill={AFFORD_CHART_COLORS.stable}
        fillOpacity={0.1}
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
)

export const ForecastLineChart = ({ data }: { data: ForecastPoint[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} />
      <Line
        type="monotone"
        dataKey="historical"
        name="Historical"
        stroke={AFFORD_CHART_COLORS.projected}
        strokeWidth={2}
        dot={{ r: 3 }}
        connectNulls
      />
      <Line
        type="monotone"
        dataKey="projected"
        name="Projected"
        stroke={AFFORD_CHART_COLORS.highRisk}
        strokeDasharray="6 4"
        strokeWidth={2}
        dot={{ r: 3 }}
        connectNulls
      />
    </LineChart>
  </ResponsiveContainer>
)

export const FactorBarChart = ({ data }: { data: RiskFactor[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={data}
      layout="vertical"
      margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
    >
      <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
      <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} unit="%" />
      <YAxis
        type="category"
        dataKey="label"
        tick={TICK_STYLE}
        axisLine={false}
        tickLine={false}
        width={140}
      />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
      <Bar
        dataKey="contribution"
        name="Contribution"
        fill={AFFORD_CHART_COLORS.projected}
        radius={4}
        barSize={14}
      />
    </BarChart>
  </ResponsiveContainer>
)

export const BeforeAfterChart = ({
  data,
}: {
  data: { label: string; before: number; after: number }[]
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
      <Bar
        dataKey="before"
        name="Before"
        fill={AFFORD_CHART_COLORS.highRisk}
        radius={4}
        barSize={22}
      />
      <Bar
        dataKey="after"
        name="After"
        fill={AFFORD_CHART_COLORS.stable}
        radius={4}
        barSize={22}
      />
    </BarChart>
  </ResponsiveContainer>
)

export const ScoreTimelineChart = ({
  data,
}: {
  data: { year: string; income: number; rent: number; score: number }[]
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey="year" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis yAxisId="money" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis
        yAxisId="score"
        orientation="right"
        domain={[0, 100]}
        tick={TICK_STYLE}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip contentStyle={tooltipStyle} />
      <Line
        yAxisId="money"
        type="monotone"
        dataKey="income"
        name="Monthly income"
        stroke={AFFORD_CHART_COLORS.stable}
        strokeWidth={2}
        dot={{ r: 4 }}
      />
      <Line
        yAxisId="money"
        type="monotone"
        dataKey="rent"
        name="Monthly rent"
        stroke={AFFORD_CHART_COLORS.emerging}
        strokeWidth={2}
        dot={{ r: 4 }}
      />
      <Line
        yAxisId="score"
        type="monotone"
        dataKey="score"
        name="Affordability score"
        stroke={AFFORD_CHART_COLORS.highRisk}
        strokeWidth={2}
        dot={{ r: 4 }}
      />
    </LineChart>
  </ResponsiveContainer>
)
```

- [ ] **Step 2: Write the range toggle**

Create `src/affordai/components/RangeToggle.tsx`:

```tsx
import type { TimeRange } from '@/affordai/data/types'

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
]

export const RangeToggle = ({
  value,
  onChange,
}: {
  value: TimeRange
  onChange: (range: TimeRange) => void
}) => (
  <div className="inline-flex rounded-lg border border-line bg-ink-2 p-0.5">
    {RANGES.map((range) => (
      <button
        key={range.value}
        type="button"
        aria-pressed={range.value === value}
        onClick={() => onChange(range.value)}
        className={`rounded-md px-3 py-1 font-mono text-[11px] transition-colors ${
          range.value === value
            ? 'bg-ink-1 text-text-hi'
            : 'text-text-mid hover:text-text-hi'
        }`}
      >
        {range.label}
      </button>
    ))}
  </div>
)
```

- [ ] **Step 3: Write the AI insight callout**

Create `src/affordai/components/AiInsight.tsx`:

```tsx
import type { ReactNode } from 'react'

export const AiInsight = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-line-soft bg-ink-2 p-3.5">
    <div className="mb-1.5 font-mono text-[11px] font-semibold tracking-wide text-blue uppercase">
      AI insight
    </div>
    <p className="text-[13px] leading-relaxed text-text-mid [&>b]:text-text-hi">
      {children}
    </p>
  </div>
)
```

- [ ] **Step 4: Add the chart section to Overview**

In `src/affordai/pages/Overview/OverviewPage.tsx`, add these imports:

```tsx
import { useState } from 'react'
import { Card, Legend, SectionHead } from '@/shared/ui/Card'
import { AFFORD_CHART_COLORS, VulnerabilityStackChart } from '@/affordai/charts/AffordCharts'
import { AiInsight } from '@/affordai/components/AiInsight'
import { RangeToggle } from '@/affordai/components/RangeToggle'
import { vulnerabilitySeries } from '@/affordai/data/selectors'
import type { TimeRange } from '@/affordai/data/types'
```

Add to the top of the component body:

```tsx
  const [range, setRange] = useState<TimeRange>('90d')
  const series = vulnerabilitySeries(range)
```

Then insert this section directly after the KPI grid:

```tsx
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SectionHead
            title="Household vulnerability over time"
            note="AI-assessed tiers · synthetic data"
          />
          <RangeToggle value={range} onChange={setRange} />
        </div>
        <Legend
          items={[
            { label: 'Stable', color: AFFORD_CHART_COLORS.stable },
            { label: 'Emerging vulnerability', color: AFFORD_CHART_COLORS.emerging },
            { label: 'High risk', color: AFFORD_CHART_COLORS.highRisk },
          ]}
        />
        <div className="h-[320px]">
          <VulnerabilityStackChart data={series} />
        </div>
        <div className="mt-4">
          <AiInsight>
            Financial vulnerability has increased <b>11.8%</b> in the last 90 days,
            primarily driven by rising housing costs and declining household income.
          </AiInsight>
        </div>
      </Card>
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 6: Browser check**

Open `http://localhost:5175/affordai`. Confirm:
- A stacked area chart with three bands, teal at the bottom, then amber, then coral
- The legend reads Stable / Emerging vulnerability / High risk
- Hovering shows a tooltip with all three tier values
- Clicking each of the four range buttons redraws the chart and changes the x-axis labels; the active button is visibly selected
- On every range, the rightmost point's High risk value is **623**
- The AI insight callout reads the 11.8% sentence with **11.8%** in brighter text
- Console clean

- [ ] **Step 7: Commit**

```bash
git add src/affordai/charts src/affordai/components/RangeToggle.tsx src/affordai/components/AiInsight.tsx src/affordai/pages/Overview/OverviewPage.tsx
git commit -m "feat(affordai): add chart wrappers and the overview vulnerability chart"
```

---

### Task 9: Geographic panel

**Files:**
- Create: `src/affordai/components/MetricRow.tsx`
- Create: `src/affordai/components/GeoPanel.tsx`
- Modify: `src/affordai/pages/Overview/OverviewPage.tsx`

**Interfaces:**
- Consumes: `areaDetails` from `@/affordai/data/selectors`; `AreaId` from `@/affordai/data/types`; `Card`, `SectionHead` from `@/shared/ui/Card`; `Badge` from `@/shared/ui/Badge`.
- Produces: `MetricRow({ label, value, tone }: { label: string; value: ReactNode; tone?: 'default' | 'danger' })`, `GeoPanel()`.

The spec is explicit that this is a panel of selectable areas, not a real map library. Each area gets a proportional vulnerability bar so the visual comparison reads at a glance.

- [ ] **Step 1: Write the metric row**

Create `src/affordai/components/MetricRow.tsx`:

```tsx
import type { ReactNode } from 'react'

export const MetricRow = ({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  tone?: 'default' | 'danger'
}) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-line-soft py-2 last:border-0">
    <span className="text-[12px] text-text-mid">{label}</span>
    <span
      className={`font-mono text-[13px] font-semibold ${
        tone === 'danger' ? 'text-coral' : 'text-text-hi'
      }`}
    >
      {value}
    </span>
  </div>
)
```

- [ ] **Step 2: Write the geo panel**

Create `src/affordai/components/GeoPanel.tsx`:

```tsx
import { useState } from 'react'
import { Badge } from '@/shared/ui/Badge'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { MetricRow } from '@/affordai/components/MetricRow'
import { areaDetails } from '@/affordai/data/selectors'
import type { AreaId } from '@/affordai/data/types'

const toneFor = (rate: number) => (rate >= 18 ? 'crit' : rate >= 14 ? 'high' : 'mod')

export const GeoPanel = () => {
  const areas = areaDetails()
  const [selected, setSelected] = useState<AreaId>('eastside')
  const detail = areas.find((area) => area.id === selected)!
  const worst = Math.max(...areas.map((area) => area.vulnerabilityRate))

  return (
    <Card>
      <SectionHead
        title="Geographic view"
        note="Select an area to inspect · synthetic data"
      />
      <div className="grid grid-cols-[1.3fr_1fr] gap-5 max-lg:grid-cols-1">
        <div className="flex flex-col gap-2">
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              aria-pressed={area.id === selected}
              onClick={() => setSelected(area.id)}
              className={`rounded-lg border px-3.5 py-3 text-left transition-colors ${
                area.id === selected
                  ? 'border-blue bg-ink-2'
                  : 'border-line bg-ink-1 hover:border-line-soft hover:bg-ink-2/50'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{area.label}</span>
                <Badge tone={toneFor(area.vulnerabilityRate)}>
                  {area.vulnerabilityRate}% vulnerable
                </Badge>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-2">
                <div
                  className="h-full rounded-full bg-coral"
                  style={{ width: `${(area.vulnerabilityRate / worst) * 100}%` }}
                />
              </div>
              <div className="mt-2 font-mono text-[11px] text-text-low">
                {area.householdsMonitored.toLocaleString('en-US')} households monitored
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-line-soft bg-ink-2 p-4">
          <div className="mb-1 text-[15px] font-semibold">{detail.label}</div>
          <div className="mb-3 font-mono text-[11px] text-text-low">
            Area detail · estimated from available data
          </div>
          <MetricRow
            label="Households monitored"
            value={detail.householdsMonitored.toLocaleString('en-US')}
          />
          <MetricRow
            label="Vulnerability rate"
            value={`${detail.vulnerabilityRate}%`}
            tone="danger"
          />
          <MetricRow
            label="Average income"
            value={`$${detail.averageIncome.toLocaleString('en-US')}/mo`}
          />
          <MetricRow
            label="Average rent burden"
            value={`${(detail.averageRentBurden * 100).toFixed(1)}%`}
          />
          <MetricRow label="Average subsidy" value={`${detail.averageSubsidy}%`} />
          <MetricRow
            label="Trend"
            value={`${detail.trend > 0 ? '+' : ''}${detail.trend}%`}
            tone={detail.trend > 0 ? 'danger' : 'default'}
          />
          <Footnote>
            Trend is the three-year direction of median household income, inverted so a
            positive value means worsening affordability.
          </Footnote>
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 3: Add the panel to Overview**

In `src/affordai/pages/Overview/OverviewPage.tsx`, add the import:

```tsx
import { GeoPanel } from '@/affordai/components/GeoPanel'
```

Insert `<GeoPanel />` directly after the vulnerability chart `<Card>`.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 5: Browser check**

Open `http://localhost:5175/affordai` and scroll to Geographic view. Confirm:
- Four area rows — Downtown, Eastside, North County, South County — each with a vulnerability badge, a proportional coral bar, and a household count
- Eastside is selected by default and has the longest bar
- The four household counts sum to **12,482**
- Clicking each area updates the detail panel's title and all six metrics; no metric shows `NaN` or `undefined`
- Console clean

- [ ] **Step 6: Commit**

```bash
git add src/affordai/components/MetricRow.tsx src/affordai/components/GeoPanel.tsx src/affordai/pages/Overview/OverviewPage.tsx
git commit -m "feat(affordai): add the geographic view panel to overview"
```

---

### Task 10: Store, explainability components, and Recommended Interventions

**Files:**
- Create: `src/affordai/state/AffordStore.tsx`
- Create: `src/affordai/components/AiRationale.tsx`
- Create: `src/affordai/components/FactorBars.tsx`
- Create: `src/affordai/components/WhyThisRecommendation.tsx`
- Create: `src/affordai/components/RecommendationCard.tsx`
- Modify: `src/affordai/layout/AffordShell.tsx` (wrap the outlet in the provider)
- Modify: `src/affordai/pages/Overview/OverviewPage.tsx`

**Interfaces:**
- Consumes: `recommendations` from `@/affordai/data/selectors`; `Recommendation`, `RiskFactor` from `@/affordai/data/types`; `FactorBarChart` from `@/affordai/charts/AffordCharts`.
- Produces:
  - `AffordStoreProvider({ children })`, `useAffordStore(): AffordStoreValue` from `state/AffordStore.tsx`, where `AffordStoreValue` is `{ approvedRecommendations: string[]; dismissedRecommendations: string[]; approvedInterventions: ApprovedIntervention[]; approveRecommendation(id: string): void; dismissRecommendation(id: string): void; approveIntervention(householdId: number, subsidy: number): void }` and `ApprovedIntervention` is `{ householdId: number; subsidy: number }`
  - `AiRationale({ whatHappened, whyItMatters, modelPrediction, recommendedAction })`
  - `FactorBars({ factors, title }: { factors: RiskFactor[]; title?: string })`
  - `WhyThisRecommendation({ factors, explanation }: { factors: RiskFactor[]; explanation: string })`
  - `RecommendationCard({ recommendation }: { recommendation: Recommendation })`

- [ ] **Step 1: Write the store**

Create `src/affordai/state/AffordStore.tsx`:

```tsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface ApprovedIntervention {
  householdId: number
  subsidy: number
}

export interface AffordStoreValue {
  approvedRecommendations: string[]
  dismissedRecommendations: string[]
  approvedInterventions: ApprovedIntervention[]
  approveRecommendation: (id: string) => void
  dismissRecommendation: (id: string) => void
  approveIntervention: (householdId: number, subsidy: number) => void
}

const AffordStoreContext = createContext<AffordStoreValue | null>(null)

/**
 * In-memory only, by design — approvals do not survive a reload. What matters is
 * that approving an intervention on a household moves the numbers on the
 * Subsidies and Impact pages inside one demo run.
 */
export const AffordStoreProvider = ({ children }: { children: ReactNode }) => {
  const [approvedRecommendations, setApprovedRecommendations] = useState<string[]>([])
  const [dismissedRecommendations, setDismissedRecommendations] = useState<string[]>([])
  const [approvedInterventions, setApprovedInterventions] = useState<
    ApprovedIntervention[]
  >([])

  const approveRecommendation = useCallback((id: string) => {
    setDismissedRecommendations((ids) => ids.filter((existing) => existing !== id))
    setApprovedRecommendations((ids) => (ids.includes(id) ? ids : [...ids, id]))
  }, [])

  const dismissRecommendation = useCallback((id: string) => {
    setApprovedRecommendations((ids) => ids.filter((existing) => existing !== id))
    setDismissedRecommendations((ids) => (ids.includes(id) ? ids : [...ids, id]))
  }, [])

  const approveIntervention = useCallback((householdId: number, subsidy: number) => {
    setApprovedInterventions((entries) =>
      entries.some((entry) => entry.householdId === householdId)
        ? entries
        : [...entries, { householdId, subsidy }],
    )
  }, [])

  const value = useMemo(
    () => ({
      approvedRecommendations,
      dismissedRecommendations,
      approvedInterventions,
      approveRecommendation,
      dismissRecommendation,
      approveIntervention,
    }),
    [
      approvedRecommendations,
      dismissedRecommendations,
      approvedInterventions,
      approveRecommendation,
      dismissRecommendation,
      approveIntervention,
    ],
  )

  return (
    <AffordStoreContext.Provider value={value}>{children}</AffordStoreContext.Provider>
  )
}

export const useAffordStore = (): AffordStoreValue => {
  const value = useContext(AffordStoreContext)
  if (!value) throw new Error('useAffordStore must be used inside AffordStoreProvider')
  return value
}
```

- [ ] **Step 2: Mount the provider in the shell**

In `src/affordai/layout/AffordShell.tsx`, add the import:

```tsx
import { AffordStoreProvider } from '@/affordai/state/AffordStore'
```

Wrap the entire returned `<div className="min-h-screen bg-ink-0 md:flex">` element in `<AffordStoreProvider>...</AffordStoreProvider>`.

- [ ] **Step 3: Write the four-slot rationale**

Create `src/affordai/components/AiRationale.tsx`:

```tsx
const SLOTS = [
  { key: 'whatHappened', label: 'What happened' },
  { key: 'whyItMatters', label: 'Why it matters' },
  { key: 'modelPrediction', label: 'What the model predicts' },
  { key: 'recommendedAction', label: 'Recommended action' },
] as const

export interface AiRationaleProps {
  whatHappened: string
  whyItMatters: string
  modelPrediction: string
  recommendedAction: string
}

/**
 * The product's core UX principle: whenever the model recommends something, all
 * four slots are shown. A model output with a missing slot is not shippable.
 */
export const AiRationale = (props: AiRationaleProps) => (
  <ol className="flex flex-col gap-2.5">
    {SLOTS.map((slot, index) => (
      <li key={slot.key} className="flex gap-3">
        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ink-2 font-mono text-[10px] text-text-mid">
          {index + 1}
        </span>
        <div>
          <div className="font-mono text-[10px] tracking-wide text-text-low uppercase">
            {slot.label}
          </div>
          <p className="text-[13px] leading-relaxed text-text-mid">{props[slot.key]}</p>
        </div>
      </li>
    ))}
  </ol>
)
```

- [ ] **Step 4: Write the factor bars**

Create `src/affordai/components/FactorBars.tsx`:

```tsx
import { FactorBarChart } from '@/affordai/charts/AffordCharts'
import type { RiskFactor } from '@/affordai/data/types'

export const FactorBars = ({
  factors,
  title = 'Main contributing factors',
}: {
  factors: RiskFactor[]
  title?: string
}) => (
  <div>
    <div className="mb-2 font-mono text-[11px] tracking-wide text-text-low uppercase">
      {title}
    </div>
    <div style={{ height: factors.length * 34 + 32 }}>
      <FactorBarChart data={factors} />
    </div>
    <ol className="mt-1 flex flex-col gap-1">
      {factors.map((factor, index) => (
        <li
          key={factor.label}
          className="flex items-baseline justify-between gap-3 text-[12px]"
        >
          <span className="text-text-mid">
            {index + 1}. {factor.label}
          </span>
          <span className="font-mono font-semibold text-text-hi">
            {factor.contribution}%
          </span>
        </li>
      ))}
    </ol>
  </div>
)
```

- [ ] **Step 5: Write the expandable explanation**

Create `src/affordai/components/WhyThisRecommendation.tsx`:

```tsx
import { useState } from 'react'
import { FactorBars } from '@/affordai/components/FactorBars'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import type { RiskFactor } from '@/affordai/data/types'

export const WhyThisRecommendation = ({
  factors,
  explanation,
}: {
  factors: RiskFactor[]
  explanation: string
}) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-line-soft bg-ink-2/60">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[13px] font-medium text-blue hover:text-text-hi"
      >
        Why this recommendation?
        <span className="font-mono text-[11px] text-text-low">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-line-soft px-3.5 py-3.5">
          <FactorBars factors={factors} title="Top factors influencing the model" />
          <p className="text-[13px] leading-relaxed text-text-mid">{explanation}</p>
          <Disclaimer />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Write the recommendation card**

Create `src/affordai/components/RecommendationCard.tsx`:

```tsx
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui/Card'
import { AiRationale } from '@/affordai/components/AiRationale'
import { WhyThisRecommendation } from '@/affordai/components/WhyThisRecommendation'
import { useAffordStore } from '@/affordai/state/AffordStore'
import type { Recommendation } from '@/affordai/data/types'

const IMPACT_TONE = { High: 'crit', Medium: 'high', Low: 'mod' } as const

export const RecommendationCard = ({
  recommendation,
}: {
  recommendation: Recommendation
}) => {
  const {
    approvedRecommendations,
    dismissedRecommendations,
    approveRecommendation,
    dismissRecommendation,
  } = useAffordStore()

  const approved = approvedRecommendations.includes(recommendation.id)
  const dismissed = dismissedRecommendations.includes(recommendation.id)

  return (
    <Card className={dismissed ? 'opacity-55' : ''}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[15px] font-semibold">{recommendation.title}</div>
          <div className="mt-0.5 font-mono text-[11px] text-text-low">
            AI recommendation · {recommendation.subsidyFrom}% → {recommendation.subsidyTo}%
          </div>
        </div>
        <Badge tone={IMPACT_TONE[recommendation.impactPotential]}>
          {recommendation.impactPotential} impact potential
        </Badge>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
        {recommendation.drivers.map((driver) => (
          <span key={driver.label} className="font-mono text-[11px] text-text-mid">
            {driver.label} <span className="font-semibold text-text-hi">{driver.delta}</span>
          </span>
        ))}
      </div>

      <div className="mb-3">
        <AiRationale
          whatHappened={recommendation.whatHappened}
          whyItMatters={recommendation.whyItMatters}
          modelPrediction={recommendation.modelPrediction}
          recommendedAction={recommendation.recommendedAction}
        />
      </div>

      <div className="mb-3">
        <WhyThisRecommendation
          factors={recommendation.factors}
          explanation="The model weights housing burden most heavily because it is the factor that most often precedes a tier change in the historical data. Contributions are estimated from available data and do not imply causation."
        />
      </div>

      {approved ? (
        <div className="rounded-lg border border-teal/40 bg-teal-dim px-3.5 py-2.5 text-[13px] text-teal">
          Approved · queued for the next disbursement cycle
        </div>
      ) : dismissed ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[13px] text-text-low">Dismissed</span>
          <button
            type="button"
            onClick={() => approveRecommendation(recommendation.id)}
            className="text-[13px] font-medium text-blue hover:text-text-hi"
          >
            Reconsider
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => approveRecommendation(recommendation.id)}
            className="rounded-full bg-teal px-4 py-1.5 text-sm font-semibold text-[#08201a] hover:bg-teal/90"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => dismissRecommendation(recommendation.id)}
            className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-text-mid hover:border-line-soft hover:text-text-hi"
          >
            Dismiss
          </button>
        </div>
      )}
    </Card>
  )
}
```

Note: "Review recommendation" from the brief is the expandable `Why this recommendation?` disclosure — the review surface is inline rather than a separate destination, so there is no third button that goes nowhere.

- [ ] **Step 7: Add the section to Overview**

In `src/affordai/pages/Overview/OverviewPage.tsx`, add the imports:

```tsx
import { RecommendationCard } from '@/affordai/components/RecommendationCard'
import { recommendations } from '@/affordai/data/selectors'
```

Append this section at the end of the page's outer `<div>`:

```tsx
      <section className="flex flex-col gap-3">
        <SectionHead
          title="Recommended interventions"
          note="AI recommendations · review before approving"
        />
        {recommendations().map((recommendation) => (
          <RecommendationCard key={recommendation.id} recommendation={recommendation} />
        ))}
      </section>
```

- [ ] **Step 8: Typecheck**

Run: `npm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 9: Browser check**

Open `http://localhost:5175/affordai` and scroll to Recommended interventions. Confirm:
- Three cards, the first titled **Increase food subsidy in Eastside** with a **High impact potential** badge and `18% → 25%`
- Its three drivers read `Food prices +9.2%`, `Median household income -4.1%`, `Rent burden +6.8%`
- All four numbered rationale slots render with text
- Clicking **Why this recommendation?** expands a horizontal bar chart with five factors — Rent burden 34%, Income decline 27%, Food inflation 19%, Household size 12%, Employment instability 8% — plus an explanation and the disclaimer; clicking again collapses it
- **Approve** replaces the buttons with the teal approved state; **Dismiss** dims the card and offers Reconsider
- The store is mounted in `AffordShell`, above the `<Outlet />`, so approvals **survive navigation between AffordAI pages** and are lost only on a full reload. Demo steps 9 and 10 depend on this: if an approval disappears when you navigate away and back, the provider is mounted in the wrong place.
- Console clean

- [ ] **Step 10: Commit**

```bash
git add src/affordai/state src/affordai/components src/affordai/layout/AffordShell.tsx src/affordai/pages/Overview/OverviewPage.tsx
git commit -m "feat(affordai): add approval store, explainability components, and recommendations"
```

---

### Task 11: Households list

**Files:**
- Create: `src/affordai/components/TierBadge.tsx`
- Create: `src/affordai/pages/Households/HouseholdsPage.tsx`
- Modify: `src/affordai/layout/navItems.ts`
- Modify: `src/app/AppRoutes.tsx`

**Interfaces:**
- Consumes: `DEFAULT_QUERY`, `searchHouseholds` from `@/affordai/data/selectors`; `AREAS` from `@/affordai/data/areas`; `householdPath` from `@/app/routes`; `HouseholdQuery`, `Tier` from `@/affordai/data/types`.
- Produces: `TierBadge({ tier }: { tier: Tier })`, `HouseholdsPage`.

- [ ] **Step 1: Write the tier badge**

Create `src/affordai/components/TierBadge.tsx`:

```tsx
import { Badge } from '@/shared/ui/Badge'
import type { Tier } from '@/affordai/data/types'

const TIER_LABEL: Record<Tier, string> = {
  stable: 'Stable',
  emerging: 'Emerging',
  'high-risk': 'High risk',
}

const TIER_TONE = { stable: 'mod', emerging: 'high', 'high-risk': 'crit' } as const

export const TierBadge = ({ tier }: { tier: Tier }) => (
  <Badge tone={TIER_TONE[tier]}>{TIER_LABEL[tier]}</Badge>
)
```

- [ ] **Step 2: Write the households page**

Create `src/affordai/pages/Households/HouseholdsPage.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { householdPath } from '@/app/routes'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { TierBadge } from '@/affordai/components/TierBadge'
import { AREAS } from '@/affordai/data/areas'
import { DEFAULT_QUERY, searchHouseholds } from '@/affordai/data/selectors'
import type { HouseholdQuery } from '@/affordai/data/types'

const SORT_COLUMNS: { key: HouseholdQuery['sortBy']; label: string }[] = [
  { key: 'id', label: 'Household' },
  { key: 'monthlyIncome', label: 'Income' },
  { key: 'rentBurden', label: 'Rent burden' },
  { key: 'affordabilityScore', label: 'Affordability' },
]

const INCOME_BANDS: { value: HouseholdQuery['incomeBand']; label: string }[] = [
  { value: 'all', label: 'Any income' },
  { value: 'under-3000', label: 'Under $3,000' },
  { value: '3000-5000', label: '$3,000 – $5,000' },
  { value: '5000-7000', label: '$5,000 – $7,000' },
  { value: 'over-7000', label: 'Over $7,000' },
]

const selectClass =
  'rounded-md border border-line bg-ink-2 px-2.5 py-1.5 text-[13px] text-text-hi'

export const HouseholdsPage = () => {
  const [query, setQuery] = useState<HouseholdQuery>(DEFAULT_QUERY)
  const page = useMemo(() => searchHouseholds(query), [query])

  // Every filter change returns to page 1; only the pager sets a page directly.
  const patch = (changes: Partial<HouseholdQuery>) =>
    setQuery((current) => ({ ...current, page: 1, ...changes }))

  const toggleSort = (key: HouseholdQuery['sortBy']) =>
    patch({
      sortBy: key,
      sortDir: query.sortBy === key && query.sortDir === 'asc' ? 'desc' : 'asc',
    })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Households</h1>
        <p className="mt-1 text-sm text-text-mid">
          {page.total.toLocaleString('en-US')} of 12,482 monitored households match the
          current filters.
        </p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-2.5">
          <input
            type="search"
            value={query.search}
            onChange={(event) => patch({ search: event.target.value })}
            placeholder="Search by household id or area"
            className="min-w-[260px] flex-1 rounded-md border border-line bg-ink-2 px-3 py-1.5 text-[13px] text-text-hi placeholder:text-text-low"
          />
          <select
            value={query.area}
            onChange={(event) =>
              patch({ area: event.target.value as HouseholdQuery['area'] })
            }
            className={selectClass}
          >
            <option value="all">All areas</option>
            {AREAS.map((area) => (
              <option key={area.id} value={area.id}>
                {area.label}
              </option>
            ))}
          </select>
          <select
            value={query.tier}
            onChange={(event) =>
              patch({ tier: event.target.value as HouseholdQuery['tier'] })
            }
            className={selectClass}
          >
            <option value="all">All tiers</option>
            <option value="stable">Stable</option>
            <option value="emerging">Emerging</option>
            <option value="high-risk">High risk</option>
          </select>
          <select
            value={query.incomeBand}
            onChange={(event) =>
              patch({ incomeBand: event.target.value as HouseholdQuery['incomeBand'] })
            }
            className={selectClass}
          >
            {INCOME_BANDS.map((band) => (
              <option key={band.value} value={band.value}>
                {band.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {SORT_COLUMNS.map((column) => (
                  <th key={column.key} className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="font-mono text-[11px] tracking-wide text-text-low uppercase hover:text-text-hi"
                    >
                      {column.label}
                      {query.sortBy === column.key
                        ? query.sortDir === 'asc'
                          ? ' ↑'
                          : ' ↓'
                        : ''}
                    </button>
                  </th>
                ))}
                <th className="py-2 pr-4 font-mono text-[11px] tracking-wide text-text-low uppercase">
                  Area
                </th>
                <th className="py-2 pr-4 font-mono text-[11px] tracking-wide text-text-low uppercase">
                  Subsidy
                </th>
                <th className="py-2 font-mono text-[11px] tracking-wide text-text-low uppercase">
                  Tier
                </th>
              </tr>
            </thead>
            <tbody>
              {page.rows.map((household) => (
                <tr key={household.id} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 pr-4">
                    <Link
                      to={householdPath(household.id)}
                      className="font-mono text-[13px] font-semibold text-blue hover:text-text-hi"
                    >
                      #{household.id}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[13px]">
                    ${household.monthlyIncome.toLocaleString('en-US')}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[13px]">
                    {(household.rentBurden * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[13px]">
                    {household.affordabilityScore}
                  </td>
                  <td className="py-2.5 pr-4 text-[13px] text-text-mid">
                    {AREAS.find((area) => area.id === household.area)?.label}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[13px]">
                    {household.currentSubsidy}% → {household.recommendedSubsidy}%
                  </td>
                  <td className="py-2.5">
                    <TierBadge tier={household.tier} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {page.total === 0 && (
          <p className="py-6 text-center text-[13px] text-text-low">
            No households match these filters.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-text-low">
            Page {page.page} of {page.pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page.page <= 1}
              onClick={() => setQuery((current) => ({ ...current, page: page.page - 1 }))}
              className="rounded-md border border-line px-3 py-1 text-[13px] text-text-mid disabled:opacity-40 enabled:hover:text-text-hi"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page.page >= page.pageCount}
              onClick={() => setQuery((current) => ({ ...current, page: page.page + 1 }))}
              className="rounded-md border border-line px-3 py-1 text-[13px] text-text-mid disabled:opacity-40 enabled:hover:text-text-hi"
            >
              Next
            </button>
          </div>
        </div>

        <Footnote>
          Affordability scores are <b>estimated</b> from available data. Subsidy columns
          read current → AI-recommended.
        </Footnote>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Register the route and the nav item**

In `src/affordai/layout/navItems.ts`, append to `NAV_ITEMS`:

```ts
  { to: ROUTES.affordai.households, label: 'Households' },
```

In `src/app/AppRoutes.tsx`, add the import and the route inside the `AffordShell` subtree:

```tsx
import { HouseholdsPage } from '@/affordai/pages/Households/HouseholdsPage'
```

```tsx
      <Route path={ROUTES.affordai.households} element={<HouseholdsPage />} />
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 5: Browser check**

Open `http://localhost:5175/affordai/households`. Confirm:
- The heading count reads **12,482 of 12,482 monitored households**
- 25 rows, sorted by affordability score ascending, so the worst households come first
- Pager reads **Page 1 of 500**; Previous is disabled; Next advances and changes the rows
- Typing `10482` narrows to one row; the count reads **1 of 12,482**
- Typing `eastside` narrows to Eastside rows only
- Selecting tier **High risk** gives a count of **623 of 12,482**
- Clicking a column header sorts, and clicking it again reverses; the arrow flips
- Changing any filter resets the pager to page 1
- Typing `zzzz` shows "No households match these filters." and no table rows
- The table scrolls horizontally on a narrow window without the page scrolling sideways
- Console clean, no React key warnings

- [ ] **Step 6: Commit**

```bash
git add src/affordai/components/TierBadge.tsx src/affordai/pages/Households src/affordai/layout/navItems.ts src/app/AppRoutes.tsx
git commit -m "feat(affordai): add the households list with search, filters, and pagination"
```

---

### Task 12: Household detail

**Files:**
- Create: `src/affordai/components/RiskAssessmentCard.tsx`
- Create: `src/affordai/pages/HouseholdDetail/HouseholdDetailPage.tsx`
- Modify: `src/app/AppRoutes.tsx`

**Interfaces:**
- Consumes: `householdById` from `@/affordai/data/selectors`; `factorsFor` from `@/affordai/data/factors`; `areaById` from `@/affordai/data/areas`; `ScoreTimelineChart` from `@/affordai/charts/AffordCharts`; `useAffordStore` from `@/affordai/state/AffordStore`; `useParams` from `react-router`.
- Produces: `RiskAssessmentCard({ household })`, `HouseholdDetailPage`.

No nav item — this page is reached from the households table. This is the page the demo spends the most time on, so every figure on it must be legible without explanation.

- [ ] **Step 1: Write the risk assessment card**

Create `src/affordai/components/RiskAssessmentCard.tsx`:

```tsx
import { Badge } from '@/shared/ui/Badge'
import { Card, SectionHead } from '@/shared/ui/Card'
import { AiRationale } from '@/affordai/components/AiRationale'
import { FactorBars } from '@/affordai/components/FactorBars'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { factorsFor } from '@/affordai/data/factors'
import { useAffordStore } from '@/affordai/state/AffordStore'
import type { Household, Tier } from '@/affordai/data/types'

const TIER_HEADLINE: Record<Tier, string> = {
  stable: 'Stable',
  emerging: 'Emerging vulnerability',
  'high-risk': 'High Risk',
}

const TIER_TONE = { stable: 'mod', emerging: 'high', 'high-risk': 'crit' } as const

const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

export const RiskAssessmentCard = ({ household }: { household: Household }) => {
  const { approvedInterventions, approveIntervention } = useAffordStore()
  const approved = approvedInterventions.some(
    (entry) => entry.householdId === household.id,
  )

  const [first, , last] = household.history
  const incomeChange = ((last.income - first.income) / first.income) * 100
  const rentChange = ((last.rent - first.rent) / first.rent) * 100
  const horizonDays = 90
  const probability = Math.round(household.riskProbability * 100)

  return (
    <Card>
      <SectionHead
        title="AI Vulnerability Assessment"
        note={`Affordability v1.4 · ${horizonDays}-day horizon`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge tone={TIER_TONE[household.tier]}>{TIER_HEADLINE[household.tier]}</Badge>
        <span className="font-mono text-[13px] text-text-mid">
          <span className="text-[22px] font-semibold text-text-hi">{probability}%</span>{' '}
          predicted probability of increased financial vulnerability within{' '}
          {horizonDays} days
        </span>
      </div>

      <div className="mb-4">
        <FactorBars factors={factorsFor(household)} />
      </div>

      <div className="mb-4">
        <AiRationale
          whatHappened={`Estimated monthly income changed ${signed(
            incomeChange,
          )} while monthly rent changed ${signed(rentChange)} between ${first.year} and ${
            last.year
          }.`}
          whyItMatters={`This moved the household's housing burden to ${(
            household.rentBurden * 100
          ).toFixed(
            1,
          )}% of income, above the regional threshold the model associates with tier changes.`}
          modelPrediction={`The model predicts a ${probability}% probability of increased financial vulnerability within ${horizonDays} days, based on available data.`}
          recommendedAction={`Temporary ${household.recommendedSubsidy}% food subsidy, up from the current ${household.currentSubsidy}%.`}
        />
      </div>

      <div className="rounded-lg border border-line-soft bg-ink-2 p-3.5">
        <div className="mb-1 font-mono text-[11px] tracking-wide text-text-low uppercase">
          Recommended intervention
        </div>
        <div className="mb-3 text-[15px] font-semibold">
          Temporary {household.recommendedSubsidy}% food subsidy
        </div>
        {approved ? (
          <div className="rounded-lg border border-teal/40 bg-teal-dim px-3.5 py-2.5 text-[13px] text-teal">
            Approved · {household.recommendedSubsidy}% subsidy queued for household #
            {household.id}
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              approveIntervention(household.id, household.recommendedSubsidy)
            }
            className="rounded-full bg-teal px-4 py-1.5 text-sm font-semibold text-[#08201a] hover:bg-teal/90"
          >
            Approve intervention
          </button>
        )}
        <div className="mt-3">
          <Disclaimer />
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Write the detail page**

Create `src/affordai/pages/HouseholdDetail/HouseholdDetailPage.tsx`:

```tsx
import { Link, useParams } from 'react-router'
import { ROUTES } from '@/app/routes'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { ScoreTimelineChart } from '@/affordai/charts/AffordCharts'
import { MetricRow } from '@/affordai/components/MetricRow'
import { RiskAssessmentCard } from '@/affordai/components/RiskAssessmentCard'
import { TierBadge } from '@/affordai/components/TierBadge'
import { areaById } from '@/affordai/data/areas'
import { householdById } from '@/affordai/data/selectors'

export const HouseholdDetailPage = () => {
  const { householdId } = useParams()
  const household = householdById(Number(householdId))

  if (!household) {
    return (
      <Card>
        <SectionHead title="Household not found" />
        <p className="text-[13px] text-text-mid">
          No monitored household matches id {householdId}.{' '}
          <Link to={ROUTES.affordai.households} className="text-blue hover:text-text-hi">
            Back to households
          </Link>
        </p>
      </Card>
    )
  }

  const timeline = household.history.map((year) => ({
    year: String(year.year),
    income: year.income,
    rent: year.rent,
    score: year.affordabilityScore,
  }))
  const [first, , last] = household.history

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={ROUTES.affordai.households}
          className="font-mono text-[11px] text-blue hover:text-text-hi"
        >
          ← Households
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">Household #{household.id}</h1>
          <TierBadge tier={household.tier} />
        </div>
        <p className="mt-1 text-sm text-text-mid">
          {areaById(household.area).label} · estimated from available data
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,320px)_1fr] gap-5 max-lg:grid-cols-1">
        <Card>
          <SectionHead title="Household profile" />
          <MetricRow label="Household size" value={household.size} />
          <MetricRow
            label="Estimated monthly income"
            value={`$${household.monthlyIncome.toLocaleString('en-US')}`}
          />
          <MetricRow
            label="Monthly rent"
            value={`$${household.monthlyRent.toLocaleString('en-US')}`}
          />
          <MetricRow
            label="Rent burden"
            value={`${(household.rentBurden * 100).toFixed(1)}%`}
            tone="danger"
          />
          <MetricRow
            label="Employment stability"
            value={household.employmentStability}
          />
          <MetricRow label="Location" value={areaById(household.area).label} />
          <MetricRow label="Current subsidy" value={`${household.currentSubsidy}%`} />
          <MetricRow
            label="Recommended subsidy"
            value={`${household.recommendedSubsidy}%`}
            tone="danger"
          />
        </Card>

        <Card>
          <SectionHead
            title="Financial timeline"
            note={`${first.year} – ${last.year}`}
          />
          <div className="h-[280px]">
            <ScoreTimelineChart data={timeline} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            {household.history.map((year) => (
              <div
                key={year.year}
                className="rounded-lg border border-line-soft bg-ink-2 p-3"
              >
                <div className="mb-1.5 font-mono text-[11px] text-text-low">
                  {year.year}
                </div>
                <div className="font-mono text-[12px] text-text-mid">
                  Income{' '}
                  <span className="text-text-hi">
                    ${year.income.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="font-mono text-[12px] text-text-mid">
                  Rent{' '}
                  <span className="text-text-hi">
                    ${year.rent.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="font-mono text-[12px] text-text-mid">
                  Affordability score{' '}
                  <span className="text-[15px] font-semibold text-coral">
                    {year.affordabilityScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Footnote>
            Income and rent read on the left axis, affordability score on the right.
            Scores are <b>estimated</b> and are not a credit assessment.
          </Footnote>
        </Card>
      </div>

      <RiskAssessmentCard household={household} />
    </div>
  )
}
```

- [ ] **Step 3: Register the route**

In `src/app/AppRoutes.tsx`, add the import and the route inside the `AffordShell` subtree, **after** the households route:

```tsx
import { HouseholdDetailPage } from '@/affordai/pages/HouseholdDetail/HouseholdDetailPage'
```

```tsx
      <Route path={ROUTES.affordai.householdDetail} element={<HouseholdDetailPage />} />
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no output, exit 0.

- [ ] **Step 5: Browser check — the hero household**

Open `http://localhost:5175/affordai/households/10482`. Confirm every figure:
- Heading **Household #10482** with a **High risk** badge, subtitle **Eastside**
- Profile: size **4**, income **$4,200**, rent **$1,850**, rent burden **44.0%**, employment stability **Medium**, location **Eastside**, current subsidy **18%**, recommended subsidy **27%**
- Timeline chart with three points; the three year cards read 2024 `$4,600 / $1,500 / 78`, 2025 `$4,400 / $1,700 / 69`, 2026 `$4,200 / $1,850 / 57`
- The income line falls and the rent line rises — the deterioration is obvious without reading numbers
- Assessment card: **High Risk** badge and **82%** predicted probability within 90 days
- Factor bars: Rent burden 34%, Income decline 27%, Food inflation 19%, Household size 12%, Employment instability 8%
- Rationale slot 1 reads income **-8.7%** and rent **+23.3%**; slot 4 reads **Temporary 27% food subsidy, up from the current 18%**
- **Approve intervention** switches to the teal approved state naming household #10482
- Console clean

- [ ] **Step 6: Browser check — navigation and the missing case**

- From `/affordai/households`, click any `#id` link: the detail page loads that household with no `NaN` or `undefined` anywhere
- Open `http://localhost:5175/affordai/households/1`: the "Household not found" card renders with a working link back
- The `← Households` link returns to the list

- [ ] **Step 7: Commit**

```bash
git add src/affordai/components/RiskAssessmentCard.tsx src/affordai/pages/HouseholdDetail src/app/AppRoutes.tsx
git commit -m "feat(affordai): add household detail with financial timeline and risk assessment"
```

---

### Task 13: Vulnerability page

**Files:**
- Modify: `src/affordai/data/selectors.ts` (append `vulnerabilityByIncomeBand`)
- Modify: `src/affordai/data/selectors.test.ts` (append a describe block)
- Create: `src/affordai/pages/Vulnerability/VulnerabilityPage.tsx`
- Modify: `src/affordai/layout/navItems.ts`, `src/app/AppRoutes.tsx`

**Interfaces:**
- Consumes: `vulnerabilitySeries`, `tierCounts`, `areaDetails` from `@/affordai/data/selectors`.
- Produces: `vulnerabilityByIncomeBand(): IncomeBandBreakdown[]` where `IncomeBandBreakdown` is `{ band: string; households: number; vulnerable: number; rate: number }`; `VulnerabilityPage`.

- [ ] **Step 1: Write the failing test**

Append to `src/affordai/data/selectors.test.ts`:

```ts
describe('vulnerabilityByIncomeBand', () => {
  it('covers the whole population across four bands', async () => {
    const { vulnerabilityByIncomeBand } = await import('@/affordai/data/selectors')
    const bands = vulnerabilityByIncomeBand()
    expect(bands).toHaveLength(4)
    expect(bands.reduce((total, band) => total + band.households, 0)).toBe(12482)
    expect(bands.reduce((total, band) => total + band.vulnerable, 0)).toBe(1846)
  })

  it('reports a higher vulnerability rate for lower income bands', async () => {
    const { vulnerabilityByIncomeBand } = await import('@/affordai/data/selectors')
    const bands = vulnerabilityByIncomeBand()
    expect(bands[0].rate).toBeGreaterThan(bands[bands.length - 1].rate)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/affordai/data/selectors.test.ts`
Expected: FAIL — `vulnerabilityByIncomeBand` is not exported.

- [ ] **Step 3: Append the selector**

Add to `src/affordai/data/types.ts`:

```ts
export interface IncomeBandBreakdown {
  band: string
  households: number
  vulnerable: number
  rate: number
}
```

Add `IncomeBandBreakdown` to the type import list in `selectors.ts`, then append:

```ts
const BAND_EDGES: { band: string; min: number; max: number }[] = [
  { band: 'Under $3,000', min: 0, max: 3000 },
  { band: '$3,000 – $5,000', min: 3000, max: 5000 },
  { band: '$5,000 – $7,000', min: 5000, max: 7000 },
  { band: 'Over $7,000', min: 7000, max: Number.POSITIVE_INFINITY },
]

export const vulnerabilityByIncomeBand = (): IncomeBandBreakdown[] =>
  BAND_EDGES.map((edge) => {
    const rows = households.filter(
      (household) =>
        household.monthlyIncome >= edge.min && household.monthlyIncome < edge.max,
    )
    const vulnerable = rows.filter((household) => household.tier !== 'stable').length
    return {
      band: edge.band,
      households: rows.length,
      vulnerable,
      rate: rows.length === 0 ? 0 : Number(((vulnerable / rows.length) * 100).toFixed(1)),
    }
  })
```

- [ ] **Step 4: Run the suite**

Run: `npm test -- --run`
Expected: PASS. If the band totals do not sum to 12,482, the edges overlap or leave a gap — every household must fall in exactly one band.

- [ ] **Step 5: Write the page**

Create `src/affordai/pages/Vulnerability/VulnerabilityPage.tsx`:

```tsx
import { useState } from 'react'
import { Card, Footnote, Legend, SectionHead } from '@/shared/ui/Card'
import { AFFORD_CHART_COLORS, VulnerabilityStackChart } from '@/affordai/charts/AffordCharts'
import { AiInsight } from '@/affordai/components/AiInsight'
import { RangeToggle } from '@/affordai/components/RangeToggle'
import {
  areaDetails,
  tierCounts,
  vulnerabilityByIncomeBand,
  vulnerabilitySeries,
} from '@/affordai/data/selectors'
import type { TimeRange } from '@/affordai/data/types'

export const VulnerabilityPage = () => {
  const [range, setRange] = useState<TimeRange>('90d')
  const counts = tierCounts()
  const areas = areaDetails()
  const bands = vulnerabilityByIncomeBand()

  const cohorts = [
    { label: 'Stable', value: counts.stable, color: AFFORD_CHART_COLORS.stable },
    {
      label: 'Emerging vulnerability',
      value: counts.emerging,
      color: AFFORD_CHART_COLORS.emerging,
    },
    { label: 'High risk', value: counts['high-risk'], color: AFFORD_CHART_COLORS.highRisk },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Vulnerability</h1>
        <p className="mt-1 text-sm text-text-mid">
          How the monitored population moves between affordability tiers over time.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
        {cohorts.map((cohort) => (
          <div
            key={cohort.label}
            className="rounded-[10px] border border-line bg-ink-1 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ backgroundColor: cohort.color }}
              />
              <span className="text-[11px] tracking-wide text-text-low uppercase">
                {cohort.label}
              </span>
            </div>
            <div className="font-mono text-[28px] font-semibold">
              {cohort.value.toLocaleString('en-US')}
            </div>
            <div className="mt-1 text-[11px] text-text-mid">
              {((cohort.value / 12482) * 100).toFixed(1)}% of monitored households
            </div>
          </div>
        ))}
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SectionHead title="Tier composition over time" note="AI-assessed tiers" />
          <RangeToggle value={range} onChange={setRange} />
        </div>
        <Legend
          items={[
            { label: 'Stable', color: AFFORD_CHART_COLORS.stable },
            { label: 'Emerging vulnerability', color: AFFORD_CHART_COLORS.emerging },
            { label: 'High risk', color: AFFORD_CHART_COLORS.highRisk },
          ]}
        />
        <div className="h-[360px]">
          <VulnerabilityStackChart data={vulnerabilitySeries(range)} />
        </div>
        <div className="mt-4">
          <AiInsight>
            Financial vulnerability has increased <b>11.8%</b> in the last 90 days,
            primarily driven by rising housing costs and declining household income.
          </AiInsight>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <Card>
          <SectionHead title="By area" note="Vulnerability rate" />
          <div className="flex flex-col gap-3">
            {[...areas]
              .sort((a, b) => b.vulnerabilityRate - a.vulnerabilityRate)
              .map((area) => (
                <div key={area.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-text-mid">{area.label}</span>
                    <span className="font-mono text-[13px] font-semibold">
                      {area.vulnerabilityRate}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-2">
                    <div
                      className="h-full rounded-full bg-amber"
                      style={{ width: `${(area.vulnerabilityRate / 30) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
          <Footnote>Bars are scaled against a 30% reference rate.</Footnote>
        </Card>

        <Card>
          <SectionHead title="By income band" note="Households and vulnerability rate" />
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 font-mono text-[11px] tracking-wide text-text-low uppercase">
                  Band
                </th>
                <th className="py-2 text-right font-mono text-[11px] tracking-wide text-text-low uppercase">
                  Households
                </th>
                <th className="py-2 text-right font-mono text-[11px] tracking-wide text-text-low uppercase">
                  Vulnerable
                </th>
                <th className="py-2 text-right font-mono text-[11px] tracking-wide text-text-low uppercase">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {bands.map((band) => (
                <tr key={band.band} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 text-[13px] text-text-mid">{band.band}</td>
                  <td className="py-2.5 text-right font-mono text-[13px]">
                    {band.households.toLocaleString('en-US')}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px]">
                    {band.vulnerable.toLocaleString('en-US')}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px] font-semibold text-coral">
                    {band.rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Register the route and nav item**

`navItems.ts`: append `{ to: ROUTES.affordai.vulnerability, label: 'Vulnerability' },`
`AppRoutes.tsx`: import `VulnerabilityPage` and add `<Route path={ROUTES.affordai.vulnerability} element={<VulnerabilityPage />} />`.

- [ ] **Step 7: Typecheck and browser check**

Run: `npm run typecheck`

Open `http://localhost:5175/affordai/vulnerability`. Confirm:
- Three cohort cards summing to **12,482**, reading **10,636** stable, **1,223** emerging, **623** high risk
- The stacked chart and range toggle behave as on Overview
- By area: four bars, Eastside highest
- By income band: four rows, households column sums to **12,482**, vulnerable column sums to **1,846**, and the rate falls as income rises
- Console clean

- [ ] **Step 8: Commit**

```bash
git add src/affordai/data/selectors.ts src/affordai/data/selectors.test.ts src/affordai/data/types.ts src/affordai/pages/Vulnerability src/affordai/layout/navItems.ts src/app/AppRoutes.tsx
git commit -m "feat(affordai): add the vulnerability page with area and income breakdowns"
```

---

### Task 14: Predictions page

**Files:**
- Create: `src/affordai/pages/Predictions/PredictionsPage.tsx`
- Modify: `src/affordai/layout/navItems.ts`, `src/app/AppRoutes.tsx`

**Interfaces:**
- Consumes: `forecast90d` from `@/affordai/data/selectors`; `ForecastLineChart` from `@/affordai/charts/AffordCharts`; `FactorBars`, `AiInsight`, `Disclaimer`.
- Produces: `PredictionsPage`.

- [ ] **Step 1: Write the page**

Create `src/affordai/pages/Predictions/PredictionsPage.tsx`:

```tsx
import { Card, Footnote, Legend, SectionHead } from '@/shared/ui/Card'
import { Kpi } from '@/shared/ui/Kpi'
import { AFFORD_CHART_COLORS, ForecastLineChart } from '@/affordai/charts/AffordCharts'
import { AiInsight } from '@/affordai/components/AiInsight'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { FactorBars } from '@/affordai/components/FactorBars'
import { forecast90d } from '@/affordai/data/selectors'

export const PredictionsPage = () => {
  const forecast = forecast90d()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Financial Vulnerability Forecast</h1>
        <p className="mt-1 text-sm text-text-mid">
          A 90-day projection of how many monitored households the model expects to be
          financially vulnerable, based on available data.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
        <Kpi
          label="Current vulnerable households"
          value={forecast.current.toLocaleString('en-US')}
          tone="warn"
        />
        <Kpi
          label="Projected in 90 days"
          value={forecast.projected.toLocaleString('en-US')}
          delta={`+${forecast.changePercent}%`}
          deltaTone="up"
          tone="danger"
        />
        <Kpi
          label="Prediction confidence"
          value={`${forecast.confidence}%`}
          tone="neutral"
        />
      </div>

      <Card>
        <SectionHead
          title="Historical and projected vulnerability"
          note="Solid: observed · Dashed: predicted"
        />
        <Legend
          items={[
            { label: 'Historical', color: AFFORD_CHART_COLORS.projected },
            { label: 'Projected', color: AFFORD_CHART_COLORS.highRisk },
          ]}
        />
        <div className="h-[340px]">
          <ForecastLineChart data={forecast.series} />
        </div>
        <div className="mt-4">
          <AiInsight>
            The model projects <b>{forecast.projected.toLocaleString('en-US')}</b>{' '}
            vulnerable households in 90 days, up <b>{forecast.changePercent}%</b> from{' '}
            {forecast.current.toLocaleString('en-US')} today, at{' '}
            <b>{forecast.confidence}%</b> confidence.
          </AiInsight>
        </div>
        <Footnote>
          The two lines share the <b>Now</b> point so the projection continues the
          observed series rather than starting a second one.
        </Footnote>
      </Card>

      <Card>
        <SectionHead
          title="Main predicted drivers"
          note="Estimated contribution to the projection"
        />
        <FactorBars factors={forecast.drivers} title="Predicted drivers" />
        <div className="mt-3">
          <Disclaimer />
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Register the route and nav item**

`navItems.ts`: append `{ to: ROUTES.affordai.predictions, label: 'Predictions' },`
`AppRoutes.tsx`: import `PredictionsPage` and add its route.

- [ ] **Step 3: Typecheck and browser check**

Run: `npm run typecheck`

Open `http://localhost:5175/affordai/predictions`. Confirm:
- KPIs read **1,846**, **2,213** with **+19.9%**, and **84%**
- The chart shows a solid blue line rising to `Now` and a dashed coral line continuing to `+90d` at 2,213, joined at `Now` with no gap
- The AI insight sentence reads the same three numbers
- Predicted drivers: Housing costs 38%, Food inflation 27%, Income volatility 21%, Employment changes 14%
- Console clean

- [ ] **Step 4: Commit**

```bash
git add src/affordai/pages/Predictions src/affordai/layout/navItems.ts src/app/AppRoutes.tsx
git commit -m "feat(affordai): add the 90-day vulnerability forecast page"
```

---

### Task 15: Impact page

**Files:**
- Create: `src/affordai/pages/Impact/ImpactPage.tsx`
- Modify: `src/affordai/layout/navItems.ts`, `src/app/AppRoutes.tsx`

**Interfaces:**
- Consumes: `impactMetrics` from `@/affordai/data/selectors`; `useAffordStore` from `@/affordai/state/AffordStore`; `BeforeAfterChart` from `@/affordai/charts/AffordCharts`.
- Produces: `ImpactPage`.

**This is the page the demo closes on.** Interventions approved during the session are added on top of the baseline figures, which is what makes demo step 10 respond to demo step 9.

- [ ] **Step 1: Write the page**

Create `src/affordai/pages/Impact/ImpactPage.tsx`:

```tsx
import { Card, Footnote, Legend, SectionHead } from '@/shared/ui/Card'
import { Kpi } from '@/shared/ui/Kpi'
import { AFFORD_CHART_COLORS, BeforeAfterChart } from '@/affordai/charts/AffordCharts'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { impactMetrics } from '@/affordai/data/selectors'
import { useAffordStore } from '@/affordai/state/AffordStore'

export const ImpactPage = () => {
  const baseline = impactMetrics()
  const { approvedInterventions, approvedRecommendations } = useAffordStore()

  // Approvals made during this session count toward the program totals, so the
  // number moves when an administrator acts. Reloading resets to the baseline.
  const sessionApprovals = approvedInterventions.length
  const stabilized = baseline.householdsStabilized + sessionApprovals
  const prevented = baseline.preventedFromHighRisk + sessionApprovals

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Impact</h1>
        <p className="mt-1 text-sm text-text-mid">
          Whether the interventions this program approved are actually working.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-sm:grid-cols-1">
        <Kpi
          label="Households stabilized"
          value={stabilized.toLocaleString('en-US')}
          delta={sessionApprovals > 0 ? `+${sessionApprovals} this session` : undefined}
          deltaTone="down"
          tone="ok"
        />
        <Kpi
          label="Avg. subsidy per household"
          value={`$${baseline.averageSubsidyPerHousehold}`}
          tone="neutral"
        />
        <Kpi
          label="Reduction in vulnerability"
          value={`${baseline.vulnerabilityReduction}%`}
          tone="ok"
        />
        <Kpi
          label="Cost per successful intervention"
          value={`$${baseline.costPerSuccessfulIntervention}`}
          tone="neutral"
        />
        <Kpi
          label="Approved recommendations"
          value={approvedRecommendations.length}
          tone="neutral"
        />
      </div>

      <Card>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="font-mono text-[11px] tracking-wide text-text-low uppercase">
            Estimated households prevented from entering high-risk status
          </div>
          <div className="font-mono text-[56px] leading-none font-semibold text-teal max-sm:text-[40px]">
            {prevented.toLocaleString('en-US')}
          </div>
          <p className="max-w-[560px] text-[13px] leading-relaxed text-text-mid">
            Estimated by comparing each intervened household's observed tier against the
            model's counterfactual projection for the same 90-day window.
          </p>
          {sessionApprovals > 0 && (
            <p className="text-[12px] text-teal">
              Includes {sessionApprovals} intervention
              {sessionApprovals === 1 ? '' : 's'} approved in this session.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <SectionHead title="Before and after intervention" note="Program to date" />
        <Legend
          items={[
            { label: 'Before', color: AFFORD_CHART_COLORS.highRisk },
            { label: 'After', color: AFFORD_CHART_COLORS.stable },
          ]}
        />
        <div className="h-[300px]">
          <BeforeAfterChart data={baseline.beforeAfter} />
        </div>
        <Footnote>
          Lower is better on every measure shown. Figures are <b>estimated</b> from
          available data.
        </Footnote>
        <div className="mt-3">
          <Disclaimer />
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Register the route and nav item**

`navItems.ts`: append `{ to: ROUTES.affordai.impact, label: 'Impact' },`
`AppRoutes.tsx`: import `ImpactPage` and add its route.

- [ ] **Step 3: Typecheck and browser check**

Run: `npm run typecheck`

Open `http://localhost:5175/affordai/impact`. Confirm:
- KPIs read **1,284**, **$143**, **11.6%**, **$418**, **0**
- The hero metric reads **412**
- Before/after chart with three grouped pairs, the coral bar taller than the teal bar in every pair

Then run the connection that matters:
- Go to `/affordai/households/10482`, click **Approve intervention**
- Return to `/affordai/impact`: households stabilized now reads **1,285** with `+1 this session`, and the hero metric reads **413** with the "Includes 1 intervention approved in this session" line
- Approve a recommendation on Overview, return to Impact: **Approved recommendations** reads **1**
- Reload the page: everything returns to the baseline. Expected — the store is in-memory.
- Console clean

- [ ] **Step 4: Commit**

```bash
git add src/affordai/pages/Impact src/affordai/layout/navItems.ts src/app/AppRoutes.tsx
git commit -m "feat(affordai): add the impact page wired to session approvals"
```

---

### Task 16: Subsidies page

**Files:**
- Modify: `src/affordai/data/selectors.ts` (append `subsidyAllocations`)
- Modify: `src/affordai/data/narrative.test.ts` (append a describe block)
- Create: `src/affordai/pages/Subsidies/SubsidiesPage.tsx`
- Modify: `src/affordai/layout/navItems.ts`, `src/app/AppRoutes.tsx`

**Interfaces:**
- Produces: `subsidyAllocations(): SubsidyAllocation[]` where `SubsidyAllocation` is `{ areaId: AreaId; areaLabel: string; households: number; averageSubsidy: number; monthlyCost: number }`; `SubsidiesPage`.

A simple screen by design: an allocation table and the list of approved interventions. It does one thing completely.

- [ ] **Step 1: Write the failing test**

Append to `src/affordai/data/narrative.test.ts`:

```ts
describe('subsidyAllocations', () => {
  it('covers every area and accounts for the vulnerable population', async () => {
    const { subsidyAllocations } = await import('@/affordai/data/selectors')
    const rows = subsidyAllocations()
    expect(rows).toHaveLength(4)
    expect(rows.reduce((total, row) => total + row.households, 0)).toBe(1846)
    expect(rows.every((row) => row.monthlyCost > 0)).toBe(true)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- --run src/affordai/data/narrative.test.ts`
Expected: FAIL — `subsidyAllocations` is not exported.

- [ ] **Step 3: Append the selector**

Add to `src/affordai/data/types.ts`:

```ts
export interface SubsidyAllocation {
  areaId: AreaId
  areaLabel: string
  households: number
  averageSubsidy: number
  monthlyCost: number
}
```

Add `SubsidyAllocation` to the type import list in `selectors.ts`, then append:

```ts
/** Allocation covers the vulnerable population only — stable households are not subsidised. */
export const subsidyAllocations = (): SubsidyAllocation[] =>
  AREAS.map((area) => {
    const rows = households.filter(
      (household) => household.area === area.id && household.tier !== 'stable',
    )
    const averageSubsidy = mean(rows.map((row) => row.currentSubsidy))
    return {
      areaId: area.id,
      areaLabel: area.label,
      households: rows.length,
      averageSubsidy: Number(averageSubsidy.toFixed(1)),
      monthlyCost: Math.round(rows.length * averageSubsidy * 5.4),
    }
  })
```

- [ ] **Step 4: Run the suite**

Run: `npm test -- --run`
Expected: PASS.

- [ ] **Step 5: Write the page**

Create `src/affordai/pages/Subsidies/SubsidiesPage.tsx`:

```tsx
import { Link } from 'react-router'
import { householdPath } from '@/app/routes'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { recommendations, subsidyAllocations } from '@/affordai/data/selectors'
import { useAffordStore } from '@/affordai/state/AffordStore'

export const SubsidiesPage = () => {
  const allocations = subsidyAllocations()
  const { approvedInterventions, approvedRecommendations } = useAffordStore()
  const approvedRecs = recommendations().filter((recommendation) =>
    approvedRecommendations.includes(recommendation.id),
  )
  const totalCost = allocations.reduce((total, row) => total + row.monthlyCost, 0)

  const headerClass =
    'py-2 font-mono text-[11px] tracking-wide text-text-low uppercase'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Subsidies</h1>
        <p className="mt-1 text-sm text-text-mid">
          Where the program's subsidy budget is allocated, and what has been approved.
        </p>
      </div>

      <Card>
        <SectionHead title="Allocation by area" note="Vulnerable households only" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className={headerClass}>Area</th>
                <th className={`${headerClass} text-right`}>Households</th>
                <th className={`${headerClass} text-right`}>Avg. subsidy</th>
                <th className={`${headerClass} text-right`}>Monthly cost</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((row) => (
                <tr key={row.areaId} className="border-b border-line-soft">
                  <td className="py-2.5 text-[13px] text-text-mid">{row.areaLabel}</td>
                  <td className="py-2.5 text-right font-mono text-[13px]">
                    {row.households.toLocaleString('en-US')}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px]">
                    {row.averageSubsidy}%
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px]">
                    ${row.monthlyCost.toLocaleString('en-US')}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5 text-[13px] font-semibold">Total</td>
                <td className="py-2.5 text-right font-mono text-[13px] font-semibold">
                  {allocations
                    .reduce((total, row) => total + row.households, 0)
                    .toLocaleString('en-US')}
                </td>
                <td />
                <td className="py-2.5 text-right font-mono text-[13px] font-semibold">
                  ${totalCost.toLocaleString('en-US')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Footnote>
          Monthly cost is <b>estimated</b> from the average subsidy percentage applied to
          a modeled essential-goods basket.
        </Footnote>
      </Card>

      <Card>
        <SectionHead
          title="Approved this session"
          note={`${approvedInterventions.length + approvedRecs.length} approvals`}
        />
        {approvedInterventions.length === 0 && approvedRecs.length === 0 ? (
          <p className="py-4 text-[13px] text-text-low">
            Nothing approved yet. Approve a recommendation on Overview or an intervention
            on a household to see it here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {approvedRecs.map((recommendation) => (
              <li
                key={recommendation.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft pb-2 last:border-0"
              >
                <span className="text-[13px] text-text-hi">{recommendation.title}</span>
                <span className="font-mono text-[12px] text-teal">
                  {recommendation.subsidyFrom}% → {recommendation.subsidyTo}%
                </span>
              </li>
            ))}
            {approvedInterventions.map((intervention) => (
              <li
                key={intervention.householdId}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft pb-2 last:border-0"
              >
                <Link
                  to={householdPath(intervention.householdId)}
                  className="text-[13px] text-blue hover:text-text-hi"
                >
                  Household #{intervention.householdId}
                </Link>
                <span className="font-mono text-[12px] text-teal">
                  {intervention.subsidy}% food subsidy
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Disclaimer />
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 6: Register the route and nav item**

`navItems.ts`: append `{ to: ROUTES.affordai.subsidies, label: 'Subsidies' },` — place it after Vulnerability to match the brief's sidebar order.
`AppRoutes.tsx`: import `SubsidiesPage` and add its route.

- [ ] **Step 7: Typecheck and browser check**

Run: `npm run typecheck`

Open `http://localhost:5175/affordai/subsidies`. Confirm:
- Four area rows plus a Total row; the households column totals **1,846**
- No cell shows `NaN`
- "Approved this session" shows the empty-state sentence on a fresh load
- Approve an intervention on household #10482, return here: it appears as a linked row reading `27% food subsidy`, and the link opens that household
- Console clean

- [ ] **Step 8: Commit**

```bash
git add src/affordai/data/selectors.ts src/affordai/data/types.ts src/affordai/data/narrative.test.ts src/affordai/pages/Subsidies src/affordai/layout/navItems.ts src/app/AppRoutes.tsx
git commit -m "feat(affordai): add the subsidies allocation page"
```

---

### Task 17: Market Prices and the subsidy calculator

**Files:**
- Create: `src/affordai/pages/MarketPrices/MarketPricesPage.tsx`
- Modify: `src/affordai/layout/navItems.ts`, `src/app/AppRoutes.tsx`

**Interfaces:**
- Consumes: `productsByCategory`, `householdById`, `searchHouseholds`, `DEFAULT_QUERY` from `@/affordai/data/selectors`; `HERO_HOUSEHOLD_ID` from `@/affordai/data/heroes`; `ProductCategory` from `@/affordai/data/types`.
- Produces: `MarketPricesPage`.

The one message this page must land: **the platform never changes the market price.** It sets the subsidy so qualifying households pay less.

- [ ] **Step 1: Write the page**

Create `src/affordai/pages/MarketPrices/MarketPricesPage.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { TierBadge } from '@/affordai/components/TierBadge'
import { HERO_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import {
  DEFAULT_QUERY,
  householdById,
  productsByCategory,
  searchHouseholds,
} from '@/affordai/data/selectors'
import type { ProductCategory } from '@/affordai/data/types'

const CATEGORIES: (ProductCategory | 'all')[] = [
  'all',
  'Dairy',
  'Protein',
  'Grains',
  'Produce',
]

const money = (value: number) => `$${value.toFixed(2)}`

export const MarketPricesPage = () => {
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')
  const [householdIdInput, setHouseholdIdInput] = useState(String(HERO_HOUSEHOLD_ID))

  // A short list of high-risk households to choose from, plus the hero household,
  // so the selector is useful without typing an id from memory.
  const options = useMemo(() => {
    const page = searchHouseholds({
      ...DEFAULT_QUERY,
      tier: 'high-risk',
      pageSize: 12,
    })
    const ids = [HERO_HOUSEHOLD_ID, ...page.rows.map((row) => row.id)]
    return [...new Set(ids)]
  }, [])

  const household = householdById(Number(householdIdInput))
  const products = productsByCategory(category)

  // The subsidy the model recommends for this household, applied to market price.
  const recommendedFor = (marketPrice: number) =>
    household ? marketPrice * (1 - household.recommendedSubsidy / 100) : marketPrice

  const headerClass = 'py-2 font-mono text-[11px] tracking-wide text-text-low uppercase'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Market Prices</h1>
        <p className="mt-1 text-sm text-text-mid">
          What essential goods cost, and what a qualifying household pays once its
          subsidy is applied.
        </p>
      </div>

      <div className="rounded-lg border border-blue/40 bg-blue/10 p-3.5">
        <div className="mb-1 font-mono text-[11px] font-semibold tracking-wide text-blue uppercase">
          How this works
        </div>
        <p className="text-[13px] leading-relaxed text-text-mid">
          <b className="text-text-hi">Market price remains unchanged.</b> The platform
          does not set or negotiate retail prices. It determines the appropriate subsidy
          so qualifying households pay less for the same goods.
        </p>
      </div>

      <Card>
        <SectionHead title="Subsidy calculator" note="Select a household and a category" />
        <div className="mb-4 flex flex-wrap gap-2.5">
          <select
            value={householdIdInput}
            onChange={(event) => setHouseholdIdInput(event.target.value)}
            className="rounded-md border border-line bg-ink-2 px-2.5 py-1.5 text-[13px] text-text-hi"
          >
            {options.map((id) => (
              <option key={id} value={id}>
                Household #{id}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ProductCategory | 'all')
            }
            className="rounded-md border border-line bg-ink-2 px-2.5 py-1.5 text-[13px] text-text-hi"
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value === 'all' ? 'All categories' : value}
              </option>
            ))}
          </select>
        </div>

        {household && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-line-soft bg-ink-2 px-3.5 py-2.5">
            <TierBadge tier={household.tier} />
            <span className="font-mono text-[12px] text-text-mid">
              Current subsidy{' '}
              <span className="font-semibold text-text-hi">
                {household.currentSubsidy}%
              </span>{' '}
              · AI-recommended{' '}
              <span className="font-semibold text-teal">
                {household.recommendedSubsidy}%
              </span>
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className={headerClass}>Product</th>
                <th className={`${headerClass} text-right`}>Market price</th>
                <th className={`${headerClass} text-right`}>Current price</th>
                <th className={`${headerClass} text-right`}>Recommended price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 text-[13px] text-text-mid">
                    {product.label}
                    <span className="ml-2 font-mono text-[11px] text-text-low">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px] text-text-hi">
                    {money(product.marketPrice)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px] text-amber">
                    {money(product.currentPrice)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px] font-semibold text-teal">
                    {money(
                      household ? recommendedFor(product.marketPrice) : product.recommendedPrice,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Footnote>
          Recommended price applies the selected household's{' '}
          <b>AI-recommended subsidy</b> to the unchanged market price. Current price
          reflects the subsidy in effect today.
        </Footnote>
        <div className="mt-3">
          <Disclaimer />
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Register the route and nav item**

`navItems.ts`: append `{ to: ROUTES.affordai.marketPrices, label: 'Market Prices' },`
`AppRoutes.tsx`: import `MarketPricesPage` and add its route.

- [ ] **Step 3: Typecheck and browser check**

Run: `npm run typecheck`

Open `http://localhost:5175/affordai/market-prices`. Confirm:
- The "How this works" callout states **Market price remains unchanged.** in brighter text
- Household #10482 is selected by default, showing a High risk badge, current **18%**, recommended **27%**
- Eight product rows; Milk reads market **$4.50**, current **$3.70**, recommended **$3.29** (4.50 × 0.73)
- Changing the household changes only the Recommended price column; the Market price column never moves
- Selecting **Dairy** narrows to Milk and Cheese; **All categories** restores all eight
- Console clean

- [ ] **Step 4: Commit**

```bash
git add src/affordai/pages/MarketPrices src/affordai/layout/navItems.ts src/app/AppRoutes.tsx
git commit -m "feat(affordai): add market prices with the subsidy calculator"
```

---

### Task 18: Data Sources and Settings

**Files:**
- Create: `src/affordai/pages/DataSources/DataSourcesPage.tsx`
- Create: `src/affordai/pages/Settings/SettingsPage.tsx`
- Modify: `src/affordai/layout/navItems.ts`, `src/app/AppRoutes.tsx`

**Interfaces:**
- Consumes: `tierThresholds`, `HOUSEHOLD_COUNT`, `TARGET_HIGH_RISK`, `TARGET_VULNERABLE` from `@/affordai/data/households`; `POPULATION_FACTORS` from `@/affordai/data/factors`.
- Produces: `DataSourcesPage`, `SettingsPage`.

These two ship together because each is one card's worth of content. Settings is **read-only and labeled as such** — no dead inputs.

- [ ] **Step 1: Write the data sources page**

Create `src/affordai/pages/DataSources/DataSourcesPage.tsx`:

```tsx
import { Badge } from '@/shared/ui/Badge'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { MetricRow } from '@/affordai/components/MetricRow'

interface SourceEntry {
  signal: string
  origin: string
  cadence: string
  access: 'Public' | 'Protected'
}

const SOURCES: SourceEntry[] = [
  { signal: 'Household income', origin: 'Program intake records', cadence: 'Monthly', access: 'Protected' },
  { signal: 'Rent and housing cost', origin: 'ACS + regional rent index', cadence: 'Quarterly', access: 'Public' },
  { signal: 'Food price index', origin: 'Regional CPI basket', cadence: 'Monthly', access: 'Public' },
  { signal: 'Employment stability', origin: 'Program intake records', cadence: 'Quarterly', access: 'Protected' },
  { signal: 'Household composition', origin: 'Program intake records', cadence: 'On change', access: 'Protected' },
  { signal: 'Subsidy disbursement history', origin: 'Program ledger', cadence: 'Monthly', access: 'Protected' },
]

const headerClass = 'py-2 font-mono text-[11px] tracking-wide text-text-low uppercase'

export const DataSourcesPage = () => (
  <div className="flex flex-col gap-6">
    <div>
      <h1 className="text-xl font-semibold">Data Sources</h1>
      <p className="mt-1 text-sm text-text-mid">
        What the affordability model reads, where it comes from, and how often it
        refreshes.
      </p>
    </div>

    <Card>
      <SectionHead title="Input signals" note="Public vs. protected in a real deployment" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th className={headerClass}>Signal</th>
              <th className={headerClass}>Origin</th>
              <th className={headerClass}>Refresh</th>
              <th className={headerClass}>Access</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((source) => (
              <tr key={source.signal} className="border-b border-line-soft last:border-0">
                <td className="py-2.5 text-[13px] text-text-hi">{source.signal}</td>
                <td className="py-2.5 text-[13px] text-text-mid">{source.origin}</td>
                <td className="py-2.5 font-mono text-[12px] text-text-mid">
                  {source.cadence}
                </td>
                <td className="py-2.5">
                  <Badge tone={source.access === 'Protected' ? 'crit' : 'mod'}>
                    {source.access}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footnote>
        Every figure in this prototype is <b>synthetic</b>, modeled on plausible
        distributions. No real household data is present.
      </Footnote>
    </Card>

    <Card>
      <SectionHead title="Model card" note="Affordability v1.4" />
      <MetricRow label="Model" value="Affordability v1.4" />
      <MetricRow label="Task" value="90-day vulnerability tier prediction" />
      <MetricRow label="Output" value="Tier, probability, factor attribution" />
      <MetricRow label="Last updated" value="2 hours ago" />
      <MetricRow label="Status" value="Operational" />
      <MetricRow label="Known limitation" value="Sparse income reporting in South County" />
      <div className="mt-3">
        <Disclaimer />
      </div>
    </Card>
  </div>
)
```

- [ ] **Step 2: Write the settings page**

Create `src/affordai/pages/Settings/SettingsPage.tsx`:

```tsx
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { MetricRow } from '@/affordai/components/MetricRow'
import { POPULATION_FACTORS } from '@/affordai/data/factors'
import {
  HOUSEHOLD_COUNT,
  TARGET_HIGH_RISK,
  TARGET_VULNERABLE,
  tierThresholds,
} from '@/affordai/data/households'

export const SettingsPage = () => (
  <div className="flex flex-col gap-6">
    <div>
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-text-mid">
        The thresholds and weights the affordability model currently runs with.
      </p>
    </div>

    <div className="rounded-lg border border-line-soft bg-ink-2 px-3.5 py-2.5">
      <p className="text-[13px] text-text-mid">
        <b className="text-text-hi">Read-only.</b> Model configuration is managed by the
        program's data team. Changing thresholds re-scores the whole population and is
        outside this console.
      </p>
    </div>

    <Card>
      <SectionHead title="Tier thresholds" note="Affordability score boundaries" />
      <MetricRow
        label="High risk — affordability score below"
        value={tierThresholds.highRiskBelow}
        tone="danger"
      />
      <MetricRow
        label="Emerging vulnerability — score below"
        value={tierThresholds.emergingBelow}
      />
      <MetricRow label="Stable — score at or above" value={tierThresholds.emergingBelow} />
      <Footnote>
        Boundaries are derived from a capacity-based percentile cut over the monitored
        population: the {TARGET_HIGH_RISK} lowest-scoring households are high risk, and{' '}
        {TARGET_VULNERABLE.toLocaleString('en-US')} of{' '}
        {HOUSEHOLD_COUNT.toLocaleString('en-US')} are vulnerable in total.
      </Footnote>
    </Card>

    <Card>
      <SectionHead title="Prediction horizon" />
      <MetricRow label="Vulnerability horizon" value="90 days" />
      <MetricRow label="Forecast confidence floor" value="70%" />
      <MetricRow label="Re-scoring cadence" value="Every 6 hours" />
    </Card>

    <Card>
      <SectionHead title="Population factor weights" note="Sums to 100%" />
      {POPULATION_FACTORS.map((factor) => (
        <MetricRow
          key={factor.label}
          label={factor.label}
          value={`${factor.contribution}%`}
        />
      ))}
    </Card>
  </div>
)
```

- [ ] **Step 3: Register both routes and nav items**

`navItems.ts`: append, in this order:

```ts
  { to: ROUTES.affordai.dataSources, label: 'Data Sources' },
  { to: ROUTES.affordai.settings, label: 'Settings' },
```

`AppRoutes.tsx`: import both pages and add both routes.

- [ ] **Step 4: Typecheck and browser check**

Run: `npm run typecheck`

Open `http://localhost:5175/affordai/data-sources`. Confirm six signal rows with Public/Protected badges, and a model card reading **Affordability v1.4**.

Open `http://localhost:5175/affordai/settings`. Confirm:
- The **Read-only** notice
- Tier thresholds showing two real numbers derived from the percentile cut — not `undefined`, and high-risk lower than emerging
- The footnote naming **623** and **1,846** of **12,482**
- Factor weights listing five rows summing to 100%
- Console clean

- [ ] **Step 5: Commit**

```bash
git add src/affordai/pages/DataSources src/affordai/pages/Settings src/affordai/layout/navItems.ts src/app/AppRoutes.tsx
git commit -m "feat(affordai): add data sources and read-only settings pages"
```

---

### Task 19: Cross-links, sidebar order, README, and the demo walkthrough

**Files:**
- Modify: `src/affordai/layout/navItems.ts` (final order)
- Modify: `src/affordai/layout/AffordShell.tsx` (link back to Radar)
- Modify: `src/layouts/AppShell/AppShell.tsx` (link to AffordAI)
- Modify: `README.md`

**Interfaces:** none new. This task adds no components.

- [ ] **Step 1: Put the sidebar in the brief's order**

Rewrite the `NAV_ITEMS` array in `src/affordai/layout/navItems.ts` so the order matches the brief exactly:

```ts
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
```

- [ ] **Step 2: Link from AffordAI back to Radar**

In `src/affordai/layout/AffordShell.tsx`, add the import:

```tsx
import { Link } from 'react-router'
```

Insert this directly after `<Disclaimer />` in the sidebar footer:

```tsx
          <Link
            to={ROUTES.radar.triage}
            className="font-mono text-[11px] text-text-low hover:text-text-hi"
          >
            ← Radar console
          </Link>
```

- [ ] **Step 3: Link from Radar to AffordAI**

In `src/layouts/AppShell/AppShell.tsx`, add one entry to the end of `NAV_ITEMS`:

```ts
  { to: ROUTES.affordai.overview, label: 'AffordAI' },
```

The existing `navLinkClass` and `NavLink` rendering handle it with no other change. Do not restyle Radar's header.

- [ ] **Step 4: Update the README**

In `README.md`, make these four edits:

1. Change the first line under the title from the single-product description to name both products: `radar-web` hosts two hackathon prototypes — **Radar**, the Downtown women's homelessness prevention console at `/`, and **AffordAI**, an AI-powered affordability and subsidy intelligence console at `/affordai`.
2. In the **Stack** table, change the React Router row's reason from "Client-side routing between the five pages" to "Client-side routing across both products" and add a row: `| Vitest | Data-layer tests for the AffordAI synthetic dataset |`
3. In **Project layout**, add the `affordai/` subtree under `src/` mirroring the File Structure section of this plan, and note that `shared/ui` is used by both products while `shared/charts` is Radar-only.
4. In **Other commands**, add: `| npm test | Runs the AffordAI data-layer tests |`
5. In **Not included yet**, keep the existing text and add that AffordAI's approvals are in-memory and reset on reload, and that its geographic view is a panel of areas rather than a real map library.

- [ ] **Step 5: Full verification**

Run all three:

```bash
npm test -- --run
npm run typecheck
npm run build
```

Expected: tests pass, typecheck silent, build produces `dist/` with no errors.

- [ ] **Step 6: Verify Radar is untouched in behavior**

Open `http://localhost:5175/`. Confirm all five Radar pages still load from the top bar, the Donate button still works, and the header now shows an **AffordAI** nav item that reaches `/affordai`.

- [ ] **Step 7: Walk the ten-step demo end to end**

This is the acceptance criterion for the whole plan. Reload first so the store starts empty.

1. Open `/affordai` — five KPI cards read 12,482 / 1,846 / 623 / $184K / 87%
2. The vulnerability chart shows the vulnerable bands growing; the AI insight names 11.8%
3. In Geographic view, select **Eastside** — the highest vulnerability rate of the four
4. Go to Households, search `10482`, open it
5. The financial timeline shows income falling 4,600 → 4,200 and rent rising 1,500 → 1,850, score 78 → 57
6. The assessment card reads **High Risk**, **82%** within 90 days
7. Expand the factor bars — Rent burden 34% leads
8. The recommended intervention reads **Temporary 27% food subsidy**
9. Click **Approve intervention** — the card switches to the approved state
10. Go to Impact — households stabilized reads 1,285 (`+1 this session`) and the hero metric reads **413**

Every step must land without an error in the console. If step 10 does not respond to step 9, the store is mounted below the `<Outlet />` instead of above it.

- [ ] **Step 8: Commit**

```bash
git add src/affordai/layout src/layouts/AppShell/AppShell.tsx README.md
git commit -m "feat(affordai): add cross-product links, final sidebar order, and readme"
```

---

## Done when

- `npm test -- --run`, `npm run typecheck`, and `npm run build` all pass
- All ten AffordAI routes render, and all nine sidebar items lead somewhere real
- Radar's five pages and Donate flow are unchanged
- The ten-step demo walkthrough in Task 19 Step 7 completes end to end
