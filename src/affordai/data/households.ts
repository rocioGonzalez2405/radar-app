/**
 * SIMULATED POPULATION — read this before trusting any number that comes out of
 * this file.
 *
 * The 12,482 households below are generated, not sampled. Every per-household
 * field — income, rent, burden, score, risk probability, subsidy, and the
 * twenty-four months of history — is synthetic, and so are the tier counts
 * derived from them.
 *
 * Why there is no alternative: individual household income and rent records are
 * protected and have no public aggregate at household level, and no subsidy
 * program caseload roster for San Diego County is published. A real caseload
 * cannot be reconstructed from public data, so it is modeled instead and said
 * to be modeled. This is the same position Radar takes for its triage rows in
 * src/shared/data/radarData.ts.
 *
 * What IS grounded: the county-level anchors these households are generated
 * around — average asking rent, the cost-burden bands, unemployment — all of
 * which are verified public figures in costBurden.ts. The area-level spread
 * between those anchors and these households is modeled; areas.ts says so.
 *
 * Radar's top bar shows "Data verified through August 2026" above this section.
 * That badge covers the anchors, never this population.
 */
import { AREAS } from '@/affordai/data/areas'
import { historyMonths } from '@/affordai/data/calendar'
import { heroHouseholds } from '@/affordai/data/heroes'
import { createRng, floatBetween, intBetween, pick, roundTo } from '@/affordai/data/seed'
import { featuresFor } from '@/affordai/model/features'
import { predictRisk } from '@/affordai/model/riskModel'
import { recommendSubsidy } from '@/affordai/model/subsidyEngine'
import type {
  AreaId,
  EmploymentStability,
  Household,
  HouseholdMonth,
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

/**
 * The affordability score is a DESCRIPTIVE index of where the household stands
 * today, and it is what the percentile cut ranks on. It is not the risk model
 * — that lives in model/riskModel.ts and answers a forward-looking question
 * from the trends this generator lays down. Keeping the two apart is what lets
 * a household score acceptably today and still be flagged as deteriorating.
 */
const scoreFor = (
  burden: number,
  size: number,
  stability: EmploymentStability,
  noise: number,
) =>
  clamp(
    Math.round(118 - burden * 95 - (size - 1) * 1.8 - STABILITY_PENALTY[stability] + noise),
    0,
    100,
  )

/**
 * The largest share of income a household is modeled as spending on essentials.
 *
 * Without a ceiling the generator produces impossible households — a family of
 * seven on a low income "spending" more than it earns on food and utilities
 * alone, every month, for two years. Real households under that pressure do not
 * overspend indefinitely; they compress. They buy less food, skip the
 * prescription, keep the heating off.
 *
 * HONEST LIMITATION: that compression is itself a severe deprivation signal, and
 * this model does not treat it as one. A household pinned at the ceiling looks
 * merely expensive here, when in reality it is going without. Measuring it needs
 * consumption data no public source provides at household level.
 */
const ESSENTIALS_INCOME_CEILING = 0.55

/**
 * Essential monthly spending: food, utilities, transport, medicine and basic
 * schooling. A base for the first occupant plus a smaller increment for each
 * additional one, because these costs are shared but do not scale linearly.
 */
export const essentialsFor = (
  size: number,
  areaMultiplier: number,
  income: number,
) =>
  Math.min(
    roundTo((700 + 380 * (size - 1)) * areaMultiplier, 5),
    roundTo(income * ESSENTIALS_INCOME_CEILING, 5),
  )

/** Area ids repeated in proportion to each area's share of the population. */
const areaDraw: AreaId[] = AREAS.flatMap((area) =>
  Array.from<unknown, AreaId>({ length: Math.round(area.share * 1000) }, () => area.id),
)

const MONTH_LABELS = historyMonths()

/** Monthly compound rates. Positive `income` means the household is gaining. */
interface TrendSeed {
  income: number
  rent: number
  essentials: number
}

/**
 * Walks the present values backwards to reconstruct the ledger.
 *
 * Building backwards rather than forwards keeps the household's current figures
 * exactly as generated — the last row of history always equals the household's
 * present — while the trends decide where it came from.
 */
const buildHistory = (
  rng: () => number,
  income: number,
  rent: number,
  essentials: number,
  size: number,
  stability: EmploymentStability,
  trend: TrendSeed,
): HouseholdMonth[] =>
  MONTH_LABELS.map((month, index) => {
    const offset = MONTH_LABELS.length - 1 - index
    // The present month is exact; earlier months carry payroll wobble.
    const wobble = offset === 0 ? 1 : floatBetween(rng, 0.97, 1.03)

    const monthIncome = roundTo((income / (1 + trend.income) ** offset) * wobble, 25)
    const monthRent = roundTo(rent / (1 + trend.rent) ** offset, 25)
    const monthEssentials = roundTo(essentials / (1 + trend.essentials) ** offset, 5)

    return {
      month,
      income: monthIncome,
      rent: monthRent,
      essentials: monthEssentials,
      balance: Math.round(monthIncome - monthRent - monthEssentials),
      affordabilityScore: scoreFor(monthRent / monthIncome, size, stability, 0),
    }
  })

/**
 * Model, then rules — in that order, every time.
 *
 * The model never sees a percentage and the engine never sees a feature. This
 * helper is the only place the two meet, and heroes go through it on exactly
 * the same terms as generated households: their inputs are authored, their risk
 * and their recommendation are computed.
 */
const scoreWithModel = (household: Household): Household => {
  const riskProbability = Number(
    predictRisk(featuresFor(household)).probability.toFixed(2),
  )
  return {
    ...household,
    riskProbability,
    recommendedSubsidy: recommendSubsidy(household, riskProbability).percent,
  }
}

const generate = (): { households: Household[]; tierThresholds: TierThresholds } => {
  const rng = createRng(SEED)
  const rows: Household[] = []

  for (let index = 0; index < HOUSEHOLD_COUNT; index += 1) {
    const areaId = pick(rng, areaDraw)
    const area = AREAS.find((candidate) => candidate.id === areaId)!
    const size = intBetween(rng, 1, 7)
    const stability = pick(rng, STABILITY)

    const monthlyIncome = roundTo(area.incomeMedian * floatBetween(rng, 0.55, 1.65), 50)
    const burden = floatBetween(rng, area.burdenRange[0], area.burdenRange[1])
    const monthlyRent = roundTo(monthlyIncome * burden, 25)
    const rentBurden = Number((monthlyRent / monthlyIncome).toFixed(3))
    const essentials = essentialsFor(size, floatBetween(rng, 0.85, 1.15), monthlyIncome)

    const affordabilityScore = scoreFor(
      rentBurden,
      size,
      stability,
      floatBetween(rng, -5, 5),
    )
    const currentSubsidy = Math.round(clamp((77 - affordabilityScore) * 0.9, 0, 30))

    // Income direction follows the area but varies per household, so every area
    // holds households moving in both directions.
    const history = buildHistory(
      rng,
      monthlyIncome,
      monthlyRent,
      essentials,
      size,
      stability,
      {
        income: area.incomeTrend / 12 + floatBetween(rng, -0.004, 0.003),
        rent: floatBetween(rng, 0.0025, 0.009),
        essentials: floatBetween(rng, 0.003, 0.006),
      },
    )

    rows.push(
      scoreWithModel({
        id: FIRST_HOUSEHOLD_ID + index,
        size,
        monthlyIncome,
        monthlyRent,
        employmentStability: stability,
        area: area.id,
        currentSubsidy,
        recommendedSubsidy: currentSubsidy,
        affordabilityScore,
        rentBurden,
        tier: 'stable',
        riskProbability: 0,
        history,
      }),
    )
  }

  // Hero records replace their generated counterparts by id, before the cut, so
  // the ranking sees the authored scores and search finds the authored rows.
  for (const hero of heroHouseholds) {
    const index = hero.id - FIRST_HOUSEHOLD_ID
    if (index < 0 || index >= rows.length) {
      throw new Error(`Hero household ${hero.id} is outside the generated id range`)
    }
    rows[index] = scoreWithModel(hero)
  }

  // Percentile cut over the whole population. Ties break by id so the assignment
  // is deterministic. Heroes are ranked with everyone else: their authored scores
  // place them correctly, so no exclusion is needed.
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
