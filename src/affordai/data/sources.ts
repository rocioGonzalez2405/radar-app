import type { AffordSource } from '@/affordai/data/types'

/**
 * Where every figure in `src/affordai/data/` comes from, in the same shape
 * Radar's `SourceEntry` uses (`src/shared/data/radarData.ts`) so the two
 * products' Sources pages read as one system. The extra field is `tier`:
 *
 * - `verified`  — read first-hand from the named public document.
 * - `reported`  — the source is real and named, but this environment could not
 *                 retrieve it (BLS and FRED answer HTTP 403 to automated
 *                 requests), so the figure came from a search-result summary.
 * - `simulated` — no public source exists, because the underlying records are
 *                 protected or the program is hypothetical.
 *
 * A `reported` or `simulated` figure is never presented as `verified`. Radar's
 * top bar carries a "Data verified through August 2026" badge above this
 * section, and that badge is only honest if this table is exact.
 */
export const AFFORD_SOURCES: AffordSource[] = [
  // Verified — the macro housing figures, read first-hand from the report PDF.
  {
    name: 'California Housing Partnership, "San Diego County 2026 Affordable Housing Needs Report"',
    status: 'public',
    dataAsOf: 'May 2026 (report), 2024 (underlying data)',
    lastVerified: 'August 2026',
    tier: 'verified',
    note: 'Average asking rent, hourly wage needed, renters without an affordable home, interim beds, housing funding, and the five-band cost-burden table.',
  },
  {
    name: 'California EDD, Local Area Unemployment Statistics',
    status: 'public',
    dataAsOf: 'May 2026',
    lastVerified: 'August 2026',
    tier: 'verified',
    note: 'County 3.9%, state 4.7%, national 4.1%. Already cited in Radar.',
  },
  {
    name: 'U.S. Census Bureau, ACS 5-year estimates',
    status: 'public',
    dataAsOf: '2020–2024',
    lastVerified: 'August 2026',
    tier: 'verified',
    note: 'County-level income context. No subregional rent or income breakdown at the granularity this console displays.',
  },

  // Reported — real BLS releases this environment cannot reach.
  {
    name: 'BLS, Consumer Price Index, San Diego Area',
    status: 'public',
    dataAsOf: '12 months ending March 2026',
    lastVerified: 'August 2026',
    tier: 'reported',
    note: 'All items +3.2%, food at home +1.1% over the two months ending March 2026. Not independently retrieved: BLS returns HTTP 403 to automated requests from this environment, so these came from search-result summaries rather than the release itself.',
  },
  {
    name: 'BLS average price series APU0000709112 (milk, fresh whole, per gallon, U.S. city average)',
    status: 'public',
    dataAsOf: 'June 2026',
    lastVerified: 'August 2026',
    tier: 'reported',
    note: '$4.32 per gallon. Not independently retrieved — BLS returns HTTP 403 to automated requests from this environment.',
  },
  {
    name: 'BLS average price series APU0000708111 (eggs, Grade A large, per dozen, U.S. city average)',
    status: 'public',
    dataAsOf: 'June 2026',
    lastVerified: 'August 2026',
    tier: 'reported',
    note: '$2.14 per dozen. Not independently retrieved — BLS returns HTTP 403 to automated requests from this environment.',
  },
  {
    name: 'BLS average price series APU0400701312 (rice, white long-grain uncooked, per pound, West region)',
    status: 'public',
    dataAsOf: 'April 2025',
    lastVerified: 'August 2026',
    tier: 'reported',
    note: '$0.879 per pound. Not independently retrieved — BLS returns HTTP 403 to automated requests from this environment.',
  },

  // Protected — the record types that would be needed to make the caseload
  // real. Neither has a public aggregate, which is why the population below
  // them is simulated rather than sampled. The last entry is `unpublished`
  // rather than `protected`: nobody is withholding subregional rent for
  // privacy, it simply is not broken out at that granularity.
  {
    name: 'Household income and rent records — individual level',
    status: 'protected',
    dataAsOf: 'N/A',
    lastVerified: 'August 2026',
    tier: 'simulated',
    note: 'No public aggregate at household level. The 12,482-household population, every per-household field, and household #10482 are simulated.',
  },
  {
    name: 'Subsidy program caseload roster',
    status: 'protected',
    dataAsOf: 'N/A',
    lastVerified: 'August 2026',
    tier: 'simulated',
    note: 'No public roster exists. Tier counts, allocation, intervention effectiveness, the 90-day forecast, and every impact figure describe a hypothetical program and are simulated.',
  },
  {
    name: 'Subregional (neighbourhood) rent and income',
    status: 'unpublished',
    dataAsOf: 'N/A',
    lastVerified: 'August 2026',
    tier: 'simulated',
    note: 'Not separately published in any source reachable here. Area-to-area variation is derived from the verified county average asking rent but the per-area spread is modeled, not measured — see areas.ts.',
  },
]

/**
 * Shown in the AffordAI sidebar on every page. Worded so it cannot be read as
 * a verification claim over the household population: Radar's "Data verified
 * through August 2026" badge is visible at the same time, and the two lines
 * have to be true when read together.
 */
export const PROVENANCE_SUMMARY =
  'Macro indicators from verified public sources · household population simulated'
