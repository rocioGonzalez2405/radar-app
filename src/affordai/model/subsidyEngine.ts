import type { Household } from '@/affordai/data/types'

/**
 * How long an award runs before it is re-evaluated, and the period
 * `maxChangePerCycle` smooths across.
 *
 * Deliberately NOT the model's HORIZON_DAYS. Those are two different concepts
 * that were briefly the same constant: the horizon is how far ahead the
 * probability looks, the cycle is a program's operating rhythm. The proposal's
 * own worked example keeps them apart — a 78% risk of vulnerability, answered
 * with a subsidy of 40% "durante 30 días".
 */
export const CYCLE_DAYS = 30

/**
 * Subsidy rules engine.
 *
 * Deliberately separate from the risk model, and this separation is the single
 * most important decision in the AffordAI design. The model estimates a
 * probability; it never decides a benefit. Everything that turns a probability
 * into money lives in this file, as data, where it can be read, argued with,
 * and changed by someone who has never seen the model.
 *
 * What that buys:
 *  - a recommendation can be explained as "band, then need, then caps"
 *  - percentages, ceilings and duration move with the budget, with no retraining
 *  - no automated prediction ever controls a payment on its own
 *
 * The output is a RECOMMENDATION. A human approves it. See AffordStore.
 */

export interface SubsidyBand {
  /** Inclusive lower bound on the model's probability. */
  minRisk: number
  percent: number
  interpretation: string
}

export interface SubsidyPolicy {
  /** Ordered high to low. The first band whose `minRisk` is met wins. */
  bands: SubsidyBand[]
  /** Nothing this engine returns may exceed this, whatever the bands say. */
  maxPercent: number
  durationDays: number
  /**
   * Largest move, in percentage points, allowed in one review cycle.
   *
   * The proposal calls for avoiding sharp swings driven by a single unusual
   * month. A household one dollar over a band boundary should not jump thirty
   * points overnight, and a household that has one good month should not lose
   * its support before the recovery is real.
   */
  maxChangePerCycle: number
}

/**
 * DEMONSTRATION VALUES. The proposal is explicit that these percentages are an
 * illustration: real thresholds would come from specialists, an actual budget,
 * regulation, and pilot results. They are not a policy recommendation.
 */
export const DEMO_POLICY: SubsidyPolicy = {
  bands: [
    { minRisk: 0.7, percent: 40, interpretation: 'High risk — priority review and larger support' },
    { minRisk: 0.5, percent: 25, interpretation: 'Relevant risk — moderate temporary support' },
    { minRisk: 0.3, percent: 10, interpretation: 'Monitoring and light preventive support' },
    { minRisk: 0, percent: 0, interpretation: 'Stable or low risk — no subsidy' },
  ],
  maxPercent: 45,
  durationDays: CYCLE_DAYS,
  maxChangePerCycle: 12,
}

export type SubsidyCap = 'none' | 'policy-max' | 'smoothing'

export interface SubsidyDecision {
  /** What the engine recommends, after need, caps and smoothing. */
  percent: number
  /** What the risk band alone would have given. */
  bandPercent: number
  bandInterpretation: string
  /**
   * Monthly shortfall in currency: rent plus essentials minus income, floored
   * at zero. Zero does not mean "no support" — a household whose trends are
   * deteriorating has no gap yet, and catching it before it does is the point.
   */
  monthlyGap: number
  cappedBy: SubsidyCap
  durationDays: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const bandFor = (risk: number, policy: SubsidyPolicy = DEMO_POLICY): SubsidyBand => {
  const band = policy.bands.find((candidate) => risk >= candidate.minRisk)
  if (!band) throw new Error(`No subsidy band covers a risk of ${risk}`)
  return band
}

/** Rent plus essentials minus income, for the household's current month. */
export const monthlyGapFor = (household: Household): number => {
  const now = household.history[household.history.length - 1]
  return Math.max(0, Math.round(now.rent + now.essentials - now.income))
}

/**
 * Scales the band by how much of a shortfall the household actually has.
 *
 * A household already underwater gets the band and a little over; one that
 * still balances gets a reduced, preventive version of the same band. The
 * multiplier never reaches zero, because the whole premise is that risk is
 * worth acting on before the gap opens.
 *
 * The floor is 0.75, not something smaller, so the published band still means
 * roughly what it says. A policy that advertises 40% and pays 24% to everyone
 * has not modulated the band — it has quietly replaced it.
 */
const needMultiplier = (monthlyGap: number, monthlyRent: number) => {
  if (monthlyRent <= 0) return 1
  return 0.75 + 0.5 * clamp(monthlyGap / monthlyRent, 0, 1)
}

export const recommendSubsidy = (
  household: Household,
  risk: number,
  policy: SubsidyPolicy = DEMO_POLICY,
): SubsidyDecision => {
  const band = bandFor(risk, policy)
  const monthlyGap = monthlyGapFor(household)

  const needAdjusted = band.percent * needMultiplier(monthlyGap, household.monthlyRent)

  const capped = Math.min(needAdjusted, policy.maxPercent)

  // Smoothing governs CHANGES to an existing award, so a household already in
  // the program cannot swing on one unusual month in either direction. A
  // household entering the program has nothing to change from and starts at its
  // assessed level; ramping it up over several cycles would delay exactly the
  // early intervention this system exists to make.
  const enrolled = household.currentSubsidy > 0
  const smoothed = enrolled
    ? clamp(
        capped,
        household.currentSubsidy - policy.maxChangePerCycle,
        household.currentSubsidy + policy.maxChangePerCycle,
      )
    : capped

  let cappedBy: SubsidyCap = 'none'
  if (Math.round(smoothed) !== Math.round(capped)) cappedBy = 'smoothing'
  else if (needAdjusted > policy.maxPercent) cappedBy = 'policy-max'

  return {
    percent: Math.round(clamp(smoothed, 0, policy.maxPercent)),
    bandPercent: band.percent,
    bandInterpretation: band.interpretation,
    monthlyGap,
    cappedBy,
    durationDays: policy.durationDays,
  }
}
