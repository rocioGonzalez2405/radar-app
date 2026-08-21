import type { CostBurdenBand } from '@/affordai/data/types'

/**
 * Verified county-level housing and labour figures. Every number here was read
 * first-hand from the named public document, so it is the only material in this
 * module tree that Radar's "Data verified through August 2026" badge covers.
 * The simulated household population is anchored to these figures but is not
 * derived from real records — see households.ts and areas.ts.
 */

// Source: California Housing Partnership, "San Diego County 2026 Affordable
// Housing Needs Report", May 2026. Underlying data 2024.
export const COUNTY_HOUSING = {
  averageAskingRent: 2606, // USD/month, San Diego County
  hourlyWageNeeded: 50.12, // USD/hour needed to afford that rent
  minimumWageMultiple: 2.8, // × the City of San Diego minimum wage
  renterHouseholdsWithoutAffordableHome: 129829, // low-income renters, 2024
  interimHousingBeds: 8123, // 2024
  stateAndFederalFunding: 740_000_000, // USD
  fundingChangePercent: -9, // year over year
  renterHouseholds: 214_000, // approximate, countywide
  rentIncrease5yr: 22, // percent, 2020-2025
  source: 'California Housing Partnership, San Diego County 2026 Affordable Housing Needs Report',
  dataAsOf: 'May 2026',
  lastVerified: 'August 2026',
  tier: 'verified',
} as const

// Source: California EDD, June 2026 (May 2026 reference period). Same figures
// Radar cites in src/shared/data/radarData.ts.
export const COUNTY_LABOR = {
  unemploymentCounty: 3.9, // percent
  unemploymentState: 4.7,
  unemploymentNational: 4.1,
  source: 'California EDD, Local Area Unemployment Statistics',
  dataAsOf: 'May 2026',
  lastVerified: 'August 2026',
  tier: 'verified',
} as const

/**
 * Share of renter households paying more than 30% of income on housing
 * ("cost burdened") and more than 50% ("severely cost burdened"), by income
 * band. This is the county's real burden distribution and the most defensible
 * table in the console: the simulated caseload should be read against it, not
 * merged into it.
 */
// Source: California Housing Partnership, 2026 AHNR, 2024 data. Tier: verified.
export const COST_BURDEN_BANDS: CostBurdenBand[] = [
  { band: 'Extremely Low-Income', costBurdened: 90, severelyCostBurdened: 79 },
  { band: 'Very Low-Income', costBurdened: 87, severelyCostBurdened: 46 },
  { band: 'Low-Income', costBurdened: 63, severelyCostBurdened: 14 },
  { band: 'Moderate-Income', costBurdened: 29, severelyCostBurdened: 2 },
  { band: 'Above Moderate-Income', costBurdened: 8, severelyCostBurdened: 1 },
]
