import { COUNTY_HOUSING, COUNTY_LABOR } from '@/affordai/data/costBurden'
import { HERO_FACTORS, POPULATION_FACTORS } from '@/affordai/data/factors'
import { BLS_PRICE_SIGNALS } from '@/affordai/data/products'
import type { Recommendation } from '@/affordai/data/types'

/**
 * Every recommendation fills the four explainability slots the product
 * requires: what happened, why it matters, what the model predicts, and what
 * action is recommended. A recommendation that cannot fill all four does not
 * belong on the Overview page.
 *
 * PROVENANCE — each driver carries its own tier, because a single
 * recommendation mixes them. The macro signals (county rent growth, cost
 * burden, CPI, unemployment) are cited; the caseload movements they are
 * combined with are `simulated`, and so is every model output — the
 * probabilities and household counts below are the hypothetical program's, not
 * observations. Where a driver had an invented percentage and a real public
 * figure exists, the real figure replaced it.
 *
 * No public source exists for eviction filings at county level (the same gap
 * Radar records in src/shared/data/radarData.ts), so that driver stays
 * `simulated` rather than being quietly cited.
 */
export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-eastside-food',
    title: 'Increase food subsidy in Eastside',
    areaId: 'eastside',
    impactPotential: 'High',
    whatHappened: `San Diego food-at-home prices rose ${BLS_PRICE_SIGNALS.foodAtHome2Month}% over the two months ending March 2026, and all items rose ${BLS_PRICE_SIGNALS.allItems12Month}% over the twelve months ending March 2026, while modeled median income in Eastside fell 4.1%.`,
    whyItMatters:
      'Countywide, 87% of Very Low-Income renter households are cost burdened and 46% are severely cost burdened. Eastside carries the highest modeled rent burden of the four areas, so the caseload here sits closest to that band.',
    modelPrediction:
      'The model estimates a 78% probability that Eastside vulnerability keeps rising over the next 90 days, based on available data.',
    recommendedAction:
      'Increase the average food subsidy from 18% to 25% for qualifying households.',
    drivers: [
      // BLS, Consumer Price Index, San Diego Area — not independently retrieved.
      { label: 'Food at home, San Diego area', delta: '+1.1%', tier: 'reported' },
      // No public source at this granularity: modeled caseload movement.
      { label: 'Median household income', delta: '-4.1%', tier: 'simulated' },
      // California Housing Partnership, 2026 AHNR: Very Low-Income cost burdened.
      { label: 'Very Low-Income renters cost burdened', delta: '87%', tier: 'verified' },
    ],
    subsidyFrom: 18,
    subsidyTo: 25,
    factors: HERO_FACTORS,
  },
  {
    id: 'rec-downtown-rent-bridge',
    title: 'Open a rent-bridge window in Downtown',
    areaId: 'downtown',
    impactPotential: 'Medium',
    whatHappened: `County asking rents rose ${COUNTY_HOUSING.rentIncrease5yr}% between 2020 and 2025, to an average of $${COUNTY_HOUSING.averageAskingRent.toLocaleString('en-US')} a month, while modeled Downtown household income stayed flat over two quarters.`,
    whyItMatters:
      'Affording that average rent takes $50.12 an hour, 2.8 times the City of San Diego minimum wage. In the simulated caseload, households in the 3,000-5,000 income band now spend more than 40% of income on rent — the band where the model sees the fastest tier transitions.',
    modelPrediction:
      'Predicted risk of 214 additional households entering the emerging tier within 90 days.',
    recommendedAction:
      'Open a temporary rent-bridge window covering 6% of monthly rent for the affected income band.',
    drivers: [
      // California Housing Partnership, 2026 AHNR: 22%, 2020-2025.
      { label: 'County asking rent, 2020-2025', delta: '+22%', tier: 'verified' },
      { label: 'Median household income', delta: '0.0%', tier: 'simulated' },
      // No public source for county eviction filings — see the module header.
      { label: 'Eviction filings', delta: '+3.1%', tier: 'simulated' },
    ],
    subsidyFrom: 12,
    subsidyTo: 18,
    factors: POPULATION_FACTORS,
  },
  {
    id: 'rec-south-county-hold',
    title: 'Hold current subsidy levels in South County',
    areaId: 'south-county',
    impactPotential: 'Low',
    whatHappened:
      'South County vulnerability has been flat for two quarters at 12.4% in the simulated caseload.',
    whyItMatters:
      'Reallocating from a stable area is cheaper than raising the total program budget, but only while the trend holds.',
    modelPrediction:
      'The model predicts no material change over the next 90 days, with lower confidence than other areas because of sparse income reporting.',
    recommendedAction:
      'Hold subsidy levels and re-evaluate after the next income-reporting cycle.',
    drivers: [
      { label: 'Vulnerability rate', delta: '0.0%', tier: 'simulated' },
      // California EDD, Local Area Unemployment Statistics, May 2026.
      {
        label: 'County unemployment',
        delta: `${COUNTY_LABOR.unemploymentCounty}%`,
        tier: 'verified',
      },
      { label: 'Reporting coverage', delta: '-8.0%', tier: 'simulated' },
    ],
    subsidyFrom: 15,
    subsidyTo: 15,
    factors: POPULATION_FACTORS,
  },
]
