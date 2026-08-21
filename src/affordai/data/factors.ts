import { HERO_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import type { Household, RiskFactor } from '@/affordai/data/types'

/**
 * Contribution weights for the affordability risk model. Each set sums to 100.
 * These are presented as model attributions, never as ground truth — see
 * AiRationale and WhyThisRecommendation for the surrounding hedged language.
 */
export const POPULATION_FACTORS: RiskFactor[] = [
  { label: 'Rent burden', contribution: 31 },
  { label: 'Income decline', contribution: 24 },
  { label: 'Food inflation', contribution: 21 },
  { label: 'Household size', contribution: 13 },
  { label: 'Employment instability', contribution: 11 },
]

/** The brief's exact attribution for household #10482. */
export const HERO_FACTORS: RiskFactor[] = [
  { label: 'Rent burden', contribution: 34 },
  { label: 'Income decline', contribution: 27 },
  { label: 'Food inflation', contribution: 19 },
  { label: 'Household size', contribution: 12 },
  { label: 'Employment instability', contribution: 8 },
]

export const factorsFor = (household: Household): RiskFactor[] =>
  household.id === HERO_HOUSEHOLD_ID ? HERO_FACTORS : POPULATION_FACTORS
