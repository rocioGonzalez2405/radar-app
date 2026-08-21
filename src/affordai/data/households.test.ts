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

describe('tier threshold coherence', () => {
  it('puts the high-risk boundary above the hero score of 57', () => {
    expect(tierThresholds.highRiskBelow).toBeGreaterThan(57)
  })

  it('separates the two boundaries', () => {
    expect(tierThresholds.emergingBelow).toBeGreaterThan(tierThresholds.highRiskBelow)
  })
})
