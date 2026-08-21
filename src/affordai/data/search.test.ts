import { describe, expect, it } from 'vitest'
import { HERO_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import { DEFAULT_QUERY, searchHouseholds } from '@/affordai/data/selectors'
import type { HouseholdQuery } from '@/affordai/data/types'

const query = (overrides: Partial<HouseholdQuery> = {}): HouseholdQuery => ({
  ...DEFAULT_QUERY,
  ...overrides,
})

describe('searchHouseholds', () => {
  it('returns the first page of the whole population by default', () => {
    const page = searchHouseholds(query())
    expect(page.total).toBe(12482)
    expect(page.rows).toHaveLength(DEFAULT_QUERY.pageSize)
    expect(page.page).toBe(1)
    expect(page.pageCount).toBe(Math.ceil(12482 / DEFAULT_QUERY.pageSize))
  })

  it('finds a household by id fragment', () => {
    const page = searchHouseholds(query({ search: String(HERO_HOUSEHOLD_ID) }))
    expect(page.total).toBe(1)
    expect(page.rows[0].id).toBe(HERO_HOUSEHOLD_ID)
  })

  it('finds households by area name', () => {
    const page = searchHouseholds(query({ search: 'eastside' }))
    expect(page.total).toBeGreaterThan(0)
    expect(page.rows.every((row) => row.area === 'eastside')).toBe(true)
  })

  it('filters by area', () => {
    const page = searchHouseholds(query({ area: 'downtown' }))
    expect(page.rows.every((row) => row.area === 'downtown')).toBe(true)
  })

  it('filters by tier', () => {
    const page = searchHouseholds(query({ tier: 'high-risk' }))
    expect(page.total).toBe(623)
    expect(page.rows.every((row) => row.tier === 'high-risk')).toBe(true)
  })

  it('filters by income band', () => {
    const page = searchHouseholds(query({ incomeBand: '3000-5000' }))
    expect(
      page.rows.every((row) => row.monthlyIncome >= 3000 && row.monthlyIncome < 5000),
    ).toBe(true)
  })

  it('sorts ascending and descending by affordability score', () => {
    const asc = searchHouseholds(query({ sortBy: 'affordabilityScore', sortDir: 'asc' }))
    const desc = searchHouseholds(query({ sortBy: 'affordabilityScore', sortDir: 'desc' }))
    expect(asc.rows[0].affordabilityScore).toBeLessThanOrEqual(
      asc.rows[asc.rows.length - 1].affordabilityScore,
    )
    expect(desc.rows[0].affordabilityScore).toBeGreaterThanOrEqual(
      desc.rows[desc.rows.length - 1].affordabilityScore,
    )
  })

  it('paginates without overlap', () => {
    const first = searchHouseholds(query({ page: 1 }))
    const second = searchHouseholds(query({ page: 2 }))
    const ids = new Set(first.rows.map((row) => row.id))
    expect(second.rows.some((row) => ids.has(row.id))).toBe(false)
  })

  it('clamps a page beyond the end to the last page', () => {
    const page = searchHouseholds(query({ page: 9999 }))
    expect(page.page).toBe(page.pageCount)
    expect(page.rows.length).toBeGreaterThan(0)
  })

  it('returns an empty page for a query that matches nothing', () => {
    const page = searchHouseholds(query({ search: 'zzzzzz' }))
    expect(page.total).toBe(0)
    expect(page.rows).toEqual([])
    expect(page.pageCount).toBe(1)
  })
})
