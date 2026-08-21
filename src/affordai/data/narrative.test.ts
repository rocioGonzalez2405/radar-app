import { describe, expect, it } from 'vitest'
import {
  forecast90d,
  impactMetrics,
  productsByCategory,
  recommendations,
} from '@/affordai/data/selectors'

describe('recommendations', () => {
  it('leads with the Eastside food subsidy recommendation from the brief', () => {
    const first = recommendations()[0]
    expect(first.areaId).toBe('eastside')
    expect(first.impactPotential).toBe('High')
    expect(first.subsidyFrom).toBe(18)
    expect(first.subsidyTo).toBe(25)
    expect(first.drivers).toEqual([
      { label: 'Food at home, San Diego area', delta: '+1.1%', tier: 'reported' },
      { label: 'Median household income', delta: '-4.1%', tier: 'simulated' },
      {
        label: 'Very Low-Income renters cost burdened',
        delta: '87%',
        tier: 'verified',
      },
    ])
  })

  it('tiers every driver, never overstating a simulated one', () => {
    for (const recommendation of recommendations()) {
      for (const driver of recommendation.drivers) {
        expect(['verified', 'reported', 'simulated']).toContain(driver.tier)
      }
    }
    // Eviction filings have no public source at county level, so the driver
    // that cites them must stay simulated.
    const downtown = recommendations().find((r) => r.areaId === 'downtown')
    const evictions = downtown?.drivers.find((d) => d.label === 'Eviction filings')
    expect(evictions?.tier).toBe('simulated')
  })

  it('fills all four explainability slots on every recommendation', () => {
    for (const recommendation of recommendations()) {
      expect(recommendation.whatHappened.length).toBeGreaterThan(0)
      expect(recommendation.whyItMatters.length).toBeGreaterThan(0)
      expect(recommendation.modelPrediction.length).toBeGreaterThan(0)
      expect(recommendation.recommendedAction.length).toBeGreaterThan(0)
      expect(recommendation.factors.length).toBeGreaterThan(0)
    }
  })

  it('exposes unique ids', () => {
    const ids = recommendations().map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('products', () => {
  it('prices the staples from the BLS average price series', () => {
    const all = productsByCategory('all')
    const byLabel = new Map(all.map((product) => [product.label, product]))
    // BLS average price series, cited in sources.ts but not independently
    // retrieved from this environment.
    expect(byLabel.get('Milk')).toMatchObject({ marketPrice: 4.32, tier: 'reported' })
    expect(byLabel.get('Eggs')).toMatchObject({ marketPrice: 2.14, tier: 'reported' })
    expect(byLabel.get('Rice')).toMatchObject({ marketPrice: 0.879, tier: 'reported' })
    for (const product of all) {
      expect(product.recommendedPrice).toBeLessThan(product.currentPrice)
      expect(product.currentPrice).toBeLessThan(product.marketPrice)
    }
  })

  it('keeps every price without a BLS series simulated', () => {
    const unsourced = productsByCategory('all').filter(
      (product) => !['milk', 'eggs', 'rice'].includes(product.id),
    )
    expect(unsourced.length).toBeGreaterThan(0)
    expect(unsourced.every((product) => product.tier === 'simulated')).toBe(true)
  })

  it('derives both subsidised columns from the same program percentages', () => {
    for (const product of productsByCategory('all')) {
      expect(product.currentPrice).toBe(Number((product.marketPrice * 0.82).toFixed(2)))
      expect(product.recommendedPrice).toBe(
        Number((product.marketPrice * 0.73).toFixed(2)),
      )
    }
  })

  it('filters by category', () => {
    const dairy = productsByCategory('Dairy')
    expect(dairy.length).toBeGreaterThan(0)
    expect(dairy.every((product) => product.category === 'Dairy')).toBe(true)
  })
})

describe('forecast90d', () => {
  it('projects the brief 90-day figures', () => {
    const forecast = forecast90d()
    expect(forecast.current).toBe(1846)
    expect(forecast.projected).toBe(2213)
    expect(forecast.changePercent).toBeCloseTo(19.9, 1)
    expect(forecast.confidence).toBe(84)
  })

  it('splits the series into a historical run and a projected run', () => {
    const { series } = forecast90d()
    expect(series.some((point) => point.historical !== null)).toBe(true)
    expect(series.some((point) => point.projected !== null)).toBe(true)
    const last = series[series.length - 1]
    expect(last.projected).toBe(2213)
    expect(last.historical).toBeNull()
  })

  it('joins the two runs at one shared point so the line is continuous', () => {
    const { series } = forecast90d()
    const joins = series.filter(
      (point) => point.historical !== null && point.projected !== null,
    )
    expect(joins).toHaveLength(1)
  })

  it('is labelled simulated, because no public projection exists', () => {
    expect(forecast90d().tier).toBe('simulated')
  })

  it('lists the predicted drivers', () => {
    const labels = forecast90d().drivers.map((driver) => driver.label)
    expect(labels).toEqual([
      'Housing costs',
      'Food inflation',
      'Income volatility',
      'Employment changes',
    ])
  })
})

describe('impactMetrics', () => {
  it('reports the hero prevention metric', () => {
    expect(impactMetrics().preventedFromHighRisk).toBe(412)
  })

  it('is labelled simulated, because the program was never run', () => {
    expect(impactMetrics().tier).toBe('simulated')
  })

  it('improves on every before/after pair', () => {
    for (const pair of impactMetrics().beforeAfter) {
      expect(pair.after).toBeLessThan(pair.before)
    }
  })
})
