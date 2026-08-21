import { describe, expect, it } from 'vitest'
import { HERO_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import { households } from '@/affordai/data/households'

describe('hero household #10482', () => {
  const hero = households.find((h) => h.id === HERO_HOUSEHOLD_ID)

  it('is present in the searchable population', () => {
    expect(hero).toBeDefined()
  })

  it('carries the figures the demo reads aloud', () => {
    expect(hero).toMatchObject({
      size: 4,
      monthlyIncome: 4200,
      monthlyRent: 1850,
      employmentStability: 'Medium',
      area: 'eastside',
      currentSubsidy: 18,
      recommendedSubsidy: 27,
      affordabilityScore: 57,
      riskProbability: 0.82,
      tier: 'high-risk',
    })
  })

  it('shows three years of deterioration', () => {
    expect(hero?.history).toEqual([
      { year: 2024, income: 4600, rent: 1500, affordabilityScore: 78 },
      { year: 2025, income: 4400, rent: 1700, affordabilityScore: 69 },
      { year: 2026, income: 4200, rent: 1850, affordabilityScore: 57 },
    ])
  })
})
