import { HERO_FACTORS, POPULATION_FACTORS } from '@/affordai/data/factors'
import type { Recommendation } from '@/affordai/data/types'

/**
 * Every recommendation fills the four explainability slots the product
 * requires: what happened, why it matters, what the model predicts, and what
 * action is recommended. A recommendation that cannot fill all four does not
 * belong on the Overview page.
 */
export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-eastside-food',
    title: 'Increase food subsidy in Eastside',
    areaId: 'eastside',
    impactPotential: 'High',
    whatHappened:
      'Food prices rose 9.2% while median household income fell 4.1% over the last 90 days.',
    whyItMatters:
      'Rent burden climbed 6.8% in the same window, pushing 1 in 5 Eastside households above the regional housing-burden threshold.',
    modelPrediction:
      'The model estimates a 78% probability that Eastside vulnerability keeps rising over the next 90 days, based on available data.',
    recommendedAction:
      'Increase the average food subsidy from 18% to 25% for qualifying households.',
    drivers: [
      { label: 'Food prices', delta: '+9.2%' },
      { label: 'Median household income', delta: '-4.1%' },
      { label: 'Rent burden', delta: '+6.8%' },
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
    whatHappened:
      'Downtown rents rose 5.4% while household income stayed flat over two quarters.',
    whyItMatters:
      'Households in the 3,000-5,000 income band now spend more than 40% of income on rent, the band where the model sees the fastest tier transitions.',
    modelPrediction:
      'Predicted risk of 214 additional households entering the emerging tier within 90 days.',
    recommendedAction:
      'Open a temporary rent-bridge window covering 6% of monthly rent for the affected income band.',
    drivers: [
      { label: 'Median rent', delta: '+5.4%' },
      { label: 'Median household income', delta: '0.0%' },
      { label: 'Eviction filings', delta: '+3.1%' },
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
      'South County vulnerability has been flat for two quarters at 12.4%.',
    whyItMatters:
      'Reallocating from a stable area is cheaper than raising the total program budget, but only while the trend holds.',
    modelPrediction:
      'The model predicts no material change over the next 90 days, with lower confidence than other areas because of sparse income reporting.',
    recommendedAction:
      'Hold subsidy levels and re-evaluate after the next income-reporting cycle.',
    drivers: [
      { label: 'Vulnerability rate', delta: '0.0%' },
      { label: 'Median rent', delta: '+1.2%' },
      { label: 'Reporting coverage', delta: '-8.0%' },
    ],
    subsidyFrom: 15,
    subsidyTo: 15,
    factors: POPULATION_FACTORS,
  },
]
