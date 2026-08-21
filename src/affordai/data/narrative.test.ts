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
      { label: 'Food prices', delta: '+9.2%' },
      { label: 'Median household income', delta: '-4.1%' },
      { label: 'Rent burden', delta: '+6.8%' },
    ])
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
  it('prices the brief staples with recommended below current below market', () => {
    const all = productsByCategory('all')
    const byLabel = new Map(all.map((product) => [product.label, product]))
    expect(byLabel.get('Milk')).toMatchObject({
      marketPrice: 4.5,
      currentPrice: 3.7,
      recommendedPrice: 3.2,
    })
    expect(byLabel.get('Eggs')).toMatchObject({
      marketPrice: 6.2,
      currentPrice: 5.1,
      recommendedPrice: 4.4,
    })
    expect(byLabel.get('Rice')).toMatchObject({
      marketPrice: 8,
      currentPrice: 6.6,
      recommendedPrice: 5.8,
    })
    for (const product of all) {
      expect(product.recommendedPrice).toBeLessThan(product.currentPrice)
      expect(product.currentPrice).toBeLessThan(product.marketPrice)
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

  it('improves on every before/after pair', () => {
    for (const pair of impactMetrics().beforeAfter) {
      expect(pair.after).toBeLessThan(pair.before)
    }
  })
})
