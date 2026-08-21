import { useState } from 'react'
import { Kpi } from '@/shared/ui/Kpi'
import { Card, Legend, SectionHead } from '@/shared/ui/Card'
import { AFFORD_CHART_COLORS, VulnerabilityStackChart } from '@/affordai/charts/AffordCharts'
import { AiInsight } from '@/affordai/components/AiInsight'
import { GeoPanel } from '@/affordai/components/GeoPanel'
import { RangeToggle } from '@/affordai/components/RangeToggle'
import { kpis, vulnerabilitySeries } from '@/affordai/data/selectors'
import type { TimeRange } from '@/affordai/data/types'

const percent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

export const OverviewPage = () => {
  const [range, setRange] = useState<TimeRange>('90d')
  const series = vulnerabilitySeries(range)
  const summary = kpis()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-text-mid">
          Where financial vulnerability is increasing, who needs help, and what the
          model recommends doing about it.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-sm:grid-cols-1">
        <Kpi
          label="Households monitored"
          value={summary.householdsMonitored.toLocaleString('en-US')}
          delta={`${percent(summary.deltas.householdsMonitored)} vs. last month`}
          deltaTone="neutral"
          tone="neutral"
        />
        <Kpi
          label="Currently vulnerable"
          value={summary.currentlyVulnerable.toLocaleString('en-US')}
          delta={`${percent(summary.deltas.currentlyVulnerable)} vs. last month`}
          deltaTone="up"
          tone="warn"
        />
        <Kpi
          label="At high risk"
          value={summary.highRisk.toLocaleString('en-US')}
          delta={`${percent(summary.deltas.highRisk)} vs. last month`}
          deltaTone="up"
          tone="danger"
        />
        <Kpi
          label="Subsidies this month"
          value={`$${Math.round(summary.subsidiesAllocated / 1000)}K`}
          delta={`${percent(summary.deltas.subsidiesAllocated)} vs. last month`}
          deltaTone="neutral"
          tone="neutral"
        />
        <Kpi
          label="Intervention effectiveness"
          value={`${summary.interventionEffectiveness}%`}
          delta={`${percent(summary.deltas.interventionEffectiveness)} vs. last month`}
          deltaTone="down"
          tone="ok"
        />
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SectionHead
            title="Household vulnerability over time"
            note="AI-assessed tiers · synthetic data"
          />
          <RangeToggle value={range} onChange={setRange} />
        </div>
        <Legend
          items={[
            { label: 'Stable', color: AFFORD_CHART_COLORS.stable },
            { label: 'Emerging vulnerability', color: AFFORD_CHART_COLORS.emerging },
            { label: 'High risk', color: AFFORD_CHART_COLORS.highRisk },
          ]}
        />
        <div className="h-[320px]">
          <VulnerabilityStackChart data={series} />
        </div>
        <div className="mt-4">
          <AiInsight>
            Financial vulnerability has increased <b>11.8%</b> in the last 90 days,
            primarily driven by rising housing costs and declining household income.
          </AiInsight>
        </div>
      </Card>

      <GeoPanel />
    </div>
  )
}
