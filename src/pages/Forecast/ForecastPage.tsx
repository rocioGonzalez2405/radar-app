import { Kpi } from '@/shared/ui/Kpi'
import { Card, SectionHead, Legend, Footnote } from '@/shared/ui/Card'
import { TrendForecastChart, IndicatorAreaChart } from '@/shared/charts/RadarCharts'
import {
  yearlyTrend,
  dvOccupancyTrend,
  evictionFilingsTrend,
} from '@/shared/data/radarData'

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
        Historical count, 12-month projection, and the upstream signals that
        move before the headline number does.
      </p>
    </div>

    <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <Kpi label="Women served, current" value="312" delta="↑ 6.4% vs last quarter" deltaTone="up" tone="neutral" />
      <Kpi label="Forecast, 12 months" value="+18%" delta="≈368 projected by 2027" tone="danger" />
      <Kpi label="DV shelter occupancy" value="96%" delta="3 months above 95% — leading signal" deltaTone="up" tone="warn" />
      <Kpi label="Eviction filings, women w/ children" value="+18%" delta="year over year" deltaTone="up" tone="warn" />
    </div>

    <div className="mb-7">
      <SectionHead
        title="Historical trend &amp; 12-month projection"
        note="Source: HUD PIT Count / AHAR"
      />
      <Card>
        <Legend
          items={[
            { label: 'Historical', color: '#5b8def' },
            { label: 'Projected', color: '#ff6b4a' },
          ]}
        />
        <div className="h-[300px]">
          <TrendForecastChart data={yearlyTrend} />
        </div>
      </Card>
    </div>

    <div>
      <SectionHead
        title="Leading indicators"
        note="Move 3–6 months before the headline count"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <Legend items={[{ label: 'DV shelter occupancy, % monthly', color: '#e8a53d' }]} />
          <div className="h-[220px]">
            <IndicatorAreaChart data={dvOccupancyTrend} dataKey="occupancy" color="#e8a53d" />
          </div>
        </Card>
        <Card>
          <Legend items={[{ label: 'Eviction filings, households w/ children, monthly', color: '#ff6b4a' }]} />
          <div className="h-[220px]">
            <IndicatorAreaChart data={evictionFilingsTrend} dataKey="filings" color="#ff6b4a" />
          </div>
        </Card>
      </div>
      <Footnote>
        <b>Reading it —</b> when DV shelter occupancy stays above 95% for
        several months and eviction filings for families keep climbing, both
        have historically preceded a rise in the women's homelessness count
        3–6 months later. That gives organizations a window to act before
        the headline number moves.
      </Footnote>
    </div>
  </div>
)
