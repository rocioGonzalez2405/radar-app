import { Kpi } from '@/shared/ui/Kpi'
import { kpis } from '@/affordai/data/selectors'

const percent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

export const OverviewPage = () => {
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
    </div>
  )
}
