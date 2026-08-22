import { Link } from 'react-router'
import { householdPath } from '@/app/routes'
import { Card, Footnote, Legend, SectionHead } from '@/shared/ui/Card'
import { Kpi } from '@/shared/ui/Kpi'
import { AFFORD_CHART_COLORS, ForecastLineChart } from '@/affordai/charts/AffordCharts'
import { AiInsight } from '@/affordai/components/AiInsight'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { FactorBars } from '@/affordai/components/FactorBars'
import { TierBadge } from '@/affordai/components/TierBadge'
import { DETERIORATING_HOUSEHOLD_ID } from '@/affordai/data/heroes'
import { forecast90d, householdById } from '@/affordai/data/selectors'
import type { Tier } from '@/affordai/data/types'

/**
 * The case that justifies the whole product, and it belongs above the population
 * forecast rather than below it: an aggregate curve is easy to nod at, and a
 * single household the descriptive index calls fine is what makes the curve mean
 * something.
 *
 * Every figure is read from the household record. None of them is written into
 * this copy, and the sentence has to hold whatever the model currently says —
 * the argument is "the descriptive index calls this household stable and the
 * model does not", which does not depend on the exact probability.
 */
const TIER_PROSE: Record<Tier, string> = {
  stable: 'stable',
  emerging: 'emerging vulnerability',
  'high-risk': 'high risk',
}

const DeterioratingCallout = () => {
  const household = householdById(DETERIORATING_HOUSEHOLD_ID)
  if (!household) return null

  const probability = Math.round(household.riskProbability * 100)

  return (
    <div className="rounded-lg border border-coral/40 bg-coral/10 p-3.5">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <div className="font-mono text-[11px] font-semibold tracking-wide text-coral uppercase">
          The household a threshold cannot find
        </div>
        <TierBadge tier={household.tier} />
      </div>
      <p className="text-[13px] leading-relaxed text-text-mid">
        <Link
          to={householdPath(household.id)}
          className="font-semibold text-blue hover:text-text-hi"
        >
          Household #{household.id}
        </Link>{' '}
        scores <b className="text-text-hi">{household.affordabilityScore}</b> on the
        descriptive affordability index, and every threshold in this console reads that
        as unremarkable — the tier that falls out of it is{' '}
        <b className="text-text-hi">{TIER_PROSE[household.tier]}</b>. The model does not
        agree. It puts the probability of this household entering
        vulnerability at <b className="text-coral">{probability}%</b> and the policy
        answers with a recommendation of{' '}
        <b className="text-teal">{household.recommendedSubsidy}%</b>, against{' '}
        {household.currentSubsidy}% today.
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-text-mid">
        The disagreement is the point, and it is not a defect in either number. The
        score describes where the household stands this month; the model reads the
        slope of the two years behind it — income falling, rent climbing, essential
        spending climbing, the monthly balance thinning toward zero. A cut-off on a
        descriptive score cannot produce this household, at any threshold, because
        today it still balances. A rules-only program finds it after the crisis.
      </p>
      <div className="mt-2.5">
        <Link
          to={householdPath(household.id)}
          className="font-mono text-[12px] text-blue hover:text-text-hi"
        >
          Open household #{household.id} →
        </Link>
      </div>
    </div>
  )
}

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

      <DeterioratingCallout />

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
