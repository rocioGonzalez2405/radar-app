/**
 * Verified public data about homelessness in San Diego, sourced from RTFH
 * (Regional Task Force on Homelessness), the Downtown San Diego Partnership,
 * California Housing Partnership, California EDD, accountability.ca.gov, and
 * the California State Auditor. See the Sources page for per-source dates
 * and public/protected status. Case-level triage rows remain illustrative
 * (simulated) because individual HMIS records are protected — see
 * triageMethodologyNote for the real study backing that model.
 */

// Countywide PIT Count trend (RTFH WeAllCount Point-in-Time Count)
export const countyTrend = [
  { year: '2024', total: 10605 },
  { year: '2025', total: 9905 },
  { year: '2026', total: 9803 },
]
// Source: RTFH, "2025 Point-in-Time Count Shows 7% Drop"; NBC San Diego / County News Center, May 2026

// Downtown monthly unsheltered count (Downtown San Diego Partnership)
export const downtownTrend = [
  { month: 'Nov 2022', count: 1706 },
  { month: 'Dec 2022', count: 1839 },
  { month: 'May 2023', count: 2104 },
  { month: 'Aug 2023', count: 1207 },
  { month: 'Jun 2025', count: 756 },
]
// Source: FOX5 San Diego; Inside San Diego, July 2025; California State Auditor Report 2023-102.2
// Coverage: East Village, Gaslamp Quarter, City Center, Columbia, Marina, Cortez Hill

// Subgroup % change 2024→2025 (RTFH PIT Count)
export interface SubgroupChange {
  subgroup: string
  changePercent: number
  source: string
}

export const subgroupChanges: SubgroupChange[] = [
  { subgroup: 'Families', changePercent: -72, source: 'RTFH PIT Count 2025: unsheltered families down 72% vs 2024.' },
  { subgroup: 'Veterans', changePercent: -25, source: 'RTFH PIT Count 2025: unsheltered veterans down 25% vs 2024.' },
  { subgroup: 'Youth (18-24)', changePercent: -22, source: 'RTFH PIT Count 2025: transitional-age youth down 22% vs 2024.' },
  { subgroup: 'Age 55+', changePercent: 4, source: 'RTFH: 55+ now 33% of unsheltered population, up from 29% — the one group rising. Flagged by RTFH as a warning sign.' },
]

// Real, dated capacity events (not a continuous "gap" metric — none exists publicly)
export interface CapacityEvent {
  label: string
  description: string
  source: string
}

export const capacityEvents: CapacityEvent[] = [
  { label: '+160 beds', description: "Rachel's Promise Center, women/families, winter 2025-26", source: 'Inside San Diego, July 2025' },
  { label: '+190 spaces', description: 'Safe Parking H Barracks site, May 2025', source: 'City of San Diego official announcement, May 2025' },
  { label: '360+ beds', description: 'City-funded, last 2 years, across women, families, youth, seniors, veterans', source: 'Inside San Diego, "Street Homelessness Down Two Years in a Row", 2026' },
]

// Structural housing context (used in place of eviction-filing/DV-occupancy trend lines, which have no public source)
export const housingContext = {
  averageRent: 2606, // USD/month, San Diego County
  rentIncrease5yr: 22, // percent, 2020-2025
  eliSeverelyBurdenedPercent: 79, // % of extremely-low-income households paying 50%+ of income on housing
  source: 'California Housing Partnership, 2026 Affordable Housing Needs Report',
}

// Unemployment (general rate only — no gender/subgroup breakdown exists publicly at county level)
export const unemploymentRate = {
  county: 3.9, // percent, May 2026
  state: 4.7,
  national: 4.1,
  source: 'California EDD, June 2026',
}

// Real regional investment outcomes (replaces the removed what-if simulator, which had no data to calibrate)
export const investmentOutcomes = {
  hhapFunding: 220600000, // USD, HHAP rounds 1-5, San Diego area, 2019-2025
  peopleConnectedToServices: 24065, // Jan 2023 - Jun 2025
  peopleHoused: 5684,
  unknownExitDestinationShare: '~1 in 3', // honest data-quality caveat
  source: 'accountability.ca.gov; California State Auditor Report 2023-102.1',
}

// Triage methodology grounding (real study backing the simulated model — case-level scores remain simulated because HMIS individual data is protected)
export const triageMethodologyNote = {
  studySource: '211 San Diego, "Housing Instability in San Diego County" Policy Brief, September 2019',
  finding: 'Only ~25% of people flagged as "unstably housed" via 211 calls actually became homeless within 4 months.',
  riskFactors: ['Unemployment', 'Education below high school/GED', 'Race (Black/African American households overrepresented)'],
  protectiveFactors: ['Hispanic/Latino ethnicity', 'Employment'],
}

// Public vs protected sources, with date coverage, for the Sources page
export interface SourceEntry {
  name: string
  status: 'public' | 'protected'
  dataAsOf: string // the period the actual data covers
  lastVerified: string // when this source was confirmed for this project
  note?: string
}

export const dataSources: SourceEntry[] = [
  { name: 'RTFH WeAllCount Point-in-Time Count', status: 'public', dataAsOf: 'January 2026', lastVerified: 'August 2026' },
  { name: 'RTFH Monthly Data & Performance Reports', status: 'public', dataAsOf: 'Rolling 12-month average, as of mid-2026', lastVerified: 'August 2026' },
  { name: 'RTFH Project-Level HMIS Dashboard (aggregate)', status: 'public', dataAsOf: 'October 2021 – December 2024', lastVerified: 'August 2026' },
  { name: 'Downtown San Diego Partnership, monthly count', status: 'public', dataAsOf: 'June 2025 (most recent figure found)', lastVerified: 'August 2026' },
  { name: 'San Diego County Homelessness Dashboard', status: 'public', dataAsOf: 'Launched February 2026, updates monthly', lastVerified: 'August 2026' },
  { name: '211 San Diego, Data Reports & Policy Briefs', status: 'public', dataAsOf: 'September 2019 study', lastVerified: 'August 2026' },
  { name: 'California Housing Partnership, 2026 Affordable Housing Needs Report', status: 'public', dataAsOf: 'May 2026', lastVerified: 'August 2026' },
  { name: 'U.S. Census Bureau, ACS 5-year estimates', status: 'public', dataAsOf: '2020–2024', lastVerified: 'August 2026' },
  { name: 'California EDD, Local Area Unemployment Statistics', status: 'public', dataAsOf: 'May 2026', lastVerified: 'August 2026' },
  { name: 'California State Auditor, Report 2023-102.1 / 2023-102.2', status: 'public', dataAsOf: 'April 2024 (report publication)', lastVerified: 'August 2026' },
  { name: 'accountability.ca.gov (HHAP / ERF funding data)', status: 'public', dataAsOf: 'Data through June 2025, page updated February 2026', lastVerified: 'August 2026' },
  { name: 'HMIS — individual case-level records', status: 'protected', dataAsOf: 'N/A', lastVerified: 'August 2026', note: 'No public aggregate; requires CoC data-sharing agreement' },
  { name: 'DV shelter occupancy', status: 'protected', dataAsOf: 'N/A', lastVerified: 'August 2026', note: 'Protected under survivor privacy protocols, no public aggregate exists' },
]

// Illustrative, simulated triage case rows — grounded in the real 211 San
// Diego risk-factor study above, but the individual cases, scores, and day
// counts are NOT real records (see TriagePage and triageMethodologyNote).
export interface TriageCase {
  id: string
  factor: string
  daysLeft: number
  score: number
  level: 'crit' | 'high' | 'mod'
}

export const triageCases: TriageCase[] = [
  { id: 'Case 4471', factor: 'Unemployed, eviction hearing in 3 days', daysLeft: 3, score: 96, level: 'crit' },
  { id: 'Case 4502', factor: 'Shelter exit in 2 days, no plan', daysLeft: 2, score: 94, level: 'crit' },
  { id: 'Case 4390', factor: 'Utility shutoff + 2 minor children', daysLeft: 5, score: 89, level: 'crit' },
  { id: 'Case 4518', factor: 'Eviction hearing in 6 days', daysLeft: 6, score: 85, level: 'high' },
  { id: 'Case 4460', factor: 'Hospital discharge in 4 days, no address', daysLeft: 4, score: 82, level: 'high' },
  { id: 'Case 4525', factor: 'Shelter exit in 7 days', daysLeft: 7, score: 78, level: 'high' },
  { id: 'Case 4401', factor: 'Eviction, no support network', daysLeft: 8, score: 74, level: 'mod' },
  { id: 'Case 4533', factor: '78% rent burden, unemployed', daysLeft: 9, score: 70, level: 'mod' },
]
