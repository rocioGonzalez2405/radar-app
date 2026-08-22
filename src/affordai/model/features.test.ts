import { describe, expect, it } from 'vitest'
import { HISTORY_MONTHS } from '@/affordai/data/calendar'
import { households } from '@/affordai/data/households'
import type { Household, HouseholdMonth } from '@/affordai/data/types'
import { FEATURE_KEYS, areaPressureFor, featuresFor } from '@/affordai/model/features'

const month = (overrides: Partial<HouseholdMonth> = {}): HouseholdMonth => ({
  month: '2026-08',
  income: 4000,
  rent: 1200,
  essentials: 1400,
  balance: 1400,
  affordabilityScore: 80,
  ...overrides,
})

const householdWith = (history: HouseholdMonth[]): Household => ({
  id: 99999,
  size: 4,
  monthlyIncome: history[history.length - 1]?.income ?? 0,
  monthlyRent: history[history.length - 1]?.rent ?? 0,
  employmentStability: 'Medium',
  area: 'downtown',
  currentSubsidy: 0,
  recommendedSubsidy: 0,
  affordabilityScore: 70,
  rentBurden: 0.3,
  tier: 'stable',
  riskProbability: 0,
  history,
})

/** Twenty-four flat months, then whatever the test wants to change. */
const flat = () => Array.from({ length: HISTORY_MONTHS }, () => month())

describe('feature extraction', () => {
  it('reads the present month for the snapshot features', () => {
    const history = flat()
    history[history.length - 1] = month({ income: 5000, rent: 2000, essentials: 1500 })
    const features = featuresFor(householdWith(history))

    expect(features.rentBurden).toBeCloseTo(0.4, 6)
    expect(features.essentialsBurden).toBeCloseTo(0.3, 6)
  })

  it('reports a six-month income fall as a positive drop', () => {
    const history = flat()
    history[history.length - 7] = month({ income: 5000 })
    history[history.length - 1] = month({ income: 4000 })

    expect(featuresFor(householdWith(history)).incomeDrop6m).toBeCloseTo(0.2, 6)
  })

  it('reports income growth as a negative drop', () => {
    const history = flat()
    history[history.length - 7] = month({ income: 4000 })
    history[history.length - 1] = month({ income: 5000 })

    expect(featuresFor(householdWith(history)).incomeDrop6m).toBeCloseTo(-0.25, 6)
  })

  it('measures rent growth over twelve months', () => {
    const history = flat()
    history[history.length - 13] = month({ rent: 1000 })
    history[history.length - 1] = month({ rent: 1200 })

    expect(featuresFor(householdWith(history)).rentGrowth12m).toBeCloseTo(0.2, 6)
  })

  it('counts negative months over the last six only', () => {
    const history = flat()
    // Two recent, one older than the window.
    history[history.length - 2] = month({ balance: -100 })
    history[history.length - 3] = month({ balance: -50 })
    history[history.length - 9] = month({ balance: -900 })

    expect(featuresFor(householdWith(history)).negativeBalanceRate).toBeCloseTo(2 / 6, 6)
  })

  it('reports no volatility for a flat income', () => {
    expect(featuresFor(householdWith(flat())).incomeVolatility).toBe(0)
  })

  it('rescales household size and employment onto 0..1', () => {
    const base = householdWith(flat())
    expect(featuresFor({ ...base, size: 1 }).householdSize).toBe(0)
    expect(featuresFor({ ...base, size: 7 }).householdSize).toBe(1)
    expect(featuresFor({ ...base, employmentStability: 'High' }).employmentInstability).toBe(0)
    expect(featuresFor({ ...base, employmentStability: 'Low' }).employmentInstability).toBe(1)
  })

  it('spans the full 0..1 range across the four areas', () => {
    const pressures = (['downtown', 'eastside', 'north-county', 'south-county'] as const).map(
      areaPressureFor,
    )
    expect(Math.min(...pressures)).toBe(0)
    expect(Math.max(...pressures)).toBe(1)
  })

  it('refuses a household with no history rather than guessing', () => {
    expect(() => featuresFor(householdWith([]))).toThrow(/no history/)
  })

  it('clamps every feature into the range the coefficients assume', () => {
    for (const household of households.slice(0, 1000)) {
      const features = featuresFor(household)
      for (const key of FEATURE_KEYS) {
        expect(features[key]).toBeGreaterThanOrEqual(-0.5)
        expect(features[key]).toBeLessThanOrEqual(1)
      }
    }
  })
})
