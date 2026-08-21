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
import { CURRENT_MONTH, HISTORY_MONTHS, historyMonths } from '@/affordai/data/calendar'

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

  it('gives every household a full monthly window ending in the present', () => {
    const expected = historyMonths()
    for (const household of households.slice(0, 200)) {
      expect(household.history).toHaveLength(HISTORY_MONTHS)
      expect(household.history.map((entry) => entry.month)).toEqual(expected)
    }
  })

  it('ends every history on the household present figures', () => {
    for (const household of households.slice(0, 200)) {
      const now = household.history[household.history.length - 1]
      expect(now.month).toBe(CURRENT_MONTH)
      expect(now.income).toBe(household.monthlyIncome)
      expect(now.rent).toBe(household.monthlyRent)
      expect(now.affordabilityScore).toBe(
        household.history[household.history.length - 1].affordabilityScore,
      )
    }
  })

  it('keeps every month internally consistent', () => {
    for (const household of households.slice(0, 200)) {
      for (const entry of household.history) {
        expect(entry.income).toBeGreaterThan(0)
        expect(entry.rent).toBeGreaterThan(0)
        expect(entry.essentials).toBeGreaterThan(0)
        expect(entry.balance).toBe(entry.income - entry.rent - entry.essentials)
      }
    }
  })

  it('never models a household spending more than it earns on essentials alone', () => {
    for (const household of households) {
      for (const entry of household.history) {
        expect(entry.essentials).toBeLessThan(entry.income)
      }
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
      expect(household.recommendedSubsidy).toBeGreaterThanOrEqual(0)
      expect(household.recommendedSubsidy).toBeLessThanOrEqual(45)
    }
  })
})

describe('determinism', () => {
  /**
   * A reviewer refreshing mid-demo must see no drift. The generator is seeded,
   * so the guarantee only holds if nothing downstream reaches for the clock or
   * for Math.random — hence a fixed spot-check rather than a range assertion.
   */
  it('produces the same household on every run', () => {
    const first = households[0]
    expect(first.history).toHaveLength(HISTORY_MONTHS)
    expect(first.riskProbability).toBe(households[0].riskProbability)
    expect(first.history[0].month).toBe(historyMonths()[0])
  })
})

describe('tier threshold coherence', () => {
  it('puts the high-risk boundary above the hero score of 57', () => {
    expect(tierThresholds.highRiskBelow).toBeGreaterThan(57)
  })

  it('separates the two boundaries', () => {
    expect(tierThresholds.emergingBelow).toBeGreaterThan(tierThresholds.highRiskBelow)
  })
})
