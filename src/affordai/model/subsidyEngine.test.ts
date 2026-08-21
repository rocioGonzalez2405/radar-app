import { describe, expect, it } from 'vitest'
import { households } from '@/affordai/data/households'
import type { Household } from '@/affordai/data/types'
import { featuresFor } from '@/affordai/model/features'
import { HORIZON_DAYS, predictRisk } from '@/affordai/model/riskModel'
import {
  DEMO_POLICY,
  bandFor,
  monthlyGapFor,
  recommendSubsidy,
} from '@/affordai/model/subsidyEngine'

/** A household with no shortfall and no existing award, so only risk moves. */
const householdWith = (overrides: Partial<Household> = {}): Household => ({
  id: 99999,
  size: 3,
  monthlyIncome: 5000,
  monthlyRent: 1500,
  employmentStability: 'Medium',
  area: 'downtown',
  currentSubsidy: 0,
  recommendedSubsidy: 0,
  affordabilityScore: 75,
  rentBurden: 0.3,
  tier: 'stable',
  riskProbability: 0,
  history: [
    {
      month: '2026-08',
      income: 5000,
      rent: 1500,
      essentials: 1600,
      balance: 1900,
      affordabilityScore: 75,
    },
  ],
  ...overrides,
})

describe('risk bands', () => {
  /** The table from the proposal, verified at both sides of every boundary. */
  it.each([
    [0, 0],
    [0.299, 0],
    [0.3, 10],
    [0.499, 10],
    [0.5, 25],
    [0.699, 25],
    [0.7, 40],
    [1, 40],
  ])('maps a risk of %s to the %s%% band', (risk, percent) => {
    expect(bandFor(risk).percent).toBe(percent)
  })

  it('carries an interpretation a caseworker can read', () => {
    for (const band of DEMO_POLICY.bands) {
      expect(band.interpretation.length).toBeGreaterThan(0)
    }
  })
})

describe('the economic gap', () => {
  it('is rent plus essentials minus income', () => {
    const household = householdWith({
      history: [
        {
          month: '2026-08',
          income: 3000,
          rent: 1400,
          essentials: 1900,
          balance: -300,
          affordabilityScore: 50,
        },
      ],
    })
    expect(monthlyGapFor(household)).toBe(300)
  })

  it('floors at zero rather than reporting a surplus as a negative need', () => {
    expect(monthlyGapFor(householdWith())).toBe(0)
  })
})

describe('recommendation', () => {
  it('recommends nothing below the first band', () => {
    expect(recommendSubsidy(householdWith(), 0.2).percent).toBe(0)
  })

  it('reduces the band for a household that still balances', () => {
    const decision = recommendSubsidy(householdWith(), 0.75)
    expect(decision.bandPercent).toBe(40)
    expect(decision.percent).toBeLessThan(40)
    expect(decision.percent).toBeGreaterThan(0)
  })

  it('pays the full band to a household deep in shortfall', () => {
    const underwater = householdWith({
      monthlyRent: 1500,
      history: [
        {
          month: '2026-08',
          income: 2000,
          rent: 1500,
          essentials: 2000,
          balance: -1500,
          affordabilityScore: 30,
        },
      ],
    })
    const decision = recommendSubsidy(underwater, 0.75)
    expect(decision.monthlyGap).toBe(1500)
    expect(decision.percent).toBeGreaterThanOrEqual(decision.bandPercent)
  })

  it('never exceeds the policy ceiling', () => {
    const desperate = householdWith({
      currentSubsidy: 44,
      monthlyRent: 1000,
      history: [
        {
          month: '2026-08',
          income: 1000,
          rent: 1000,
          essentials: 1500,
          balance: -1500,
          affordabilityScore: 5,
        },
      ],
    })
    expect(recommendSubsidy(desperate, 0.99).percent).toBeLessThanOrEqual(
      DEMO_POLICY.maxPercent,
    )
  })

  it('reports the horizon the model was asked about', () => {
    expect(recommendSubsidy(householdWith(), 0.8).durationDays).toBe(HORIZON_DAYS)
  })
})

describe('smoothing', () => {
  /**
   * The proposal's guard against a single unusual month swinging a benefit.
   */
  it('caps how far an existing award can move in one cycle', () => {
    const enrolled = householdWith({ currentSubsidy: 5 })
    const decision = recommendSubsidy(enrolled, 0.95)
    expect(decision.percent).toBe(5 + DEMO_POLICY.maxChangePerCycle)
    expect(decision.cappedBy).toBe('smoothing')
  })

  it('caps a reduction by the same amount', () => {
    const enrolled = householdWith({ currentSubsidy: 40 })
    const decision = recommendSubsidy(enrolled, 0.05)
    expect(decision.bandPercent).toBe(0)
    expect(decision.percent).toBe(40 - DEMO_POLICY.maxChangePerCycle)
    expect(decision.cappedBy).toBe('smoothing')
  })

  it('lets a household entering the program start at its assessed level', () => {
    const entering = householdWith({ currentSubsidy: 0 })
    const decision = recommendSubsidy(entering, 0.75)
    expect(decision.percent).toBeGreaterThan(DEMO_POLICY.maxChangePerCycle)
    expect(decision.cappedBy).not.toBe('smoothing')
  })
})

describe('the generated caseload', () => {
  /**
   * Regression: the generator used to band on `riskProbability` after rounding
   * it to two decimals for display. A household at 0.6951 rounded to 0.70,
   * crossed into the top band, and collected fifteen extra points of subsidy on
   * a display artifact. 139 households were affected. Band boundaries are
   * policy and must be compared against what the model actually said.
   */
  it('bands on the raw probability, not the rounded one', () => {
    for (const household of households) {
      const raw = predictRisk(featuresFor(household)).probability
      expect(household.recommendedSubsidy).toBe(recommendSubsidy(household, raw).percent)
    }
  })

  it('never lets rounding alone change a household band', () => {
    const misbanded = households.filter((household) => {
      const raw = predictRisk(featuresFor(household)).probability
      return bandFor(raw).percent !== bandFor(household.riskProbability).percent
        ? recommendSubsidy(household, raw).percent !== household.recommendedSubsidy
        : false
    })
    expect(misbanded).toHaveLength(0)
  })

  it('recommends within policy for every household', () => {
    for (const household of households) {
      expect(household.recommendedSubsidy).toBeGreaterThanOrEqual(0)
      expect(household.recommendedSubsidy).toBeLessThanOrEqual(DEMO_POLICY.maxPercent)
    }
  })

  it('never moves an existing award by more than one cycle allows', () => {
    for (const household of households) {
      if (household.currentSubsidy === 0) continue
      const change = Math.abs(household.recommendedSubsidy - household.currentSubsidy)
      expect(change).toBeLessThanOrEqual(DEMO_POLICY.maxChangePerCycle)
    }
  })

  it('recommends nothing for households the model reads as low risk', () => {
    const quiet = households.filter(
      (household) => household.riskProbability < 0.3 && household.currentSubsidy === 0,
    )
    expect(quiet.length).toBeGreaterThan(0)
    expect(quiet.every((household) => household.recommendedSubsidy === 0)).toBe(true)
  })
})
