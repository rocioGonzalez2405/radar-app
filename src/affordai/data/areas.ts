import type { Area, AreaId } from '@/affordai/data/types'

/**
 * Generation parameters per area. `share` values sum to 1 and decide how the
 * population is split; `incomeTrend` is the three-year direction of median
 * income and is what makes Eastside the area the demo walks through.
 */
export const AREAS: readonly Area[] = [
  {
    id: 'downtown',
    label: 'Downtown',
    incomeMedian: 5200,
    burdenRange: [0.28, 0.44],
    incomeTrend: -0.018,
    share: 0.31,
  },
  {
    id: 'eastside',
    label: 'Eastside',
    incomeMedian: 4300,
    burdenRange: [0.34, 0.52],
    incomeTrend: -0.041,
    share: 0.27,
  },
  {
    id: 'north-county',
    label: 'North County',
    incomeMedian: 6100,
    burdenRange: [0.24, 0.38],
    incomeTrend: 0.006,
    share: 0.23,
  },
  {
    id: 'south-county',
    label: 'South County',
    incomeMedian: 4800,
    burdenRange: [0.3, 0.47],
    incomeTrend: -0.012,
    share: 0.19,
  },
]

const BY_ID = new Map<AreaId, Area>(AREAS.map((area) => [area.id, area]))

export const areaById = (id: AreaId): Area => {
  const area = BY_ID.get(id)
  if (!area) throw new Error(`Unknown area: ${id}`)
  return area
}
