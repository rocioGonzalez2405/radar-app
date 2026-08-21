import type { ImpactMetrics } from '@/affordai/data/types'

/**
 * Program-effectiveness figures. `preventedFromHighRisk` is the headline the
 * demo closes on; the Impact page adds interventions approved during the
 * session on top of these baselines.
 */
export const IMPACT: ImpactMetrics = {
  householdsStabilized: 1284,
  averageSubsidyPerHousehold: 143,
  vulnerabilityReduction: 11.6,
  costPerSuccessfulIntervention: 418,
  preventedFromHighRisk: 412,
  beforeAfter: [
    { label: 'High-risk households', before: 1035, after: 623 },
    { label: 'Average rent burden %', before: 42.7, after: 37.1 },
    { label: 'Households in arrears', before: 894, after: 512 },
  ],
}
