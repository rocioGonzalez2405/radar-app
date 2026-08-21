import { FEATURE_KEYS, FEATURE_LABELS, featuresFor } from '@/affordai/model/features'
import type { FeatureKey, RiskFeatures } from '@/affordai/model/features'
import type { Household, RiskFactor } from '@/affordai/data/types'

/**
 * Vulnerability risk model — logistic regression.
 *
 * `p = sigma(intercept + sum(coefficient_i * feature_i))`
 *
 * WHY A LINEAR MODEL, AND WHY THAT MATTERS HERE
 *
 * The proposal names logistic regression as the reference model and a gradient
 * boosted tree as the eventual production one. This console ships the reference
 * model, and gains something real by doing so: in a linear model the Shapley
 * value of a feature is exactly `coefficient_i * (feature_i - baseline_i)`. The
 * explanation is not an approximation of the model, it IS the model, rearranged.
 * Nothing can drift between the number the console shows and the number the
 * model used, because they are the same arithmetic.
 *
 * The coefficients are HAND-SET, not fitted — there is no ground truth to fit
 * against, because the population is synthetic. They encode the direction and
 * relative weight the proposal describes: trends dominate snapshots, rent
 * burden outweighs household composition, and geography is the weakest signal
 * of the nine (it is kept deliberately small, because area is a proxy for
 * social characteristics and a large weight there would launder that proxy into
 * a funding decision).
 */

/** The window the probability describes. The proposal leaves 30/60/90 open. */
export const HORIZON_DAYS = 30

export const COEFFICIENTS: Record<FeatureKey, number> = {
  rentBurden: 6.0,
  essentialsBurden: 3.0,
  incomeDrop6m: 8.0,
  rentGrowth12m: 5.0,
  negativeBalanceRate: 3.0,
  incomeVolatility: 4.0,
  householdSize: 1.2,
  employmentInstability: 1.5,
  areaPressure: 0.8,
}

export const INTERCEPT = -7.0

/**
 * The reference household every explanation is measured against: roughly the
 * population average. Contributions answer "why is THIS household different
 * from a typical one", which is the question a caseworker is actually asking.
 *
 * Kept in sync with the generated population by a test, so it cannot quietly
 * drift away from the data it claims to summarise.
 */
export const BASELINE: RiskFeatures = {
  rentBurden: 0.38,
  essentialsBurden: 0.329,
  incomeDrop6m: 0.011,
  rentGrowth12m: 0.072,
  negativeBalanceRate: 0.026,
  incomeVolatility: 0.019,
  householdSize: 0.501,
  employmentInstability: 0.501,
  areaPressure: 0.5,
}

/**
 * How far a BASELINE entry may sit from the population mean before the
 * explanations stop describing the population they claim to summarise.
 *
 * The baseline shifts attributions only; it has no effect on any probability,
 * so drift here is a clarity bug rather than a correctness one.
 */
export const BASELINE_TOLERANCE = 0.03

export interface FeatureContribution {
  key: FeatureKey
  label: string
  /** Signed logit contribution. Positive pushes risk up, negative pulls it down. */
  value: number
}

export interface RiskPrediction {
  probability: number
  logit: number
  /** Every feature, sorted by absolute influence, largest first. */
  contributions: FeatureContribution[]
}

/**
 * Squashed into [0.01, 0.99] rather than [0, 1].
 *
 * A nine-feature hand-set model has no business reporting certainty. At the
 * extremes the logistic curve rounds to 0.00 and 1.00, and a card reading
 * "100% risk of vulnerability" claims something this model cannot know.
 */
const PROBABILITY_FLOOR = 0.01
const PROBABILITY_CEILING = 0.99

const sigmoid = (z: number) =>
  Math.min(PROBABILITY_CEILING, Math.max(PROBABILITY_FLOOR, 1 / (1 + Math.exp(-z))))

export const predictRisk = (features: RiskFeatures): RiskPrediction => {
  let logit = INTERCEPT
  const contributions: FeatureContribution[] = []

  for (const key of FEATURE_KEYS) {
    logit += COEFFICIENTS[key] * features[key]
    contributions.push({
      key,
      label: FEATURE_LABELS[key],
      value: COEFFICIENTS[key] * (features[key] - BASELINE[key]),
    })
  }

  contributions.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
  return { probability: sigmoid(logit), logit, contributions }
}

export const predictRiskFor = (household: Household): RiskPrediction =>
  predictRisk(featuresFor(household))

/**
 * The contributions that pushed risk UP, as percentages of the upward push,
 * for the factor bars. Downward contributions are dropped rather than shown as
 * negative bars: the card answers "why is this household at risk", and a
 * protective factor is a different question that deserves its own treatment.
 *
 * Percentages are largest-remainder rounded so the bars sum to exactly 100.
 */
export const riskFactorsFrom = (
  prediction: RiskPrediction,
  count = 5,
): RiskFactor[] => {
  const raised = prediction.contributions
    .filter((contribution) => contribution.value > 0)
    .slice(0, count)

  const total = raised.reduce((sum, contribution) => sum + contribution.value, 0)
  if (total === 0) return []

  const exact = raised.map((contribution) => ({
    label: contribution.label,
    share: (contribution.value / total) * 100,
  }))

  const factors = exact.map((entry) => ({
    label: entry.label,
    contribution: Math.floor(entry.share),
  }))

  let remainder = 100 - factors.reduce((sum, factor) => sum + factor.contribution, 0)
  const byFraction = exact
    .map((entry, index) => ({ index, fraction: entry.share % 1 }))
    .sort((a, b) => b.fraction - a.fraction)

  for (const { index } of byFraction) {
    if (remainder <= 0) break
    factors[index].contribution += 1
    remainder -= 1
  }

  return factors
}
