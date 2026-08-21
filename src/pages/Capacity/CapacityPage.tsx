import { Kpi } from '@/shared/ui/Kpi'
import { Card, SectionHead, Legend, Footnote } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { HorizontalBarChart } from '@/shared/charts/RadarCharts'
import { subgroupGaps } from '@/shared/data/radarData'

export const CapacityPage = () => (
  <div>
    <div className="mb-6">
      <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
        Resource allocation
      </div>
      <h1 className="text-[26px] font-semibold tracking-tight">
        Where the gap is growing fastest
      </h1>
      <p className="mt-1 max-w-xl text-[13px] text-text-mid">
        Projected demand versus current capacity, broken down by subgroup —
        so investment goes where the shortfall is worst, not where it's
        loudest.
      </p>
    </div>

    <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <Kpi label="Family-bed gap, 12-mo" value="−55" delta="largest shortfall" tone="danger" />
      <Kpi label="18–24 gap, 12-mo" value="−5" delta="stable, watch closely" tone="warn" />
      <Kpi label="Veterans gap, 12-mo" value="+2" delta="no shortfall" deltaTone="down" tone="ok" />
      <Kpi label="55+ gap, 12-mo" value="−5" delta="stable, watch closely" tone="warn" />
    </div>

    <div className="mb-7">
      <SectionHead
        title="Projected demand vs. current capacity, by subgroup"
        note="Source: HUD HMIS · PIT Count, disaggregated"
      />
      <Card>
        <Legend
          items={[
            { label: 'Projected demand', color: '#ff6b4a' },
            { label: 'Current capacity', color: '#5b8def' },
          ]}
        />
        <div className="h-[280px]">
          <HorizontalBarChart
            data={subgroupGaps}
            categoryKey="subgroup"
            bars={[
              { dataKey: 'demand', color: '#ff6b4a' },
              { dataKey: 'capacity', color: '#5b8def' },
            ]}
          />
        </div>
      </Card>
    </div>

    <div>
      <SectionHead title="Detail by subgroup" />
      <Card tight>
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-line">
              {['Subgroup', 'Projected demand', 'Current capacity', 'Gap', 'Status'].map((h) => (
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
            {subgroupGaps.map((row) => (
              <tr key={row.subgroup} className="border-b border-line-soft last:border-b-0">
                <td className="px-2.5 py-2.5 font-medium text-text-hi">{row.subgroup}</td>
                <td className="px-2.5 py-2.5 text-text-mid">{row.demand} beds</td>
                <td className="px-2.5 py-2.5 text-text-mid">{row.capacity} beds</td>
                <td className="px-2.5 py-2.5 text-text-mid">
                  {row.demand - row.capacity > 0 ? '+' : ''}
                  {row.demand - row.capacity}
                </td>
                <td className="px-2.5 py-2.5">
                  <Badge tone={row.status}>{row.statusLabel}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Footnote>
        <b>Reading it —</b> the subgroup with the largest negative gap is
        where the next dollar has the most impact. Here, family beds are
        both the largest gap and the fastest-growing — see the Simulator
        page to test how a fixed budget changes this number.
      </Footnote>
    </div>
  </div>
)
