/**
 * Synthetic data for the Radar prototype, modeled on plausible distributions
 * from public sources (HUD PIT Count/AHAR, Eviction Lab, ACS). See the
 * Sources page for which indicators are public vs. protected in a real
 * deployment. Swap this module for a real API client when wiring up to a
 * Continuum of Care's HMIS export.
 */

export interface TriageCase {
  id: string
  factor: string
  daysLeft: number
  score: number
  level: 'crit' | 'high' | 'mod'
}

export const triageCases: TriageCase[] = [
  { id: 'Case 4471', factor: 'Eviction hearing in 3 days', daysLeft: 3, score: 96, level: 'crit' },
  { id: 'Case 4502', factor: 'DV shelter exit in 2 days, no plan', daysLeft: 2, score: 94, level: 'crit' },
  { id: 'Case 4390', factor: 'Utility shutoff + 2 minor children', daysLeft: 5, score: 89, level: 'crit' },
  { id: 'Case 4518', factor: 'Eviction hearing in 6 days', daysLeft: 6, score: 85, level: 'high' },
  { id: 'Case 4460', factor: 'Hospital discharge in 4 days, no address', daysLeft: 4, score: 82, level: 'high' },
  { id: 'Case 4525', factor: 'DV shelter exit in 7 days', daysLeft: 7, score: 78, level: 'high' },
  { id: 'Case 4401', factor: 'Eviction, no support network', daysLeft: 8, score: 74, level: 'mod' },
  { id: 'Case 4533', factor: '78% rent burden, active pregnancy', daysLeft: 9, score: 70, level: 'mod' },
]

export const riskFactorBreakdown = [
  { factor: 'Legal eviction', count: 5 },
  { factor: 'DV shelter exit', count: 4 },
  { factor: 'Utility shutoff', count: 2 },
  { factor: 'Institutional', count: 1 },
]

export const thirtyDayProjection = [
  { day: 'Day 0', criticalCases: 12, bedCapacity: 8 },
  { day: 'Day 5', criticalCases: 15, bedCapacity: 8 },
  { day: 'Day 10', criticalCases: 18, bedCapacity: 8 },
  { day: 'Day 15', criticalCases: 22, bedCapacity: 8 },
  { day: 'Day 20', criticalCases: 25, bedCapacity: 8 },
  { day: 'Day 25', criticalCases: 28, bedCapacity: 8 },
  { day: 'Day 30', criticalCases: 31, bedCapacity: 8 },
]

export const newCasesBySource = [
  { source: 'Eviction hearings', count: 9 },
  { source: 'DV shelter exits', count: 6 },
  { source: 'Utility shutoffs', count: 3 },
  { source: 'Institutional', count: 1 },
]

export const yearlyTrend = [
  { year: '2022', historical: 240, projected: null as number | null },
  { year: '2023', historical: 260, projected: null },
  { year: '2024', historical: 278, projected: null },
  { year: '2025', historical: 295, projected: null },
  { year: '2026', historical: 312, projected: 312 },
  { year: '2027 (proj.)', historical: null, projected: 368 },
]

export const dvOccupancyTrend = [
  { month: '-8mo', occupancy: 74 },
  { month: '-7mo', occupancy: 78 },
  { month: '-6mo', occupancy: 82 },
  { month: '-5mo', occupancy: 88 },
  { month: '-4mo', occupancy: 93 },
  { month: '-3mo', occupancy: 96 },
  { month: '-2mo', occupancy: 97 },
  { month: '-1mo', occupancy: 96 },
  { month: 'Now', occupancy: 96 },
]

export const evictionFilingsTrend = [
  { month: '-8mo', filings: 40 },
  { month: '-7mo', filings: 42 },
  { month: '-6mo', filings: 45 },
  { month: '-5mo', filings: 47 },
  { month: '-4mo', filings: 50 },
  { month: '-3mo', filings: 53 },
  { month: '-2mo', filings: 55 },
  { month: '-1mo', filings: 57 },
  { month: 'Now', filings: 59 },
]

export interface SubgroupGap {
  subgroup: string
  demand: number
  capacity: number
  status: 'crit' | 'high' | 'mod'
  statusLabel: string
}

export const subgroupGaps: SubgroupGap[] = [
  { subgroup: 'With children', demand: 145, capacity: 90, status: 'crit', statusLabel: 'Critical' },
  { subgroup: '18–24', demand: 60, capacity: 55, status: 'high', statusLabel: 'Watch' },
  { subgroup: 'Veterans', demand: 20, capacity: 22, status: 'mod', statusLabel: 'Stable' },
  { subgroup: '55+', demand: 35, capacity: 30, status: 'high', statusLabel: 'Watch' },
]

export const simulatorScenarios = [
  { name: 'A — All beds', beds: 15, childcarePct: 0, gap: -23, relapseReduction: 0, bestFor: 'Resolving the immediate crisis fastest' },
  { name: 'B — All childcare', beds: 0, childcarePct: 100, gap: -55, relapseReduction: 30, bestFor: 'Preventing repeat homelessness, longer-term' },
  { name: 'C — Balanced', beds: 7, childcarePct: 50, gap: -40, relapseReduction: 15, bestFor: 'Splitting impact across both goals' },
]

export interface SourceEntry {
  name: string
  description: string
  status: 'public' | 'public-aggregate' | 'protected'
}

export const publicSources: SourceEntry[] = [
  { name: 'HUD Point-in-Time Count & AHAR', description: 'Annual sheltered/unsheltered homelessness counts, reported to Congress.', status: 'public' },
  { name: 'HUD HMIS — Universal Data Elements', description: 'Elements 4.11 (Domestic Violence) and 4.12 (Living Situation), aggregated across a Continuum of Care.', status: 'public-aggregate' },
  { name: 'Eviction Lab, Princeton University', description: 'Court eviction filing records by county/city.', status: 'public' },
  { name: 'U.S. Census Bureau / ACS', description: 'Rent burden, household income, female-headed households.', status: 'public' },
  { name: 'Bureau of Labor Statistics', description: 'Local female unemployment rate.', status: 'public' },
  { name: 'National Domestic Violence Hotline', description: 'Aggregate crisis call volume reports.', status: 'public-aggregate' },
]

export const protectedSources: SourceEntry[] = [
  { name: 'DV shelter occupancy, case-level', description: 'Lives in the VSP Comparable Database — kept separate from general HMIS for survivor safety.', status: 'protected' },
  { name: 'Individual eviction/exit dates for triage scoring', description: 'Requires a data-sharing agreement with the local Continuum of Care\u2019s HMIS.', status: 'protected' },
  { name: 'Hospital discharge without a housing plan', description: 'Protected under HIPAA — needs a direct partnership with local health systems.', status: 'protected' },
]

export interface DonationCampaign {
  name: string
  raised: number
  goal: number
  donorCount: number
  daysLeft: number
}

// Synthetic fundraising data for the Donate page prototype.
export const donationCampaign: DonationCampaign = {
  name: 'Keep Downtown Families Off the Street',
  raised: 48250,
  goal: 75000,
  donorCount: 412,
  daysLeft: 22,
}

export const suggestedDonationAmounts = [25, 50, 100, 250]

export interface Donor {
  name: string
  amount: number
  timeAgo: string
}

// Synthetic recent-donor feed, styled like a crowdfunding activity list.
export const recentDonors: Donor[] = [
  { name: 'M. Alvarez', amount: 100, timeAgo: '2 min ago' },
  { name: 'J. K.', amount: 25, timeAgo: '14 min ago' },
  { name: 'Anonymous', amount: 250, timeAgo: '38 min ago' },
  { name: 'D. Nguyen', amount: 50, timeAgo: '1 hr ago' },
  { name: 'S. Reyes', amount: 500, timeAgo: '3 hr ago' },
  { name: 'Anonymous', amount: 25, timeAgo: '5 hr ago' },
]
