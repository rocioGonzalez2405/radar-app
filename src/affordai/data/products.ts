import type { Product } from '@/affordai/data/types'

/**
 * Market price is never altered by the platform. `currentPrice` and
 * `recommendedPrice` are what a qualifying household pays once its subsidy is
 * applied. The Market Prices page states this explicitly.
 *
 * PROVENANCE — the two columns carry different tiers, and the split matters:
 *
 * - `marketPrice` for milk, eggs, and rice is `reported`: it is a real BLS
 *   average price series, but BLS answers HTTP 403 to automated requests from
 *   this environment, so the figure came from a search-result summary rather
 *   than the release itself. Every other row keeps an illustrative price and is
 *   `simulated` — no source was consulted for it.
 * - `currentPrice` and `recommendedPrice` are ALWAYS `simulated`, whatever the
 *   market price's tier, because they are a function of the hypothetical
 *   program's subsidy percentages. A verified market price does not make the
 *   subsidised price verified.
 *
 * BLS units, for the Market Prices page: milk is per gallon (U.S. city
 * average), eggs per dozen (U.S. city average), rice per pound (West region).
 * The simulated rows carry no unit because no quantity was ever defined for
 * them.
 */

/**
 * The hypothetical program's subsidy levels, matching the Eastside
 * recommendation and household #10482's authored 18% → 27%.
 */
const CURRENT_SUBSIDY_SHARE = 0.18
const RECOMMENDED_SUBSIDY_SHARE = 0.27

const subsidised = (marketPrice: number, share: number) =>
  Number((marketPrice * (1 - share)).toFixed(2))

type MarketRow = Pick<Product, 'id' | 'label' | 'category' | 'marketPrice' | 'tier'>

const priced = (row: MarketRow): Product => ({
  ...row,
  currentPrice: subsidised(row.marketPrice, CURRENT_SUBSIDY_SHARE),
  recommendedPrice: subsidised(row.marketPrice, RECOMMENDED_SUBSIDY_SHARE),
})

const MARKET_ROWS: MarketRow[] = [
  // Source: BLS average price series APU0000709112, June 2026. Not
  // independently retrieved — see sources.ts.
  { id: 'milk', label: 'Milk', category: 'Dairy', marketPrice: 4.32, tier: 'reported' },
  // Source: BLS average price series APU0000708111, June 2026. Not
  // independently retrieved.
  { id: 'eggs', label: 'Eggs', category: 'Protein', marketPrice: 2.14, tier: 'reported' },
  // Source: BLS average price series APU0400701312, West region, April 2025.
  // Not independently retrieved.
  { id: 'rice', label: 'Rice', category: 'Grains', marketPrice: 0.879, tier: 'reported' },
  // No source consulted for the rows below: illustrative prices from the brief.
  { id: 'cheese', label: 'Cheese', category: 'Dairy', marketPrice: 7.4, tier: 'simulated' },
  { id: 'chicken', label: 'Chicken', category: 'Protein', marketPrice: 11.8, tier: 'simulated' },
  { id: 'beans', label: 'Beans', category: 'Grains', marketPrice: 5.6, tier: 'simulated' },
  { id: 'potatoes', label: 'Potatoes', category: 'Produce', marketPrice: 4.9, tier: 'simulated' },
  { id: 'apples', label: 'Apples', category: 'Produce', marketPrice: 6.7, tier: 'simulated' },
]

export const PRODUCTS: Product[] = MARKET_ROWS.map(priced)

/**
 * Price movement signals used by the area recommendations. Real BLS releases,
 * but not independently retrieved from this environment — tiered `reported`.
 */
// Source: BLS, Consumer Price Index, San Diego Area.
export const BLS_PRICE_SIGNALS = {
  allItems12Month: 3.2, // percent, 12 months ending March 2026
  foodAtHome2Month: 1.1, // percent, two months ending March 2026
  source: 'BLS, Consumer Price Index, San Diego Area',
  dataAsOf: 'March 2026',
  lastVerified: 'August 2026',
  tier: 'reported',
} as const
