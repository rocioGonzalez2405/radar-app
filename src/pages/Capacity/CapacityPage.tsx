import { useState } from 'react'
import { Kpi } from '@/shared/ui/Kpi'
import { Card, SectionHead, Legend, Footnote } from '@/shared/ui/Card'
import { SubgroupChangeBarChart } from '@/shared/charts/RadarCharts'
import { subgroupChanges, capacityEvents, type SubgroupChange } from '@/shared/data/radarData'

const formatChange = (value: number) => `${value > 0 ? '+' : ''}${value}%`

export const CapacityPage = () => {
  const [selected, setSelected] = useState<SubgroupChange>(subgroupChanges[0])

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          Resource allocation
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">
          Which subgroups are trending up, and which are trending down
        </h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          Year-over-year change by subgroup, from the RTFH Point-in-Time
          Count, plus real, dated capacity investments — not a modeled
          demand-vs-capacity gap, which has no public data source.
        </p>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {subgroupChanges.map((row) => (
          <Kpi
            key={row.subgroup}
            label={row.subgroup}
            value={formatChange(row.changePercent)}
            delta={row.changePercent < 0 ? 'down vs 2024' : 'up vs 2024 — watch'}
            deltaTone={row.changePercent < 0 ? 'down' : 'up'}
            tone={row.changePercent < 0 ? 'ok' : 'warn'}
          />
        ))}
      </div>

      <div className="mb-7">
        <SectionHead
          title="% change vs. 2024, by subgroup"
          note="Source: RTFH PIT Count 2025"
        />
        <Card>
          <Legend
            items={[
              { label: 'Decreased', color: '#2dd4a7' },
              { label: 'Increased', color: '#ff6b4a' },
            ]}
          />
          <div className="h-[240px]">
            <SubgroupChangeBarChart data={subgroupChanges} onSelect={setSelected} />
          </div>
          <p className="mt-3 text-[12px] text-text-mid">
            <b className="text-text-hi">{selected.subgroup}: </b>
            {selected.source}
          </p>
        </Card>
        <Footnote>
          <b>Reading it —</b> every subgroup fell year-over-year except
          people age 55+, which rose and now makes up a growing share of the
          unsheltered population. RTFH flags this as the one warning sign in
          an otherwise improving count.
        </Footnote>
      </div>

      <div>
        <SectionHead title="Recent capacity investments" />
        <Card tight>
          {capacityEvents.map((event) => (
            <div
              key={event.label}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft px-2.5 py-3 text-[12.5px] last:border-b-0"
            >
              <div>
                <span className="mr-2.5 font-mono font-semibold text-teal">{event.label}</span>
                <span className="text-text-mid">{event.description}</span>
              </div>
              <span className="font-mono text-[10.5px] text-text-low whitespace-nowrap">
                {event.source}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
