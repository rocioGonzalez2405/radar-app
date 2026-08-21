import { AREAS, areaById } from '@/affordai/data/areas'
import type { AreaId, EmploymentStability, Household, HouseholdMonth } from '@/affordai/data/types'

/**
 * The feature vector the risk model reads.
 *
 * Every field is expressed on a roughly 0..1 scale so the model's coefficients
 * are directly comparable to one another, and so a contribution can be read as
 * "this much of the logit" without a normalisation step in between.
 *
 * Half of these are TRENDS, and that is deliberate. A household's present
 * snapshot says whether it is struggling today; the slope of its ledger says
 * whether it is about to. The second question is the one this console exists to
 * answer.
 */
export interface RiskFeatures {
  /** Rent as a share of income, current month. */
  rentBurden: number
  /** Essential spending as a share of income, current month. */
  essentialsBurden: number
  /** Income lost over six months, as a share. Negative means income grew. */
  incomeDrop6m: number
  /** Rent gained over twelve months, as a share. Negative means rent fell. */
  rentGrowth12m: number
  /** Share of the last six months that closed with a negative balance. */
  negativeBalanceRate: number
  /** Coefficient of variation of income over the last twelve months. */
  incomeVolatility: number
  /** Household size, rescaled from the 1..7 generated range onto 0..1. */
  householdSize: number
  /** Employment stability inverted: High is 0, Low is 1. */
  employmentInstability: number
  /** The area's typical rent burden, rescaled across areas onto 0..1. */
  areaPressure: number
}

export type FeatureKey = keyof RiskFeatures

/**
 * Plain-language names. The PDF is explicit that explanations must reach the
 * dashboard as sentences a caseworker can read, not as variable names, so the
 * UI never sees a `FeatureKey`.
 */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  rentBurden: 'Rent burden',
  essentialsBurden: 'Essential spending',
  incomeDrop6m: 'Income decline',
  rentGrowth12m: 'Rent increases',
  negativeBalanceRate: 'Months not balancing',
  incomeVolatility: 'Income instability',
  householdSize: 'Household size',
  employmentInstability: 'Employment instability',
  areaPressure: 'Area cost pressure',
}

export const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as FeatureKey[]

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const mean = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length

const INSTABILITY: Record<EmploymentStability, number> = {
  High: 0,
  Medium: 0.5,
  Low: 1,
}

const burdenMidpoint = (id: AreaId) => {
  const [low, high] = areaById(id).burdenRange
  return (low + high) / 2
}

const AREA_MIDPOINTS = AREAS.map((area) => burdenMidpoint(area.id))
const AREA_MIN = Math.min(...AREA_MIDPOINTS)
const AREA_SPAN = Math.max(...AREA_MIDPOINTS) - AREA_MIN

/** Rescales an area's typical burden onto 0..1 across the four areas. */
export const areaPressureFor = (id: AreaId) =>
  AREA_SPAN === 0 ? 0.5 : (burdenMidpoint(id) - AREA_MIN) / AREA_SPAN

/** Reads `offset` months back from the present. Clamps at the oldest record. */
const monthsAgo = (history: HouseholdMonth[], offset: number): HouseholdMonth =>
  history[Math.max(0, history.length - 1 - offset)]

const coefficientOfVariation = (values: number[]) => {
  const average = mean(values)
  if (average === 0) return 0
  const variance = mean(values.map((value) => (value - average) ** 2))
  return Math.sqrt(variance) / average
}

export const featuresFor = (household: Household): RiskFeatures => {
  const { history } = household
  if (history.length === 0) {
    throw new Error(`Household ${household.id} has no history to read`)
  }

  const now = history[history.length - 1]
  const sixMonthsAgo = monthsAgo(history, 6)
  const twelveMonthsAgo = monthsAgo(history, 12)
  const lastSix = history.slice(-6)
  const lastTwelve = history.slice(-12)

  return {
    rentBurden: clamp(now.rent / now.income, 0, 1),
    essentialsBurden: clamp(now.essentials / now.income, 0, 1),
    incomeDrop6m: clamp((sixMonthsAgo.income - now.income) / sixMonthsAgo.income, -0.5, 0.5),
    rentGrowth12m: clamp((now.rent - twelveMonthsAgo.rent) / twelveMonthsAgo.rent, -0.5, 0.5),
    negativeBalanceRate:
      lastSix.filter((month) => month.balance < 0).length / lastSix.length,
    incomeVolatility: clamp(
      coefficientOfVariation(lastTwelve.map((month) => month.income)),
      0,
      0.5,
    ),
    householdSize: clamp((household.size - 1) / 6, 0, 1),
    employmentInstability: INSTABILITY[household.employmentStability],
    areaPressure: areaPressureFor(household.area),
  }
}
