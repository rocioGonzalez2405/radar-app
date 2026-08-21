import { historyMonths } from '@/affordai/data/calendar'
import type { Household, HouseholdMonth } from '@/affordai/data/types'

/**
 * The three demonstration households the proposal asks for: one stable, one
 * already vulnerable, and one still afloat but deteriorating.
 *
 * WHAT IS AUTHORED AND WHAT IS NOT
 *
 * Only the INPUTS below are authored — size, area, employment, and the monthly
 * ledger. `riskProbability` and `recommendedSubsidy` are left at placeholder
 * values here and overwritten in households.ts, which runs every hero through
 * the same model and the same rules engine as the other 12,479 records. A hero
 * whose risk were typed in by hand would prove nothing on stage.
 *
 * Ledgers are built from anchor points and interpolated, so the trajectory can
 * be read at a glance instead of being buried in seventy-two hand-typed rows.
 */

/** The household the ten-step demo walks through: already vulnerable. */
export const HERO_HOUSEHOLD_ID = 10482
/** Counter-example: comfortable, and the console should leave it alone. */
export const STABLE_HOUSEHOLD_ID = 10105
/** The case that justifies the project: not in crisis yet, but heading there. */
export const DETERIORATING_HOUSEHOLD_ID = 10731

interface Anchor {
  /** Months from the start of the window. 0 is oldest, 23 is the present. */
  at: number
  value: number
}

/** Linear interpolation between anchors, rounded to whole currency. */
const series = (anchors: Anchor[], length: number): number[] => {
  const sorted = [...anchors].sort((a, b) => a.at - b.at)
  return Array.from({ length }, (_unused, index) => {
    const next = sorted.find((anchor) => anchor.at >= index) ?? sorted[sorted.length - 1]
    const previous =
      [...sorted].reverse().find((anchor) => anchor.at <= index) ?? sorted[0]
    if (next.at === previous.at) return Math.round(next.value)
    const progress = (index - previous.at) / (next.at - previous.at)
    return Math.round(previous.value + (next.value - previous.value) * progress)
  })
}

interface LedgerSpec {
  income: Anchor[]
  rent: Anchor[]
  essentials: Anchor[]
  /** Month-indexed overrides applied after interpolation, for scripted events. */
  incomeOverrides?: Record<number, number>
  essentialsOverrides?: Record<number, number>
}

const STABILITY_PENALTY = { High: 0, Medium: 4, Low: 9 } as const

const scoreFor = (burden: number, size: number, penalty: number) =>
  Math.min(100, Math.max(0, Math.round(118 - burden * 95 - (size - 1) * 1.8 - penalty)))

/**
 * `scoreOffset` shifts the whole score curve by a constant.
 *
 * Needed for exactly one record. The brief hands us household #10482's
 * affordability score of 57 alongside a $4,200 income and an $1,850 rent, and
 * `scoreFor` does not produce 57 from those two numbers — it produces 67. The
 * brief's figure is the one the demo says out loud and the one the tier cut is
 * calibrated against, so it wins, and the offset carries the rest of the curve
 * with it rather than letting the header and the chart disagree by ten points.
 */
const buildLedger = (
  spec: LedgerSpec,
  size: number,
  penalty: number,
  scoreOffset = 0,
): HouseholdMonth[] => {
  const months = historyMonths()
  const income = series(spec.income, months.length)
  const rent = series(spec.rent, months.length)
  const essentials = series(spec.essentials, months.length)

  return months.map((month, index) => {
    const monthIncome = spec.incomeOverrides?.[index] ?? income[index]
    const monthEssentials = spec.essentialsOverrides?.[index] ?? essentials[index]
    return {
      month,
      income: monthIncome,
      rent: rent[index],
      essentials: monthEssentials,
      balance: monthIncome - rent[index] - monthEssentials,
      affordabilityScore: Math.max(
        0,
        scoreFor(rent[index] / monthIncome, size, penalty) + scoreOffset,
      ),
    }
  })
}

/**
 * Household #10482 — ALREADY VULNERABLE.
 *
 * Income has slipped for two years while rent and essentials climbed. Two of
 * the last six months closed underwater after a spell of reduced hours. The
 * figures a demo reads aloud — 4 people, $4,200 income, $1,850 rent, an
 * affordability score of 57 — come from the product brief.
 */
const heroLedger = buildLedger(
  {
    income: [
      { at: 0, value: 4600 },
      { at: 12, value: 4450 },
      { at: 17, value: 4400 },
      { at: 23, value: 4200 },
    ],
    rent: [
      { at: 0, value: 1500 },
      { at: 12, value: 1700 },
      { at: 23, value: 1850 },
    ],
    essentials: [
      { at: 0, value: 1600 },
      { at: 12, value: 2000 },
      { at: 23, value: 2300 },
    ],
    // Reduced hours in the spring; hours restored, income not yet recovered.
    incomeOverrides: { 21: 4000, 22: 3950 },
  },
  4,
  STABILITY_PENALTY.Medium,
  -10,
)

/**
 * Household #10105 — STABLE.
 *
 * Income growing, rent almost flat, every month closes well in the black. The
 * engine should recommend nothing. A console that cannot say "no subsidy" is
 * not a console, it is a disbursement queue.
 */
const stableLedger = buildLedger(
  {
    income: [
      { at: 0, value: 6100 },
      { at: 23, value: 6600 },
    ],
    rent: [
      { at: 0, value: 1725 },
      { at: 23, value: 1800 },
    ],
    essentials: [
      { at: 0, value: 1420 },
      { at: 23, value: 1520 },
    ],
  },
  3,
  STABILITY_PENALTY.High,
)

/**
 * Household #10731 — DETERIORATING. The most important record in the dataset.
 *
 * Today it still balances, and its affordability score is unremarkable, so
 * every threshold-based view in this console reads it as fine. What the model
 * sees is the slope: income down over six months, rent up over twelve,
 * essentials climbing, and the balance thinning toward zero.
 *
 * This is the household the proposal is arguing for. A rules-only system finds
 * it after the crisis; a trend-aware one finds it before.
 */
const deterioratingLedger = buildLedger(
  {
    income: [
      { at: 0, value: 5400 },
      { at: 12, value: 5300 },
      { at: 17, value: 5200 },
      { at: 23, value: 4550 },
    ],
    rent: [
      { at: 0, value: 1350 },
      { at: 12, value: 1500 },
      { at: 23, value: 1750 },
    ],
    essentials: [
      { at: 0, value: 1750 },
      { at: 12, value: 2050 },
      { at: 23, value: 2400 },
    ],
  },
  5,
  STABILITY_PENALTY.Medium,
)

const present = (ledger: HouseholdMonth[]) => ledger[ledger.length - 1]

/**
 * Hand-authored records, injected into the generated population by id.
 * Generated data will not land on the narrative beats, so the beats are
 * authored and the population around them is generated.
 */
export const heroHouseholds: Household[] = [
  {
    id: HERO_HOUSEHOLD_ID,
    size: 4,
    monthlyIncome: present(heroLedger).income,
    monthlyRent: present(heroLedger).rent,
    employmentStability: 'Medium',
    area: 'eastside',
    currentSubsidy: 18,
    recommendedSubsidy: 18,
    affordabilityScore: 57,
    rentBurden: 0.44,
    tier: 'high-risk',
    riskProbability: 0,
    history: heroLedger,
  },
  {
    id: STABLE_HOUSEHOLD_ID,
    size: 3,
    monthlyIncome: present(stableLedger).income,
    monthlyRent: present(stableLedger).rent,
    employmentStability: 'High',
    area: 'north-county',
    currentSubsidy: 0,
    recommendedSubsidy: 0,
    affordabilityScore: 89,
    rentBurden: 0.273,
    tier: 'stable',
    riskProbability: 0,
    history: stableLedger,
  },
  {
    id: DETERIORATING_HOUSEHOLD_ID,
    size: 5,
    monthlyIncome: present(deterioratingLedger).income,
    monthlyRent: present(deterioratingLedger).rent,
    employmentStability: 'Medium',
    area: 'downtown',
    currentSubsidy: 0,
    recommendedSubsidy: 0,
    affordabilityScore: 70,
    rentBurden: 0.385,
    tier: 'stable',
    riskProbability: 0,
    history: deterioratingLedger,
  },
]
