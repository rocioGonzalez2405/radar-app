import { Kpi } from '@/shared/ui/Kpi'
import { Card, SectionHead, Legend, Footnote } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import {
  HorizontalBarChart,
  ThirtyDayLineChart,
} from '@/shared/charts/RadarCharts'
import {
  triageCases,
  riskFactorBreakdown,
  thirtyDayProjection,
  newCasesBySource,
} from '@/shared/data/radarData'

const SCOPE_PILLS = ['All women', 'With children', '18–24', 'DV survivors']

export const TriagePage = () => (
  <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          Downtown continuum of care
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">
          Who needs help first, today
        </h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          Case-level urgency scoring for the women and children served by
          downtown shelter and prevention programs — ranked by how little
          time is left, not by arrival order.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 font-mono text-xs">
        {SCOPE_PILLS.map((pill, i) => (
          <button
            key={pill}
            type="button"
            className={`rounded-full border px-3.5 py-1.5 ${
              i === 0
                ? 'border-coral bg-coral-dim text-[#ffbfa8]'
                : 'border-line text-text-mid'
            }`}
          >
            {pill}
          </button>
        ))}
      </div>
    </div>

    <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-5">
      <Kpi label="Women served, current" value="312" delta="↑ 6.4% vs last quarter" deltaTone="up" tone="neutral" />
      <Kpi label="Forecast, 12 months" value="+18%" delta="≈368 projected by 2027" tone="danger" />
      <Kpi label="DV shelter occupancy" value="96%" delta="3 months above 95%" deltaTone="up" tone="warn" />
      <Kpi label="Family-bed gap, 12-mo" value="−55" delta="fastest-growing shortfall" tone="danger" />
      <Kpi label="Critical risk cases, today" value="12" delta="8 beds open today" deltaTone="down" tone="ok" />
    </div>

    <div className="mb-7">
      <SectionHead
        title="Case triage — ranked by urgency, not arrival order"
        note="Survival model · re-scored every 6h"
      />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card tight>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line">
                {['#', 'Case', 'Primary factor', 'Days left', 'Score'].map((h) => (
                  <th
                    key={h}
                    className="px-2.5 py-2 text-left text-[10.5px] font-medium tracking-wide text-text-low uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {triageCases.map((c, i) => (
                <tr key={c.id} className="border-b border-line-soft last:border-b-0">
                  <td className="px-2.5 py-2.5 text-text-mid">{i + 1}</td>
                  <td className="px-2.5 py-2.5 font-medium text-text-hi">{c.id}</td>
                  <td className="px-2.5 py-2.5 text-text-mid">{c.factor}</td>
                  <td className="px-2.5 py-2.5 text-text-mid">{c.daysLeft}d</td>
                  <td className="px-2.5 py-2.5">
                    <Badge tone={c.level}>{c.score}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <Legend items={[{ label: 'Share of critical cases', color: '#ff6b4a' }]} />
          <div className="h-[200px]">
            <HorizontalBarChart
              data={riskFactorBreakdown}
              categoryKey="factor"
              bars={[{ dataKey: 'count', color: '#ff6b4a' }]}
            />
          </div>
          <Footnote>
            <b>Recommendation —</b> allocating today's 8 open beds to the top
            8 ranked cases cuts this week's street-homelessness risk by ~90%
            versus first-come, first-served intake.
          </Footnote>
        </Card>
      </div>
    </div>

    <div>
      <SectionHead
        title="Forward projection — next 30 days"
        note="Leading indicators: eviction filings · DV occupancy · utility shutoffs"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <Legend
            items={[
              { label: 'Projected critical cases', color: '#ff6b4a' },
              { label: 'Bed capacity', color: '#5b8def' },
            ]}
          />
          <div className="h-[230px]">
            <ThirtyDayLineChart data={thirtyDayProjection} />
          </div>
        </Card>
        <Card>
          <Legend items={[{ label: 'New critical cases by source', color: '#e8a53d' }]} />
          <div className="h-[230px]">
            <HorizontalBarChart
              data={newCasesBySource}
              categoryKey="source"
              bars={[{ dataKey: 'count', color: '#e8a53d' }]}
            />
          </div>
        </Card>
      </div>
    </div>

    <p className="mt-7 text-[11px] text-text-low">
      See the{' '}
      <a href="/sources" className="text-text-mid underline">
        Sources
      </a>{' '}
      page for which of these indicators are drawn from public official data
      versus modeled synthetically for this prototype.
    </p>
  </div>
)
