import { useState } from 'react'
import { Badge } from '@/shared/ui/Badge'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { MetricRow } from '@/affordai/components/MetricRow'
import { areaDetails } from '@/affordai/data/selectors'
import type { AreaId } from '@/affordai/data/types'

const toneFor = (rate: number) => (rate >= 18 ? 'crit' : rate >= 14 ? 'high' : 'mod')

export const GeoPanel = () => {
  const areas = areaDetails()
  const [selected, setSelected] = useState<AreaId>('eastside')
  const detail = areas.find((area) => area.id === selected)!
  const worst = Math.max(...areas.map((area) => area.vulnerabilityRate))

  return (
    <Card>
      <SectionHead
        title="Geographic view"
        note="Select an area to inspect · synthetic data"
      />
      <div className="grid grid-cols-[1.3fr_1fr] gap-5 max-lg:grid-cols-1">
        <div className="flex flex-col gap-2">
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              aria-pressed={area.id === selected}
              onClick={() => setSelected(area.id)}
              className={`rounded-lg border px-3.5 py-3 text-left transition-colors ${
                area.id === selected
                  ? 'border-blue bg-ink-2'
                  : 'border-line bg-ink-1 hover:border-line-soft hover:bg-ink-2/50'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{area.label}</span>
                <Badge tone={toneFor(area.vulnerabilityRate)}>
                  {area.vulnerabilityRate}% vulnerable
                </Badge>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-2">
                <div
                  className="h-full rounded-full bg-coral"
                  style={{ width: `${(area.vulnerabilityRate / worst) * 100}%` }}
                />
              </div>
              <div className="mt-2 font-mono text-[11px] text-text-low">
                {area.householdsMonitored.toLocaleString('en-US')} households monitored
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-line-soft bg-ink-2 p-4">
          <div className="mb-1 text-[15px] font-semibold">{detail.label}</div>
          <div className="mb-3 font-mono text-[11px] text-text-low">
            Area detail · estimated from available data
          </div>
          <MetricRow
            label="Households monitored"
            value={detail.householdsMonitored.toLocaleString('en-US')}
          />
          <MetricRow
            label="Vulnerability rate"
            value={`${detail.vulnerabilityRate}%`}
            tone="danger"
          />
          <MetricRow
            label="Average income"
            value={`$${detail.averageIncome.toLocaleString('en-US')}/mo`}
          />
          <MetricRow
            label="Average rent burden"
            value={`${(detail.averageRentBurden * 100).toFixed(1)}%`}
          />
          <MetricRow label="Average subsidy" value={`${detail.averageSubsidy}%`} />
          <MetricRow
            label="Trend"
            value={`${detail.trend > 0 ? '+' : ''}${detail.trend}%`}
            tone={detail.trend > 0 ? 'danger' : 'default'}
          />
          <Footnote>
            Trend is the three-year direction of median household income, inverted so a
            positive value means worsening affordability.
          </Footnote>
        </div>
      </div>
    </Card>
  )
}
