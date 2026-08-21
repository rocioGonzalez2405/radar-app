import { Card, Footnote, Legend, SectionHead } from '@/shared/ui/Card'
import { Kpi } from '@/shared/ui/Kpi'
import { AFFORD_CHART_COLORS, ForecastLineChart } from '@/affordai/charts/AffordCharts'
import { AiInsight } from '@/affordai/components/AiInsight'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { FactorBars } from '@/affordai/components/FactorBars'
import { forecast90d } from '@/affordai/data/selectors'

export const PredictionsPage = () => {
  const forecast = forecast90d()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Financial Vulnerability Forecast</h1>
        <p className="mt-1 text-sm text-text-mid">
          A 90-day projection of how many monitored households the model expects to be
          financially vulnerable, based on available data.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
        <Kpi
          label="Current vulnerable households"
          value={forecast.current.toLocaleString('en-US')}
          tone="warn"
        />
        <Kpi
          label="Projected in 90 days"
          value={forecast.projected.toLocaleString('en-US')}
          delta={`+${forecast.changePercent}%`}
          deltaTone="up"
          tone="danger"
        />
        <Kpi
          label="Prediction confidence"
          value={`${forecast.confidence}%`}
          tone="neutral"
        />
      </div>

      <Card>
        <SectionHead
          title="Historical and projected vulnerability"
          note="Solid: observed · Dashed: predicted"
        />
        <Legend
          items={[
            { label: 'Historical', color: AFFORD_CHART_COLORS.projected },
            { label: 'Projected', color: AFFORD_CHART_COLORS.highRisk },
          ]}
        />
        <div className="h-[340px]">
          <ForecastLineChart data={forecast.series} />
        </div>
        <div className="mt-4">
          <AiInsight>
            The model projects <b>{forecast.projected.toLocaleString('en-US')}</b>{' '}
            vulnerable households in 90 days, up <b>{forecast.changePercent}%</b> from{' '}
            {forecast.current.toLocaleString('en-US')} today, at{' '}
            <b>{forecast.confidence}%</b> confidence.
          </AiInsight>
        </div>
        <Footnote>
          The two lines share the <b>Now</b> point so the projection continues the
          observed series rather than starting a second one.
        </Footnote>
      </Card>

      <Card>
        <SectionHead
          title="Main predicted drivers"
          note="Estimated contribution to the projection"
        />
        <FactorBars factors={forecast.drivers} title="Predicted drivers" />
        <div className="mt-3">
          <Disclaimer />
        </div>
      </Card>
    </div>
  )
}
