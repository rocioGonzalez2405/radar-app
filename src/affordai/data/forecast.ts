import type { Forecast } from '@/affordai/data/types'

const CURRENT = 1846
const PROJECTED = 2213

/**
 * SIMULATED — no public source exists for any figure below. The series counts
 * households in a hypothetical subsidy program's caseload, the projection is
 * that program's model output, and no caseload roster or vulnerability
 * projection for San Diego County is published. The driver weights are a model
 * attribution over simulated data, not measured elasticities. Nothing here is
 * covered by the "Data verified through August 2026" badge in the top bar.
 *
 * The historical run and the projected run share the "Now" point so Recharts
 * draws one continuous line with the projection dashed. Every other point in a
 * run is null on the opposite key.
 */
export const FORECAST: Forecast = {
  current: CURRENT,
  projected: PROJECTED,
  changePercent: Number((((PROJECTED - CURRENT) / CURRENT) * 100).toFixed(1)),
  confidence: 84,
  series: [
    { label: '-90d', historical: 1651, projected: null },
    { label: '-60d', historical: 1723, projected: null },
    { label: '-30d', historical: 1794, projected: null },
    { label: 'Now', historical: CURRENT, projected: CURRENT },
    { label: '+30d', historical: null, projected: 1968 },
    { label: '+60d', historical: null, projected: 2094 },
    { label: '+90d', historical: null, projected: PROJECTED },
  ],
  tier: 'simulated',
  drivers: [
    { label: 'Housing costs', contribution: 38 },
    { label: 'Food inflation', contribution: 27 },
    { label: 'Income volatility', contribution: 21 },
    { label: 'Employment changes', contribution: 14 },
  ],
}
