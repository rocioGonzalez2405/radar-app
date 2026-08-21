import { Badge } from '@/shared/ui/Badge'
import { Card, SectionHead } from '@/shared/ui/Card'
import { AiRationale } from '@/affordai/components/AiRationale'
import { FactorBars } from '@/affordai/components/FactorBars'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { formatMonth } from '@/affordai/data/calendar'
import { factorsFor } from '@/affordai/data/factors'
import { useAffordStore } from '@/affordai/state/AffordStore'
import type { Household, Tier } from '@/affordai/data/types'

const TIER_HEADLINE: Record<Tier, string> = {
  stable: 'Stable',
  emerging: 'Emerging vulnerability',
  'high-risk': 'High Risk',
}

const TIER_TONE = { stable: 'mod', emerging: 'high', 'high-risk': 'crit' } as const

const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

export const RiskAssessmentCard = ({ household }: { household: Household }) => {
  const { approvedInterventions, approveIntervention } = useAffordStore()
  const approved = approvedInterventions.some(
    (entry) => entry.householdId === household.id,
  )

  // The ledger is 24 monthly entries, oldest first. Index the ends explicitly:
  // positional destructuring silently read the third month as "last" when the
  // history was three annual points, and would keep compiling here.
  const first = household.history[0]
  const last = household.history[household.history.length - 1]
  const incomeChange = ((last.income - first.income) / first.income) * 100
  const rentChange = ((last.rent - first.rent) / first.rent) * 100
  const negativeMonths = household.history.filter((month) => month.balance < 0).length
  const horizonDays = 90
  const probability = Math.round(household.riskProbability * 100)

  return (
    <Card>
      <SectionHead
        title="AI Vulnerability Assessment"
        note={`Affordability v1.4 · ${horizonDays}-day horizon`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge tone={TIER_TONE[household.tier]}>{TIER_HEADLINE[household.tier]}</Badge>
        <span className="font-mono text-[13px] text-text-mid">
          <span className="text-[22px] font-semibold text-text-hi">{probability}%</span>{' '}
          predicted probability of increased financial vulnerability within{' '}
          {horizonDays} days
        </span>
      </div>

      <div className="mb-4">
        <FactorBars factors={factorsFor(household)} />
      </div>

      <div className="mb-4">
        <AiRationale
          whatHappened={`Estimated monthly income changed ${signed(
            incomeChange,
          )} while monthly rent changed ${signed(rentChange)} between ${formatMonth(
            first.month,
          )} and ${formatMonth(last.month)}.`}
          whyItMatters={`This moved the household's housing burden to ${(
            household.rentBurden * 100
          ).toFixed(1)}% of income${
            negativeMonths > 0
              ? `, and ${negativeMonths} of the last ${household.history.length} months did not balance`
              : ''
          }. The model reads the trend, not the latest month alone.`}
          modelPrediction={`The model predicts a ${probability}% probability of increased financial vulnerability within ${horizonDays} days, based on available data.`}
          recommendedAction={`Temporary ${household.recommendedSubsidy}% food subsidy, up from the current ${household.currentSubsidy}%.`}
        />
      </div>

      <div className="rounded-lg border border-line-soft bg-ink-2 p-3.5">
        <div className="mb-1 font-mono text-[11px] tracking-wide text-text-low uppercase">
          Recommended intervention
        </div>
        <div className="mb-3 text-[15px] font-semibold">
          Temporary {household.recommendedSubsidy}% food subsidy
        </div>
        {approved ? (
          <div className="rounded-lg border border-teal/40 bg-teal-dim px-3.5 py-2.5 text-[13px] text-teal">
            Approved · {household.recommendedSubsidy}% subsidy queued for household #
            {household.id}
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              approveIntervention(household.id, household.recommendedSubsidy)
            }
            className="rounded-full bg-teal px-4 py-1.5 text-sm font-semibold text-[#08201a] hover:bg-teal/90"
          >
            Approve intervention
          </button>
        )}
        <div className="mt-3">
          <Disclaimer />
        </div>
      </div>
    </Card>
  )
}
