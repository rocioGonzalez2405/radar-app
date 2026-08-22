import { Link, useParams } from 'react-router'
import { ROUTES } from '@/app/routes'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { ScoreTimelineChart } from '@/affordai/charts/AffordCharts'
import { MetricRow } from '@/affordai/components/MetricRow'
import { RiskAssessmentCard } from '@/affordai/components/RiskAssessmentCard'
import { TierBadge } from '@/affordai/components/TierBadge'
import { areaById } from '@/affordai/data/areas'
import { formatMonth } from '@/affordai/data/calendar'
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

  const timeline = household.history.map((month) => ({
    label: formatMonth(month.month),
    income: month.income,
    rent: month.rent,
    score: month.affordabilityScore,
  }))

  // Index the ends explicitly. Positional destructuring read the third entry as
  // "last" back when the ledger was three annual points, and would still compile.
  const first = household.history[0]
  const last = household.history[household.history.length - 1]
  const negativeMonths = household.history.filter((month) => month.balance < 0).length

  const change = (from: number, to: number) => {
    const delta = ((to - from) / from) * 100
    return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`
  }

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
          <Footnote>
            The recommended percentage is this household's own model output. It will not
            match the average target published for {areaById(household.area).label} —
            the area figure answers <b>how much a program should budget for a region</b>,
            this one answers <b>what this household needs</b>. They are different
            questions, so they do not have to agree.
          </Footnote>
        </Card>

        <Card>
          <SectionHead
            title="Financial timeline"
            note={`${household.history.length} months · ${formatMonth(
              first.month,
            )} – ${formatMonth(last.month)}`}
          />
          <div className="h-[280px]">
            <ScoreTimelineChart data={timeline} />
          </div>

          {/* Twenty-four months will not render as twenty-four cards. The chart
              carries the shape; this row carries the endpoints and the change
              between them, which is what the model actually reads. */}
          <div className="mt-3 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            {(
              [
                { label: 'Monthly income', from: first.income, to: last.income, money: true },
                { label: 'Monthly rent', from: first.rent, to: last.rent, money: true },
                {
                  label: 'Affordability score',
                  from: first.affordabilityScore,
                  to: last.affordabilityScore,
                  money: false,
                },
              ] as const
            ).map((row) => (
              <div
                key={row.label}
                className="rounded-lg border border-line-soft bg-ink-2 p-3"
              >
                <div className="mb-1.5 font-mono text-[11px] text-text-low">
                  {row.label}
                </div>
                <div className="font-mono text-[13px] text-text-mid">
                  {row.money ? `$${row.from.toLocaleString('en-US')}` : row.from}
                  <span className="mx-1.5 text-text-low">→</span>
                  <span className="text-[15px] font-semibold text-text-hi">
                    {row.money ? `$${row.to.toLocaleString('en-US')}` : row.to}
                  </span>
                </div>
                <div
                  className={`mt-1 font-mono text-[12px] ${
                    row.to < row.from ? 'text-coral' : 'text-teal'
                  }`}
                >
                  {change(row.from, row.to)} over {household.history.length} months
                </div>
              </div>
            ))}
          </div>

          {negativeMonths > 0 && (
            <div className="mt-3 rounded-lg border border-coral/40 bg-coral-dim px-3.5 py-2.5">
              <span className="font-mono text-[12px] text-coral">
                {negativeMonths} of {household.history.length} months did not balance
              </span>
              <span className="ml-2 text-[12px] text-text-mid">
                — income did not cover rent plus essentials
              </span>
            </div>
          )}

          <Footnote>
            Income and rent read on the left axis, affordability score on the right.
            Ticks are thinned to every third month. Scores are <b>estimated</b> and are
            not a credit assessment.
          </Footnote>
        </Card>
      </div>

      <RiskAssessmentCard household={household} />
    </div>
  )
}
