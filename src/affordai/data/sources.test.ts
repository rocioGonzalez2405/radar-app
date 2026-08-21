import { describe, expect, it } from 'vitest'
import { AFFORD_SOURCES, PROVENANCE_SUMMARY } from '@/affordai/data/sources'
import { COST_BURDEN_BANDS, COUNTY_HOUSING } from '@/affordai/data/costBurden'

describe('source registry', () => {
  it('mirrors the shape Radar uses for its Sources page', () => {
    for (const source of AFFORD_SOURCES) {
      expect(source.name.length).toBeGreaterThan(0)
      expect(['public', 'protected', 'unpublished']).toContain(source.status)
      expect(source.dataAsOf.length).toBeGreaterThan(0)
      expect(source.lastVerified.length).toBeGreaterThan(0)
      expect(['verified', 'reported', 'simulated']).toContain(source.tier)
    }
  })

  it('marks every reported source as not independently retrieved', () => {
    for (const source of AFFORD_SOURCES.filter((s) => s.tier === 'reported')) {
      expect(source.note).toBeTruthy()
      expect(source.note?.toLowerCase()).toContain('not independently retrieved')
    }
  })

  it('carries at least one source in each tier', () => {
    for (const tier of ['verified', 'reported', 'simulated'] as const) {
      expect(AFFORD_SOURCES.some((s) => s.tier === tier)).toBe(true)
    }
  })

  it('summarises provenance for the shell', () => {
    expect(PROVENANCE_SUMMARY).toContain('simulated')
  })
})

describe('county housing figures', () => {
  it('matches the California Housing Partnership report', () => {
    expect(COUNTY_HOUSING.averageAskingRent).toBe(2606)
    expect(COUNTY_HOUSING.hourlyWageNeeded).toBe(50.12)
    expect(COUNTY_HOUSING.minimumWageMultiple).toBe(2.8)
    expect(COUNTY_HOUSING.renterHouseholdsWithoutAffordableHome).toBe(129829)
    expect(COUNTY_HOUSING.tier).toBe('verified')
  })
})

describe('cost burden bands', () => {
  it('carries all five income bands from the report', () => {
    expect(COST_BURDEN_BANDS).toHaveLength(5)
    expect(COST_BURDEN_BANDS[0]).toMatchObject({
      band: 'Extremely Low-Income',
      costBurdened: 90,
      severelyCostBurdened: 79,
    })
    expect(COST_BURDEN_BANDS[4]).toMatchObject({
      band: 'Above Moderate-Income',
      costBurdened: 8,
      severelyCostBurdened: 1,
    })
  })

  it('keeps severe burden at or below total burden in every band', () => {
    for (const band of COST_BURDEN_BANDS) {
      expect(band.severelyCostBurdened).toBeLessThanOrEqual(band.costBurdened)
    }
  })

  it('falls monotonically as income rises', () => {
    const rates = COST_BURDEN_BANDS.map((band) => band.costBurdened)
    expect([...rates].sort((a, b) => b - a)).toEqual(rates)
  })
})
