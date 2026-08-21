import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { householdPath } from '@/app/routes'
import { Card, Footnote } from '@/shared/ui/Card'
import { TierBadge } from '@/affordai/components/TierBadge'
import { AREAS } from '@/affordai/data/areas'
import { DEFAULT_QUERY, searchHouseholds } from '@/affordai/data/selectors'
import type { HouseholdQuery } from '@/affordai/data/types'

const SORT_COLUMNS: { key: HouseholdQuery['sortBy']; label: string }[] = [
  { key: 'id', label: 'Household' },
  { key: 'monthlyIncome', label: 'Income' },
  { key: 'rentBurden', label: 'Rent burden' },
  { key: 'affordabilityScore', label: 'Affordability' },
]

const INCOME_BANDS: { value: HouseholdQuery['incomeBand']; label: string }[] = [
  { value: 'all', label: 'Any income' },
  { value: 'under-3000', label: 'Under $3,000' },
  { value: '3000-5000', label: '$3,000 – $5,000' },
  { value: '5000-7000', label: '$5,000 – $7,000' },
  { value: 'over-7000', label: 'Over $7,000' },
]

const selectClass =
  'rounded-md border border-line bg-ink-2 px-2.5 py-1.5 text-[13px] text-text-hi'

export const HouseholdsPage = () => {
  const [query, setQuery] = useState<HouseholdQuery>(DEFAULT_QUERY)
  const page = useMemo(() => searchHouseholds(query), [query])

  // Every filter change returns to page 1; only the pager sets a page directly.
  const patch = (changes: Partial<HouseholdQuery>) =>
    setQuery((current) => ({ ...current, page: 1, ...changes }))

  const toggleSort = (key: HouseholdQuery['sortBy']) =>
    patch({
      sortBy: key,
      sortDir: query.sortBy === key && query.sortDir === 'asc' ? 'desc' : 'asc',
    })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Households</h1>
        <p className="mt-1 text-sm text-text-mid">
          {page.total.toLocaleString('en-US')} of 12,482 monitored households match the
          current filters.
        </p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-2.5">
          <input
            type="search"
            value={query.search}
            onChange={(event) => patch({ search: event.target.value })}
            placeholder="Search by household id or area"
            className="min-w-[260px] flex-1 rounded-md border border-line bg-ink-2 px-3 py-1.5 text-[13px] text-text-hi placeholder:text-text-low"
          />
          <select
            value={query.area}
            onChange={(event) =>
              patch({ area: event.target.value as HouseholdQuery['area'] })
            }
            className={selectClass}
          >
            <option value="all">All areas</option>
            {AREAS.map((area) => (
              <option key={area.id} value={area.id}>
                {area.label}
              </option>
            ))}
          </select>
          <select
            value={query.tier}
            onChange={(event) =>
              patch({ tier: event.target.value as HouseholdQuery['tier'] })
            }
            className={selectClass}
          >
            <option value="all">All tiers</option>
            <option value="stable">Stable</option>
            <option value="emerging">Emerging</option>
            <option value="high-risk">High risk</option>
          </select>
          <select
            value={query.incomeBand}
            onChange={(event) =>
              patch({ incomeBand: event.target.value as HouseholdQuery['incomeBand'] })
            }
            className={selectClass}
          >
            {INCOME_BANDS.map((band) => (
              <option key={band.value} value={band.value}>
                {band.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {SORT_COLUMNS.map((column) => (
                  <th key={column.key} className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="font-mono text-[11px] tracking-wide text-text-low uppercase hover:text-text-hi"
                    >
                      {column.label}
                      {query.sortBy === column.key
                        ? query.sortDir === 'asc'
                          ? ' ↑'
                          : ' ↓'
                        : ''}
                    </button>
                  </th>
                ))}
                <th className="py-2 pr-4 font-mono text-[11px] tracking-wide text-text-low uppercase">
                  Area
                </th>
                <th className="py-2 pr-4 font-mono text-[11px] tracking-wide text-text-low uppercase">
                  Subsidy
                </th>
                <th className="py-2 font-mono text-[11px] tracking-wide text-text-low uppercase">
                  Tier
                </th>
              </tr>
            </thead>
            <tbody>
              {page.rows.map((household) => (
                <tr key={household.id} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 pr-4">
                    <Link
                      to={householdPath(household.id)}
                      className="font-mono text-[13px] font-semibold text-blue hover:text-text-hi"
                    >
                      #{household.id}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[13px]">
                    ${household.monthlyIncome.toLocaleString('en-US')}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[13px]">
                    {(household.rentBurden * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[13px]">
                    {household.affordabilityScore}
                  </td>
                  <td className="py-2.5 pr-4 text-[13px] text-text-mid">
                    {AREAS.find((area) => area.id === household.area)?.label}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-[13px]">
                    {household.currentSubsidy}% → {household.recommendedSubsidy}%
                  </td>
                  <td className="py-2.5">
                    <TierBadge tier={household.tier} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {page.total === 0 && (
          <p className="py-6 text-center text-[13px] text-text-low">
            No households match these filters.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-text-low">
            Page {page.page} of {page.pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page.page <= 1}
              onClick={() => setQuery((current) => ({ ...current, page: page.page - 1 }))}
              className="rounded-md border border-line px-3 py-1 text-[13px] text-text-mid disabled:opacity-40 enabled:hover:text-text-hi"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page.page >= page.pageCount}
              onClick={() => setQuery((current) => ({ ...current, page: page.page + 1 }))}
              className="rounded-md border border-line px-3 py-1 text-[13px] text-text-mid disabled:opacity-40 enabled:hover:text-text-hi"
            >
              Next
            </button>
          </div>
        </div>

        <Footnote>
          Affordability scores are <b>estimated</b> from available data. Subsidy columns
          read current → AI-recommended.
        </Footnote>
      </Card>
    </div>
  )
}
