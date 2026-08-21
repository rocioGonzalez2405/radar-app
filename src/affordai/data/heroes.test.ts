import { describe, expect, it } from 'vitest'
import { CURRENT_MONTH, HISTORY_MONTHS } from '@/affordai/data/calendar'
import {
  DETERIORATING_HOUSEHOLD_ID,
  HERO_HOUSEHOLD_ID,
  STABLE_HOUSEHOLD_ID,
} from '@/affordai/data/heroes'
import { households } from '@/affordai/data/households'
import { featuresFor } from '@/affordai/model/features'

const find = (id: number) => {
  const household = households.find((row) => row.id === id)
  if (!household) throw new Error(`Hero ${id} is missing from the population`)
  return household
}

describe('every demonstration household', () => {
  it.each([HERO_HOUSEHOLD_ID, STABLE_HOUSEHOLD_ID, DETERIORATING_HOUSEHOLD_ID])(
    'household #%s is searchable and carries a full monthly window',
    (id) => {
      const household = find(id)
      expect(household.history).toHaveLength(HISTORY_MONTHS)
      expect(household.history[household.history.length - 1].month).toBe(CURRENT_MONTH)
      expect(household.history[household.history.length - 1].income).toBe(
        household.monthlyIncome,
      )
    },
  )
})

/**
 * Household #10482 — the record the ten-step demo walks through.
 *
 * The INPUTS are asserted against the product brief. The OUTPUTS are asserted
 * as ranges and orderings, never as literals: the risk and the recommendation
 * come from the shared model and the shared rules engine, and pinning them to
 * an exact figure would turn any coefficient change into a failing test that
 * says nothing about whether the model got worse.
 */
describe('hero household #10482 — already vulnerable', () => {
  const hero = find(HERO_HOUSEHOLD_ID)

  it('carries the inputs the demo reads aloud', () => {
    expect(hero).toMatchObject({
      size: 4,
      monthlyIncome: 4200,
      monthlyRent: 1850,
      employmentStability: 'Medium',
      area: 'eastside',
      currentSubsidy: 18,
      affordabilityScore: 57,
      tier: 'high-risk',
    })
  })

  it('shows two years of deterioration in its ledger', () => {
    const [oldest] = hero.history
    const now = hero.history[hero.history.length - 1]
    expect(now.income).toBeLessThan(oldest.income)
    expect(now.rent).toBeGreaterThan(oldest.rent)
    expect(now.essentials).toBeGreaterThan(oldest.essentials)
  })

  it('has months that did not balance', () => {
    expect(hero.history.some((entry) => entry.balance < 0)).toBe(true)
    expect(featuresFor(hero).negativeBalanceRate).toBeGreaterThan(0)
  })

  it('is read as high risk and offered more support than it has', () => {
    expect(hero.riskProbability).toBeGreaterThanOrEqual(0.7)
    expect(hero.recommendedSubsidy).toBeGreaterThan(hero.currentSubsidy)
  })
})

describe('household #10105 — stable', () => {
  const stable = find(STABLE_HOUSEHOLD_ID)

  it('is comfortable on every month of its ledger', () => {
    expect(stable.history.every((entry) => entry.balance > 0)).toBe(true)
    expect(stable.tier).toBe('stable')
  })

  it('is growing, not slipping', () => {
    expect(featuresFor(stable).incomeDrop6m).toBeLessThan(0)
  })

  /** A console that cannot say "no subsidy" is a disbursement queue. */
  it('is offered nothing', () => {
    expect(stable.riskProbability).toBeLessThan(0.3)
    expect(stable.recommendedSubsidy).toBe(0)
  })
})

/**
 * Household #10731 — the case the whole proposal is arguing for.
 *
 * Every threshold-based view in this console reads it as fine. The model does
 * not. If this test ever passes trivially — because the tier moved, or because
 * the household went underwater — the demonstration has lost its point and the
 * ledger needs re-authoring, not the assertion.
 */
describe('household #10731 — deteriorating, and not yet in crisis', () => {
  const deteriorating = find(DETERIORATING_HOUSEHOLD_ID)

  it('still balances every month', () => {
    expect(deteriorating.history.every((entry) => entry.balance > 0)).toBe(true)
  })

  it('reads as unremarkable to the descriptive index', () => {
    expect(deteriorating.tier).toBe('stable')
    expect(deteriorating.affordabilityScore).toBeGreaterThan(65)
  })

  it('is flagged by the model anyway, on its trends', () => {
    expect(deteriorating.riskProbability).toBeGreaterThanOrEqual(0.5)

    const features = featuresFor(deteriorating)
    expect(features.incomeDrop6m).toBeGreaterThan(0.05)
    expect(features.rentGrowth12m).toBeGreaterThan(0.1)
  })

  it('is offered preventive support before the gap opens', () => {
    expect(deteriorating.recommendedSubsidy).toBeGreaterThan(0)
  })

  it('scores better than the vulnerable hero while carrying more risk', () => {
    const hero = find(HERO_HOUSEHOLD_ID)
    expect(deteriorating.affordabilityScore).toBeGreaterThan(hero.affordabilityScore)
    expect(deteriorating.riskProbability).toBeGreaterThan(
      find(STABLE_HOUSEHOLD_ID).riskProbability,
    )
  })
})

describe('hero coherence with the generated population', () => {
  it('ranks the vulnerable hero inside the high-risk cut on its own score', () => {
    const ranked = [...households].sort(
      (a, b) => a.affordabilityScore - b.affordabilityScore || a.id - b.id,
    )
    const heroRank = ranked.findIndex((h) => h.id === HERO_HOUSEHOLD_ID)
    expect(heroRank).toBeGreaterThanOrEqual(0)
    expect(heroRank).toBeLessThan(623)
  })

  it('keeps the hero unremarkable among high-risk households', () => {
    const generated = households.filter(
      (h) => h.tier === 'high-risk' && h.id !== HERO_HOUSEHOLD_ID,
    )
    const subsidies = generated.map((h) => h.currentSubsidy)
    expect(Math.min(...subsidies)).toBeLessThanOrEqual(18)
    expect(Math.max(...subsidies)).toBeGreaterThanOrEqual(18)

    const risks = generated.map((h) => h.riskProbability)
    expect(Math.max(...risks)).toBeGreaterThanOrEqual(find(HERO_HOUSEHOLD_ID).riskProbability)
  })
})
