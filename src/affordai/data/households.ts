/**
 * SIMULATED POPULATION — read this before trusting any number that comes out of
 * this file.
 *
 * The 12,482 households below are generated, not sampled. Every per-household
 * field — income, rent, burden, score, risk probability, subsidy, and the three
 * years of history — is synthetic, and so are the tier counts derived from them.
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
import { heroHouseholds } from '@/affordai/data/heroes'
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
    Math.round(118 - burden * 95 - (size - 1) * 1.8 - STABILITY_PENALTY[stability] + noise),
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
      floatBetween(rng, -5, 5),
    )

    const riskProbability = Number(
      clamp(0.03 + (78 - affordabilityScore) / 36, 0.03, 0.97).toFixed(2),
    )
    const currentSubsidy = Math.round(clamp((77 - affordabilityScore) * 0.9, 0, 30))
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

  // Hero records replace their generated counterparts by id, before the cut, so
  // the ranking sees the authored scores and search finds the authored rows.
  for (const hero of heroHouseholds) {
    const index = hero.id - FIRST_HOUSEHOLD_ID
    if (index < 0 || index >= rows.length) {
      throw new Error(`Hero household ${hero.id} is outside the generated id range`)
    }
    rows[index] = hero
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
