import { households } from '@/affordai/data/households'
import { HERO_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import type { Household, RiskFactor } from '@/affordai/data/types'
import { FEATURE_KEYS, FEATURE_LABELS } from '@/affordai/model/features'
import { predictRiskFor, riskFactorsFrom } from '@/affordai/model/riskModel'
import type { FeatureKey } from '@/affordai/model/features'

/**
 * Risk attributions for the factor bars.
 *
 * These used to be a hand-written table. They are now the model's own
 * arithmetic: in a logistic model the Shapley value of a feature is exactly
 * `coefficient * (feature - baseline)`, so the bars are not an approximation of
 * what the model did, they are a rearrangement of it. Nothing can drift between
 * the explanation and the prediction, because there is only one calculation.
 *
 * The shape the UI consumes is unchanged — `RiskFactor[]` summing to 100.
 */

/** How many bars a card shows. */
const FACTOR_COUNT = 5

/**
 * What drives risk across the vulnerable caseload, rather than for any one
 * household. Averages each feature's upward contribution over every household
 * the console currently treats as vulnerable, then normalises to 100.
 *
 * Households already at low risk are excluded: including them would average in
 * the reasons people are FINE, which is a different question and would flatten
 * the ranking toward the population mean by construction.
 */
const populationFactors = (): RiskFactor[] => {
  const vulnerable = households.filter((household) => household.tier !== 'stable')
  const totals = new Map<FeatureKey, number>(FEATURE_KEYS.map((key) => [key, 0]))

  for (const household of vulnerable) {
    for (const contribution of predictRiskFor(household).contributions) {
      if (contribution.value > 0) {
        totals.set(contribution.key, totals.get(contribution.key)! + contribution.value)
      }
    }
  }

  const ranked = [...totals.entries()]
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, FACTOR_COUNT)

  const sum = ranked.reduce((total, [, value]) => total + value, 0)
  if (sum === 0) return []

  const factors = ranked.map(([key, value]) => ({
    label: FEATURE_LABELS[key],
    contribution: Math.floor((value / sum) * 100),
  }))

  // Largest remainder, so the bars sum to exactly 100.
  let remainder = 100 - factors.reduce((total, factor) => total + factor.contribution, 0)
  const byFraction = ranked
    .map(([, value], index) => ({ index, fraction: ((value / sum) * 100) % 1 }))
    .sort((a, b) => b.fraction - a.fraction)

  for (const { index } of byFraction) {
    if (remainder <= 0) break
    factors[index].contribution += 1
    remainder -= 1
  }

  return factors
}

export const POPULATION_FACTORS: RiskFactor[] = populationFactors()

/** Household #10482's own attribution, computed the same way as everyone's. */
export const HERO_FACTORS: RiskFactor[] = factorsForId(HERO_HOUSEHOLD_ID)

function factorsForId(id: number): RiskFactor[] {
  const household = households.find((row) => row.id === id)
  if (!household) throw new Error(`No household ${id} to attribute risk for`)
  return riskFactorsFrom(predictRiskFor(household), FACTOR_COUNT)
}

/**
 * A household's own risk attribution.
 *
 * Falls back to the caseload-wide picture only when the model finds nothing
 * pushing this household's risk up — a household safer than the baseline on
 * every single feature has no "why is it at risk" to show, and an empty card
 * reads as broken rather than as reassuring.
 */
export const factorsFor = (household: Household): RiskFactor[] => {
  const own = riskFactorsFrom(predictRiskFor(household), FACTOR_COUNT)
  return own.length > 0 ? own : POPULATION_FACTORS
}
