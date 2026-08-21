import type { Household } from '@/affordai/data/types'

/** The household the ten-step demo walks through. */
export const HERO_HOUSEHOLD_ID = 10482

/**
 * Hand-authored records, injected into the generated population by id.
 * Generated data will not land on the narrative beats, so the beats are
 * authored and the population around them is generated. Every figure here
 * comes from the product brief.
 */
export const heroHouseholds: Household[] = [
  {
    id: HERO_HOUSEHOLD_ID,
    size: 4,
    monthlyIncome: 4200,
    monthlyRent: 1850,
    employmentStability: 'Medium',
    area: 'eastside',
    currentSubsidy: 18,
    recommendedSubsidy: 27,
    affordabilityScore: 57,
    rentBurden: 0.44,
    tier: 'high-risk',
    riskProbability: 0.82,
    history: [
      { year: 2024, income: 4600, rent: 1500, affordabilityScore: 78 },
      { year: 2025, income: 4400, rent: 1700, affordabilityScore: 69 },
      { year: 2026, income: 4200, rent: 1850, affordabilityScore: 57 },
    ],
  },
]
