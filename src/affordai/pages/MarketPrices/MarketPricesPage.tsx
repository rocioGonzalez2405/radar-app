import { useMemo, useState } from 'react'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { ProvenanceBadge } from '@/affordai/components/ProvenanceBadge'
import { TierBadge } from '@/affordai/components/TierBadge'
import { HERO_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import {
  DEFAULT_QUERY,
  householdById,
  productsByCategory,
  searchHouseholds,
} from '@/affordai/data/selectors'
import type { ProductCategory } from '@/affordai/data/types'

const CATEGORIES: (ProductCategory | 'all')[] = [
  'all',
  'Dairy',
  'Protein',
  'Grains',
  'Produce',
]

const money = (value: number) => `$${value.toFixed(2)}`

export const MarketPricesPage = () => {
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')
  const [householdIdInput, setHouseholdIdInput] = useState(String(HERO_HOUSEHOLD_ID))

  // A short list of high-risk households to choose from, plus the hero household,
  // so the selector is useful without typing an id from memory.
  const options = useMemo(() => {
    const page = searchHouseholds({
      ...DEFAULT_QUERY,
      tier: 'high-risk',
      pageSize: 12,
    })
    const ids = [HERO_HOUSEHOLD_ID, ...page.rows.map((row) => row.id)]
    return [...new Set(ids)]
  }, [])

  const household = householdById(Number(householdIdInput))
  const products = productsByCategory(category)

  /**
   * Both subsidised columns are the selected household's OWN subsidy applied to
   * the unchanged market price — current for what it receives today, recommended
   * for what the model would give it.
   *
   * The products module also carries program-level `currentPrice` and
   * `recommendedPrice` at fixed 18% / 27% shares, and those are what renders when
   * no household is selected. They must not be mixed with a household's own
   * figures in the same row: a household on 0% today would otherwise be shown
   * paying a discounted "current price" it does not get.
   */
  const atSubsidy = (marketPrice: number, percent: number) =>
    marketPrice * (1 - percent / 100)

  const headerClass = 'py-2 font-mono text-[11px] tracking-wide text-text-low uppercase'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Market Prices</h1>
        <p className="mt-1 text-sm text-text-mid">
          What essential goods cost, and what a qualifying household pays once its
          subsidy is applied.
        </p>
      </div>

      <div className="rounded-lg border border-blue/40 bg-blue/10 p-3.5">
        <div className="mb-1 font-mono text-[11px] font-semibold tracking-wide text-blue uppercase">
          How this works
        </div>
        <p className="text-[13px] leading-relaxed text-text-mid">
          <b className="text-text-hi">Market price remains unchanged.</b> The platform
          does not set or negotiate retail prices. It determines the appropriate subsidy
          so qualifying households pay less for the same goods.
        </p>
      </div>

      <Card>
        <SectionHead title="Subsidy calculator" note="Select a household and a category" />
        <div className="mb-4 flex flex-wrap gap-2.5">
          <select
            aria-label="Household"
            value={householdIdInput}
            onChange={(event) => setHouseholdIdInput(event.target.value)}
            className="rounded-md border border-line bg-ink-2 px-2.5 py-1.5 text-[13px] text-text-hi"
          >
            {options.map((id) => (
              <option key={id} value={id}>
                Household #{id}
              </option>
            ))}
          </select>
          <select
            aria-label="Category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ProductCategory | 'all')
            }
            className="rounded-md border border-line bg-ink-2 px-2.5 py-1.5 text-[13px] text-text-hi"
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value === 'all' ? 'All categories' : value}
              </option>
            ))}
          </select>
        </div>

        {household && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-line-soft bg-ink-2 px-3.5 py-2.5">
            <TierBadge tier={household.tier} />
            <span className="font-mono text-[12px] text-text-mid">
              Current subsidy{' '}
              <span className="font-semibold text-text-hi">
                {household.currentSubsidy}%
              </span>{' '}
              · AI-recommended{' '}
              <span className="font-semibold text-teal">
                {household.recommendedSubsidy}%
              </span>
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className={headerClass}>Product</th>
                <th className={`${headerClass} text-right`}>Market price</th>
                <th className={headerClass}>Market price source</th>
                <th className={`${headerClass} text-right`}>Current price</th>
                <th className={`${headerClass} text-right`}>Recommended price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 text-[13px] text-text-mid">
                    <span className="text-text-hi">{product.label}</span>{' '}
                    <span className="font-mono text-[11px] text-text-mid">
                      {product.unit}
                    </span>
                    <span className="ml-2 font-mono text-[11px] text-text-low">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px] text-text-hi">
                    {money(product.marketPrice)}
                  </td>
                  <td className="py-2.5">
                    <ProvenanceBadge tier={product.tier} />
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px] text-amber">
                    {money(
                      household
                        ? atSubsidy(product.marketPrice, household.currentSubsidy)
                        : product.currentPrice,
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px] font-semibold text-teal">
                    {money(
                      household
                        ? atSubsidy(product.marketPrice, household.recommendedSubsidy)
                        : product.recommendedPrice,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Footnote>
          Every price on a row is measured against the quantity beside the product
          name — the reported series do not share one unit, so a price here means
          nothing without it. <b>Market price source</b> describes the market price
          only: <b>Reported</b> means a real, named BLS average-price series that this
          environment could not retrieve directly, never an independently verified
          figure. <b>Current price</b> and <b>Recommended price</b> are always{' '}
          <b>simulated</b> whatever the market price's tier, because both are a
          function of a hypothetical program's subsidy percentages — they apply the
          selected household's current and AI-recommended subsidy to the unchanged
          market price.
        </Footnote>
        <div className="mt-3">
          <Disclaimer />
        </div>
      </Card>
    </div>
  )
}
