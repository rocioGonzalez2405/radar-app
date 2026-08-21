import { describe, expect, it } from 'vitest'
import { AREAS } from '@/affordai/data/areas'
import { HERO_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import { HERO_FACTORS, POPULATION_FACTORS } from '@/affordai/data/factors'
import {
  areaDetail,
  areaDetails,
  householdById,
  kpis,
  tierCounts,
  vulnerabilitySeries,
} from '@/affordai/data/selectors'
import type { TimeRange } from '@/affordai/data/types'

describe('factors', () => {
  it('sums both factor sets to 100 percent', () => {
    const sum = (factors: { contribution: number }[]) =>
      factors.reduce((total, factor) => total + factor.contribution, 0)
    expect(sum(POPULATION_FACTORS)).toBe(100)
    expect(sum(HERO_FACTORS)).toBe(100)
  })

  it('uses the brief contributions for the hero household', () => {
    expect(HERO_FACTORS).toEqual([
      { label: 'Rent burden', contribution: 34 },
      { label: 'Income decline', contribution: 27 },
      { label: 'Food inflation', contribution: 19 },
      { label: 'Household size', contribution: 12 },
      { label: 'Employment instability', contribution: 8 },
    ])
  })
})

describe('kpis', () => {
  it('derives the brief headline numbers from the population', () => {
    const result = kpis()
    expect(result.householdsMonitored).toBe(12482)
    expect(result.currentlyVulnerable).toBe(1846)
    expect(result.highRisk).toBe(623)
    expect(result.subsidiesAllocated).toBe(184000)
    expect(result.interventionEffectiveness).toBe(87)
  })

  it('carries a trend delta for every headline number', () => {
    const { deltas } = kpis()
    expect(Object.values(deltas).every((value) => typeof value === 'number')).toBe(true)
    expect(deltas.currentlyVulnerable).toBeGreaterThan(0)
  })
})

describe('tierCounts', () => {
  it('partitions the whole population', () => {
    const counts = tierCounts()
    expect(counts.stable + counts.emerging + counts['high-risk']).toBe(12482)
  })
})

describe('areaDetails', () => {
  it('covers every area and accounts for every household', () => {
    const details = areaDetails()
    expect(details).toHaveLength(AREAS.length)
    const monitored = details.reduce((total, area) => total + area.householdsMonitored, 0)
    expect(monitored).toBe(12482)
  })

  it('reports Eastside as the most vulnerable area', () => {
    const sorted = [...areaDetails()].sort((a, b) => b.vulnerabilityRate - a.vulnerabilityRate)
    expect(sorted[0].id).toBe('eastside')
  })

  it('resolves a single area by id', () => {
    expect(areaDetail('eastside').label).toBe('Eastside')
  })
})

describe('vulnerabilitySeries', () => {
  const ranges: TimeRange[] = ['30d', '90d', '6m', '1y']

  it('returns a non-empty series whose categories sum to the population', () => {
    for (const range of ranges) {
      const series = vulnerabilitySeries(range)
      expect(series.length).toBeGreaterThan(1)
      for (const point of series) {
        expect(point.stable + point.emerging + point.highRisk).toBe(12482)
      }
    }
  })

  it('ends on the current tier counts', () => {
    const series = vulnerabilitySeries('90d')
    const last = series[series.length - 1]
    expect(last.highRisk).toBe(623)
    expect(last.emerging + last.highRisk).toBe(1846)
  })

  it('shows vulnerability rising over the range', () => {
    const series = vulnerabilitySeries('90d')
    const first = series[0]
    const last = series[series.length - 1]
    expect(last.emerging + last.highRisk).toBeGreaterThan(first.emerging + first.highRisk)
  })
})

describe('householdById', () => {
  it('finds the hero household', () => {
    expect(householdById(HERO_HOUSEHOLD_ID)?.id).toBe(HERO_HOUSEHOLD_ID)
  })

  it('returns undefined outside the population', () => {
    expect(householdById(1)).toBeUndefined()
  })
})
