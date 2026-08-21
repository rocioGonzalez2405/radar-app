import { Link, useParams } from 'react-router'
import { ROUTES } from '@/app/routes'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { ScoreTimelineChart } from '@/affordai/charts/AffordCharts'
import { MetricRow } from '@/affordai/components/MetricRow'
import { RiskAssessmentCard } from '@/affordai/components/RiskAssessmentCard'
import { TierBadge } from '@/affordai/components/TierBadge'
import { areaById } from '@/affordai/data/areas'
import { householdById } from '@/affordai/data/selectors'

export const HouseholdDetailPage = () => {
  const { householdId } = useParams()
  const household = householdById(Number(householdId))

  if (!household) {
    return (
      <Card>
        <SectionHead title="Household not found" />
        <p className="text-[13px] text-text-mid">
          No monitored household matches id {householdId}.{' '}
          <Link to={ROUTES.affordai.households} className="text-blue hover:text-text-hi">
            Back to households
          </Link>
        </p>
      </Card>
    )
  }

  const timeline = household.history.map((year) => ({
    year: String(year.year),
    income: year.income,
    rent: year.rent,
    score: year.affordabilityScore,
  }))
  const [first, , last] = household.history

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={ROUTES.affordai.households}
          className="font-mono text-[11px] text-blue hover:text-text-hi"
        >
          ← Households
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">Household #{household.id}</h1>
          <TierBadge tier={household.tier} />
        </div>
        <p className="mt-1 text-sm text-text-mid">
          {areaById(household.area).label} · estimated from available data
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,320px)_1fr] gap-5 max-lg:grid-cols-1">
        <Card>
          <SectionHead title="Household profile" />
          <MetricRow label="Household size" value={household.size} />
          <MetricRow
            label="Estimated monthly income"
            value={`$${household.monthlyIncome.toLocaleString('en-US')}`}
          />
          <MetricRow
            label="Monthly rent"
            value={`$${household.monthlyRent.toLocaleString('en-US')}`}
          />
          <MetricRow
            label="Rent burden"
            value={`${(household.rentBurden * 100).toFixed(1)}%`}
            tone="danger"
          />
          <MetricRow
            label="Employment stability"
            value={household.employmentStability}
          />
          <MetricRow label="Location" value={areaById(household.area).label} />
          <MetricRow label="Current subsidy" value={`${household.currentSubsidy}%`} />
          <MetricRow
            label="Recommended subsidy"
            value={`${household.recommendedSubsidy}%`}
            tone="danger"
          />
        </Card>

        <Card>
          <SectionHead
            title="Financial timeline"
            note={`${first.year} – ${last.year}`}
          />
          <div className="h-[280px]">
            <ScoreTimelineChart data={timeline} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            {household.history.map((year) => (
              <div
                key={year.year}
                className="rounded-lg border border-line-soft bg-ink-2 p-3"
              >
                <div className="mb-1.5 font-mono text-[11px] text-text-low">
                  {year.year}
                </div>
                <div className="font-mono text-[12px] text-text-mid">
                  Income{' '}
                  <span className="text-text-hi">
                    ${year.income.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="font-mono text-[12px] text-text-mid">
                  Rent{' '}
                  <span className="text-text-hi">
                    ${year.rent.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="font-mono text-[12px] text-text-mid">
                  Affordability score{' '}
                  <span className="text-[15px] font-semibold text-coral">
                    {year.affordabilityScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Footnote>
            Income and rent read on the left axis, affordability score on the right.
            Scores are <b>estimated</b> and are not a credit assessment.
          </Footnote>
        </Card>
      </div>

      <RiskAssessmentCard household={household} />
    </div>
  )
}
