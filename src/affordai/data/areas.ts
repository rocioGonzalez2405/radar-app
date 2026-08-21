import { COUNTY_HOUSING } from '@/affordai/data/costBurden'
import type { Area, AreaId } from '@/affordai/data/types'

/**
 * Generation parameters per area.
 *
 * HONEST LIMITATION — subregional rent and income are not separately published
 * in any source reachable from this environment. The county figures below are
 * verified (California Housing Partnership, 2026 AHNR), but no public release
 * breaks them down to Downtown / Eastside / North County / South County at the
 * granularity this console displays. The area-to-area variation is therefore
 * MODELED, NOT MEASURED. What is grounded and what is not:
 *
 * - Grounded: the anchor. Every area's rent level is a fraction of the verified
 *   county average asking rent of $2,606/month, and the burden ranges sit
 *   around the 30%-of-income cost-burden threshold and the 50% severe threshold
 *   the report uses, so the spread matches the county's real burden bands
 *   (see COST_BURDEN_BANDS in costBurden.ts).
 * - Modeled: `rentShare`, `burdenRange`, `incomeTrend`, and `share`. The shares
 *   below rank the areas the way San Diego's regional structure suggests, but
 *   the specific numbers are assumptions, not observations. `incomeMedian` is
 *   derived from the two of them, so it inherits the same status.
 *
 * Asking rents describe units coming onto the market; a subsidy caseload sits
 * disproportionately in older units at below-asking rents, which is why every
 * `rentShare` is below 1. That reasoning is also an assumption.
 *
 * `share` values sum to 1 and decide how the population is split;
 * `incomeTrend` is the three-year direction of median income and is what makes
 * Eastside the area the demo walks through.
 */
interface AreaSeed {
  id: AreaId
  label: string
  /** Modeled rent level as a share of the verified county average asking rent. */
  rentShare: number
  burdenRange: [number, number]
  incomeTrend: number
  share: number
}

const AREA_SEEDS: readonly AreaSeed[] = [
  {
    id: 'downtown',
    label: 'Downtown',
    rentShare: 0.82,
    burdenRange: [0.3, 0.44],
    incomeTrend: -0.018,
    share: 0.31,
  },
  {
    id: 'eastside',
    label: 'Eastside',
    rentShare: 0.7,
    burdenRange: [0.36, 0.52],
    incomeTrend: -0.041,
    share: 0.27,
  },
  {
    id: 'north-county',
    label: 'North County',
    rentShare: 0.78,
    burdenRange: [0.26, 0.38],
    incomeTrend: 0.006,
    share: 0.23,
  },
  {
    id: 'south-county',
    label: 'South County',
    rentShare: 0.71,
    burdenRange: [0.3, 0.47],
    incomeTrend: -0.012,
    share: 0.19,
  },
]

/**
 * Median income implied by the area's rent level and its typical rent burden.
 * Rounded to the nearest $50 so the generator's own rounding does not make the
 * derivation look more precise than it is.
 */
const medianIncomeFor = (seed: AreaSeed): number => {
  const rentLevel = COUNTY_HOUSING.averageAskingRent * seed.rentShare
  const burdenMidpoint = (seed.burdenRange[0] + seed.burdenRange[1]) / 2
  return Math.round(rentLevel / burdenMidpoint / 50) * 50
}

export const AREAS: readonly Area[] = AREA_SEEDS.map((seed) => ({
  id: seed.id,
  label: seed.label,
  incomeMedian: medianIncomeFor(seed),
  burdenRange: seed.burdenRange,
  incomeTrend: seed.incomeTrend,
  share: seed.share,
}))

const BY_ID = new Map<AreaId, Area>(AREAS.map((area) => [area.id, area]))

export const areaById = (id: AreaId): Area => {
  const area = BY_ID.get(id)
  if (!area) throw new Error(`Unknown area: ${id}`)
  return area
}
