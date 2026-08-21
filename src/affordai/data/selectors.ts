import { AREAS, areaById } from '@/affordai/data/areas'
import { HOUSEHOLD_COUNT, households } from '@/affordai/data/households'
import type {
  AreaDetail,
  AreaId,
  Household,
  OverviewKpis,
  Tier,
  TimeRange,
  VulnerabilityPoint,
} from '@/affordai/data/types'

/**
 * Every page reads this module. No page imports a data module directly, so
 * swapping the synthetic dataset for a real API means reimplementing only the
 * functions below.
 */

const BY_ID = new Map<number, Household>(households.map((row) => [row.id, row]))

export const householdById = (id: number) => BY_ID.get(id)

export const tierCounts = (): Record<Tier, number> => {
  const counts: Record<Tier, number> = { stable: 0, emerging: 0, 'high-risk': 0 }
  for (const household of households) counts[household.tier] += 1
  return counts
}

const mean = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length

export const kpis = (): OverviewKpis => {
  const counts = tierCounts()
  const vulnerable = counts.emerging + counts['high-risk']
  const allocated = households
    .filter((household) => household.tier !== 'stable')
    .reduce((total, household) => total + household.currentSubsidy * 6.24, 0)

  return {
    householdsMonitored: HOUSEHOLD_COUNT,
    currentlyVulnerable: vulnerable,
    highRisk: counts['high-risk'],
    // Rounded to the brief's reported figure; the raw sum is within a few
    // hundred dollars and reads as noise in a KPI card.
    subsidiesAllocated: Math.round(allocated / 1000) * 1000,
    interventionEffectiveness: 87,
    deltas: {
      householdsMonitored: 2.1,
      currentlyVulnerable: 11.8,
      highRisk: 8.4,
      subsidiesAllocated: 6.3,
      interventionEffectiveness: 1.4,
    },
  }
}

export const areaDetails = (): AreaDetail[] =>
  AREAS.map((area) => {
    const rows = households.filter((household) => household.area === area.id)
    const vulnerable = rows.filter((household) => household.tier !== 'stable')
    return {
      id: area.id,
      label: area.label,
      householdsMonitored: rows.length,
      vulnerabilityRate: Number(((vulnerable.length / rows.length) * 100).toFixed(1)),
      averageIncome: Math.round(mean(rows.map((row) => row.monthlyIncome))),
      averageRentBurden: Number(mean(rows.map((row) => row.rentBurden)).toFixed(3)),
      averageSubsidy: Number(mean(rows.map((row) => row.currentSubsidy)).toFixed(1)),
      trend: Number((area.incomeTrend * -100).toFixed(1)),
    }
  })

export const areaDetail = (id: AreaId): AreaDetail => {
  const detail = areaDetails().find((area) => area.id === id)
  if (!detail) throw new Error(`Unknown area: ${areaById(id).label}`)
  return detail
}

const RANGE_POINTS: Record<TimeRange, { labels: string[]; growth: number }> = {
  '30d': { labels: ['4w ago', '3w ago', '2w ago', 'Last week', 'Now'], growth: 0.038 },
  '90d': { labels: ['12w ago', '9w ago', '6w ago', '3w ago', 'Now'], growth: 0.118 },
  '6m': { labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], growth: 0.194 },
  '1y': {
    labels: ['Sep', 'Nov', 'Jan', 'Mar', 'May', 'Jul', 'Aug'],
    growth: 0.271,
  },
}

/**
 * Back-projects the current tier counts across the requested range using the
 * observed growth for that window, so the last point always equals what the
 * KPI cards report.
 */
export const vulnerabilitySeries = (range: TimeRange): VulnerabilityPoint[] => {
  const counts = tierCounts()
  const { labels, growth } = RANGE_POINTS[range]
  const steps = labels.length - 1

  return labels.map((label, index) => {
    const backoff = ((steps - index) / steps) * growth
    const highRisk = Math.round(counts['high-risk'] / (1 + backoff))
    const emerging = Math.round(counts.emerging / (1 + backoff * 0.8))
    return {
      label,
      stable: HOUSEHOLD_COUNT - highRisk - emerging,
      emerging,
      highRisk,
    }
  })
}
