import type { Forecast } from '@/affordai/data/types'

const CURRENT = 1846
const PROJECTED = 2213

/**
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
  drivers: [
    { label: 'Housing costs', contribution: 38 },
    { label: 'Food inflation', contribution: 27 },
    { label: 'Income volatility', contribution: 21 },
    { label: 'Employment changes', contribution: 14 },
  ],
}
