import { Kpi } from '@/shared/ui/Kpi'
import { Card, SectionHead, Legend, Footnote } from '@/shared/ui/Card'
import { IndicatorAreaChart } from '@/shared/charts/RadarCharts'
import { countyTrend, downtownTrend, housingContext } from '@/shared/data/radarData'

export const ForecastPage = () => (
  <div>
    <div className="mb-6">
      <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
        Trend &amp; leading indicators
      </div>
      <h1 className="text-[26px] font-semibold tracking-tight">
        Where this is headed, and what's already signaling it
      </h1>
      <p className="mt-1 max-w-xl text-[13px] text-text-mid">
        Countywide and downtown counts over time, plus the structural housing
        pressure behind them.
      </p>
    </div>

    <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <Kpi
        label="Countywide PIT Count, 2026"
        value="9,803"
        delta="↓ 7% vs 2024"
        deltaTone="down"
        tone="ok"
      />
      <Kpi
        label="Downtown unsheltered count"
        value="756"
        delta="↓ 64% vs 2023 peak · Jun 2025"
        deltaTone="down"
        tone="ok"
      />
      <Kpi
        label="Average rent, San Diego County"
        value={`$${housingContext.averageRent.toLocaleString('en-US')}/mo`}
        delta={`↑ ${housingContext.rentIncrease5yr}% over 5 years`}
        deltaTone="up"
        tone="warn"
      />
      <Kpi
        label="ELI households severely rent-burdened"
        value={`${housingContext.eliSeverelyBurdenedPercent}%`}
        delta="paying 50%+ of income on housing"
        tone="warn"
      />
    </div>

    <div className="mb-7">
      <SectionHead
        title="Countywide Point-in-Time Count"
        note="Source: RTFH WeAllCount PIT Count"
      />
      <Card>
        <Legend items={[{ label: 'Total counted, countywide', color: '#5b8def' }]} />
        <div className="h-[260px]">
          <IndicatorAreaChart data={countyTrend} dataKey="total" xKey="year" color="#5b8def" />
        </div>
      </Card>
    </div>

    <div>
      <SectionHead
        title="Downtown unsheltered count"
        note="Source: Downtown San Diego Partnership, monthly count"
      />
      <Card>
        <Legend items={[{ label: 'Unsheltered count, downtown', color: '#2dd4a7' }]} />
        <div className="h-[260px]">
          <IndicatorAreaChart data={downtownTrend} dataKey="count" xKey="month" color="#2dd4a7" />
        </div>
      </Card>
      <Footnote>
        <b>What changed here —</b> the previous version of this page showed a
        synthetic DV-shelter-occupancy trend and a synthetic eviction-filings
        trend as "leading indicators." Neither has a public data source for
        San Diego at this granularity, so both were removed rather than kept
        as invented numbers. In their place, the KPIs above use verified
        structural housing context: average rent (
        {`$${housingContext.averageRent.toLocaleString('en-US')}/month`}
        ), its {housingContext.rentIncrease5yr}% rise over 5 years, and the{' '}
        {housingContext.eliSeverelyBurdenedPercent}% of extremely-low-income
        households paying more than half their income on housing — the real
        cost pressure behind the counts above ({housingContext.source}).
      </Footnote>
    </div>
  </div>
)
