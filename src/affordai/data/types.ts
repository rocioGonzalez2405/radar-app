export type AreaId = 'downtown' | 'eastside' | 'north-county' | 'south-county'

export type Tier = 'stable' | 'emerging' | 'high-risk'

export type EmploymentStability = 'High' | 'Medium' | 'Low'

export type TimeRange = '30d' | '90d' | '6m' | '1y'

export interface HouseholdYear {
  year: number
  income: number
  rent: number
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
  riskProbability: number
  history: HouseholdYear[]
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
  drivers: { label: string; delta: string }[]
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
}

export interface ImpactMetrics {
  householdsStabilized: number
  averageSubsidyPerHousehold: number
  vulnerabilityReduction: number
  costPerSuccessfulIntervention: number
  preventedFromHighRisk: number
  beforeAfter: { label: string; before: number; after: number }[]
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
