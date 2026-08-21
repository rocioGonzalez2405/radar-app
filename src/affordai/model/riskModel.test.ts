import { describe, expect, it } from 'vitest'
import { households } from '@/affordai/data/households'
import { AUDIT_KEYS, FEATURE_KEYS, PREDICTIVE_KEYS, featuresFor } from '@/affordai/model/features'
import type { RiskFeatures } from '@/affordai/model/features'
import {
  BASELINE,
  BASELINE_TOLERANCE,
  COEFFICIENTS,
  INTERCEPT,
  predictRisk,
  predictRiskFor,
  riskFactorsFrom,
} from '@/affordai/model/riskModel'

const mean = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length

describe('logistic risk model', () => {
  it('reproduces its own probability from the logit, inside the reported range', () => {
    for (const household of households.slice(0, 300)) {
      const { probability, logit } = predictRiskFor(household)
      const unclamped = 1 / (1 + Math.exp(-logit))
      expect(probability).toBeCloseTo(Math.min(0.99, Math.max(0.01, unclamped)), 6)
    }
  })

  it('computes the logit as intercept plus the weighted features', () => {
    for (const household of households.slice(0, 300)) {
      const features = featuresFor(household)
      const expected = PREDICTIVE_KEYS.reduce(
        (total, key) => total + COEFFICIENTS[key] * features[key],
        INTERCEPT,
      )
      expect(predictRiskFor(household).logit).toBeCloseTo(expected, 10)
    }
  })

  /**
   * The property that makes a linear model worth shipping here: the
   * contributions are not an approximation of the prediction, they add back up
   * to it. An explanation that does not reconcile with its own model is worse
   * than no explanation.
   */
  it('reconciles contributions with the distance from the baseline logit', () => {
    const baselineLogit = PREDICTIVE_KEYS.reduce(
      (total, key) => total + COEFFICIENTS[key] * BASELINE[key],
      INTERCEPT,
    )

    for (const household of households.slice(0, 300)) {
      const { logit, contributions } = predictRiskFor(household)
      const summed = contributions.reduce(
        (total, contribution) => total + contribution.value,
        0,
      )
      expect(baselineLogit + summed).toBeCloseTo(logit, 10)
    }
  })

  it('returns one contribution per predictive feature, sorted by influence', () => {
    const { contributions } = predictRiskFor(households[0])
    expect(contributions).toHaveLength(PREDICTIVE_KEYS.length)
    expect(new Set(contributions.map((c) => c.key)).size).toBe(PREDICTIVE_KEYS.length)

    const magnitudes = contributions.map((c) => Math.abs(c.value))
    expect(magnitudes).toEqual([...magnitudes].sort((a, b) => b - a))
  })

  it('never claims certainty in either direction', () => {
    const safe: RiskFeatures = {
      rentBurden: 0,
      essentialsBurden: 0,
      incomeDrop6m: -0.5,
      rentGrowth12m: -0.5,
      negativeBalanceRate: 0,
      incomeVolatility: 0,
      householdSize: 0,
      employmentInstability: 0,
      areaPressure: 0,
    }
    const dire: RiskFeatures = {
      rentBurden: 1,
      essentialsBurden: 1,
      incomeDrop6m: 0.5,
      rentGrowth12m: 0.5,
      negativeBalanceRate: 1,
      incomeVolatility: 0.5,
      householdSize: 1,
      employmentInstability: 1,
      areaPressure: 1,
    }

    expect(predictRisk(safe).probability).toBeGreaterThanOrEqual(0.01)
    expect(predictRisk(safe).probability).toBeLessThan(0.05)
    expect(predictRisk(dire).probability).toBeLessThanOrEqual(0.99)
    expect(predictRisk(dire).probability).toBeGreaterThan(0.95)
  })

  it('moves risk in the direction every coefficient claims', () => {
    const base = featuresFor(households[0])
    for (const key of PREDICTIVE_KEYS) {
      const raised = predictRisk({ ...base, [key]: base[key] + 0.1 }).logit
      const lowered = predictRisk({ ...base, [key]: base[key] - 0.1 }).logit
      expect(raised).toBeGreaterThan(lowered)
    }
  })
})

/**
 * The separation the proposal's fairness section asks for, enforced rather than
 * documented. `householdSize` used to carry its own coefficient on top of the
 * essentials channel it already flows through, and the consequence was that no
 * household of one or two people could reach the top support band at any income
 * or rent burden — 3,545 households capped below the threshold by arithmetic.
 */
describe('audit-only variables', () => {
  it('measures household size without weighting it', () => {
    expect(AUDIT_KEYS).toContain('householdSize')
    expect(PREDICTIVE_KEYS).not.toContain('householdSize')
    expect(featuresFor(households[0]).householdSize).toBeGreaterThanOrEqual(0)
  })

  it('cannot change a prediction by any amount', () => {
    const base = featuresFor(households[0])
    const reference = predictRisk(base).logit

    for (const key of AUDIT_KEYS) {
      for (const value of [0, 0.25, 0.5, 0.75, 1]) {
        expect(predictRisk({ ...base, [key]: value }).logit).toBe(reference)
      }
    }
  })

  it('never appears in an explanation', () => {
    for (const household of households.slice(0, 200)) {
      const keys = predictRiskFor(household).contributions.map((c) => c.key)
      for (const audited of AUDIT_KEYS) expect(keys).not.toContain(audited)
    }
  })

  /**
   * The regression this whole change exists to prevent, proved structurally
   * rather than by what the generated population happens to contain.
   *
   * A single person in genuine distress must be able to reach the top band. The
   * old model made that impossible at any input; this asserts the ceiling is
   * gone from the arithmetic itself.
   */
  it('lets a one-person household in real distress reach the top support band', () => {
    const distressed: RiskFeatures = {
      rentBurden: 0.62,
      essentialsBurden: 0.34,
      incomeDrop6m: 0.28,
      rentGrowth12m: 0.19,
      negativeBalanceRate: 0.5,
      incomeVolatility: 0.12,
      householdSize: 0, // one person — the value that used to cap the result
      employmentInstability: 1,
      areaPressure: 0.5,
    }
    expect(predictRisk(distressed).probability).toBeGreaterThanOrEqual(0.7)
  })

  it('reaches the top band for small households in the generated population too', () => {
    const small = households.filter((household) => household.size <= 2)
    expect(small.length).toBeGreaterThan(1000)
    expect(small.some((household) => household.riskProbability >= 0.7)).toBe(true)
  })
})

describe('explanation baseline', () => {
  it('stays within tolerance of the population it summarises', () => {
    const allFeatures = households.map((household) => featuresFor(household))
    for (const key of FEATURE_KEYS) {
      const populationMean = mean(allFeatures.map((features) => features[key]))
      expect(Math.abs(populationMean - BASELINE[key])).toBeLessThanOrEqual(
        BASELINE_TOLERANCE,
      )
    }
  })
})

describe('factor bars', () => {
  it('sums to exactly 100 wherever anything raises risk', () => {
    for (const household of households.slice(0, 500)) {
      const factors = riskFactorsFrom(predictRiskFor(household))
      if (factors.length === 0) continue
      expect(factors.reduce((total, factor) => total + factor.contribution, 0)).toBe(100)
    }
  })

  it('shows only what raised risk, largest share first', () => {
    const factors = riskFactorsFrom(predictRiskFor(households[0]))
    expect(factors.every((factor) => factor.contribution >= 0)).toBe(true)
    const shares = factors.map((factor) => factor.contribution)
    expect(shares).toEqual([...shares].sort((a, b) => b - a))
  })

  it('returns nothing when every feature is protective', () => {
    const protective = { ...BASELINE }
    for (const key of FEATURE_KEYS) protective[key] = BASELINE[key] - 0.05
    expect(riskFactorsFrom(predictRisk(protective))).toEqual([])
  })
})

describe('the population the model scores', () => {
  it('agrees with the descriptive index in aggregate', () => {
    const byTier = (tier: string) =>
      mean(
        households.filter((h) => h.tier === tier).map((h) => h.riskProbability),
      )

    expect(byTier('stable')).toBeLessThan(byTier('emerging'))
    expect(byTier('emerging')).toBeLessThan(byTier('high-risk'))
  })

  /**
   * And disagrees on individuals, which is the entire point. If the model only
   * ever confirmed the affordability score, it would be an expensive way to
   * re-render a threshold.
   */
  it('disagrees with it on individual households', () => {
    const flaggedButStable = households.filter(
      (h) => h.tier === 'stable' && h.riskProbability >= 0.7,
    )
    expect(flaggedButStable.length).toBeGreaterThan(0)
  })

  it('keeps the caseload inside a plausible spread', () => {
    const risks = households.map((h) => h.riskProbability)
    const highRisk = risks.filter((risk) => risk >= 0.7).length
    expect(highRisk / risks.length).toBeGreaterThan(0.02)
    expect(highRisk / risks.length).toBeLessThan(0.12)
  })
})
