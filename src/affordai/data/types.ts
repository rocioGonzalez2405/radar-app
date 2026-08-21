export type AreaId = 'downtown' | 'eastside' | 'north-county' | 'south-county'

export type Tier = 'stable' | 'emerging' | 'high-risk'

export type EmploymentStability = 'High' | 'Medium' | 'Low'

export type TimeRange = '30d' | '90d' | '6m' | '1y'

/**
 * One month of a household's ledger. The risk model reads trends, not snapshots
 * — a household can still have income while its income falls, its rent climbs,
 * and its balance turns negative — so history is monthly, not annual.
 *
 * Ordered oldest to newest. The last entry is always the household's present.
 */
export interface HouseholdMonth {
  /** Calendar month, `YYYY-MM`. */
  month: string
  income: number
  rent: number
  /** Food, utilities, transport, medicine and basic schooling combined. */
  essentials: number
  /** `income - rent - essentials`. Negative means the month did not balance. */
  balance: number
  affordabilityScore: number
}

export interface Household {
  id: number
  size: number
  monthlyIncome: number
  monthlyRent: number
  employmentStability: EmploymentStability
  area: AreaId
  currentSubsidy: number
  recommendedSubsidy: number
  affordabilityScore: number
  rentBurden: number
  tier: Tier
  /** Model output. Probability of entering vulnerability inside the horizon. */
  riskProbability: number
  /** Twenty-four months, oldest first. The last entry is the present. */
  history: HouseholdMonth[]
}

export interface Area {
  id: AreaId
  label: string
  incomeMedian: number
  burdenRange: [number, number]
  incomeTrend: number
  share: number
}

export interface AreaDetail {
  id: AreaId
  label: string
  householdsMonitored: number
  vulnerabilityRate: number
  averageIncome: number
  averageRentBurden: number
  averageSubsidy: number
  trend: number
}

export interface RiskFactor {
  label: string
  contribution: number
}

export interface OverviewKpis {
  householdsMonitored: number
  currentlyVulnerable: number
  highRisk: number
  subsidiesAllocated: number
  interventionEffectiveness: number
  deltas: {
    householdsMonitored: number
    currentlyVulnerable: number
    highRisk: number
    subsidiesAllocated: number
    interventionEffectiveness: number
  }
}

export interface VulnerabilityPoint {
  label: string
  stable: number
  emerging: number
  highRisk: number
}

export interface Recommendation {
  id: string
  title: string
  areaId: AreaId
  impactPotential: 'High' | 'Medium' | 'Low'
  whatHappened: string
  whyItMatters: string
  modelPrediction: string
  recommendedAction: string
  drivers: { label: string; delta: string; tier: ProvenanceTier }[]
  subsidyFrom: number
  subsidyTo: number
  factors: RiskFactor[]
}

export interface Product {
  id: string
  label: string
  category: ProductCategory
  marketPrice: number
  currentPrice: number
  recommendedPrice: number
  /**
   * Applies to `marketPrice` only. `currentPrice` and `recommendedPrice` are
   * always simulated — they are a function of the hypothetical program's
   * subsidy percentages. See the header of products.ts.
   */
  tier: ProvenanceTier
}

export type ProductCategory = 'Dairy' | 'Protein' | 'Grains' | 'Produce'

export interface ForecastPoint {
  label: string
  historical: number | null
  projected: number | null
}

export interface Forecast {
  current: number
  projected: number
  changePercent: number
  confidence: number
  series: ForecastPoint[]
  drivers: RiskFactor[]
  tier: ProvenanceTier
}

export interface ImpactMetrics {
  householdsStabilized: number
  averageSubsidyPerHousehold: number
  vulnerabilityReduction: number
  costPerSuccessfulIntervention: number
  preventedFromHighRisk: number
  beforeAfter: { label: string; before: number; after: number }[]
  tier: ProvenanceTier
}

export interface HouseholdQuery {
  search: string
  area: AreaId | 'all'
  tier: Tier | 'all'
  incomeBand: 'all' | 'under-3000' | '3000-5000' | '5000-7000' | 'over-7000'
  sortBy: 'id' | 'affordabilityScore' | 'rentBurden' | 'monthlyIncome'
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export interface HouseholdPage {
  rows: Household[]
  total: number
  page: number
  pageCount: number
}

export interface TierThresholds
{
  highRiskBelow: number
  emergingBelow: number
}

/**
 * How much confidence a figure carries. `verified` was retrieved first-hand
 * from the named source; `reported` comes from a named source that could not be
 * retrieved from this environment; `simulated` has no public source, usually
 * because the records are protected or the program is hypothetical.
 */
export type ProvenanceTier = 'verified' | 'reported' | 'simulated'

export interface AffordSource {
  name: string
  /**
   * Radar's `SourceEntry` only distinguishes `public` from `protected`. This
   * console needs a third case: figures that are neither published nor withheld
   * for privacy, but simply not broken out at the granularity shown here.
   * Filing those under `protected` would misstate why they are missing.
   */
  status: 'public' | 'protected' | 'unpublished'
  dataAsOf: string
  lastVerified: string
  tier: ProvenanceTier
  note?: string
}

export interface CostBurdenBand {
  band: string
  costBurdened: number
  severelyCostBurdened: number
}
