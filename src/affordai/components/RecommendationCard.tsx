import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui/Card'
import { AiRationale } from '@/affordai/components/AiRationale'
import { WhyThisRecommendation } from '@/affordai/components/WhyThisRecommendation'
import { useAffordStore } from '@/affordai/state/AffordStore'
import type { Recommendation } from '@/affordai/data/types'

const IMPACT_TONE = { High: 'crit', Medium: 'high', Low: 'mod' } as const

export const RecommendationCard = ({
  recommendation,
}: {
  recommendation: Recommendation
}) => {
  const {
    approvedRecommendations,
    dismissedRecommendations,
    approveRecommendation,
    dismissRecommendation,
  } = useAffordStore()

  const approved = approvedRecommendations.includes(recommendation.id)
  const dismissed = dismissedRecommendations.includes(recommendation.id)

  return (
    <Card className={dismissed ? 'opacity-55' : ''}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[15px] font-semibold">{recommendation.title}</div>
          <div className="mt-0.5 font-mono text-[11px] text-text-low">
            AI recommendation · {recommendation.subsidyFrom}% → {recommendation.subsidyTo}%
          </div>
        </div>
        <Badge tone={IMPACT_TONE[recommendation.impactPotential]}>
          {recommendation.impactPotential} impact potential
        </Badge>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
        {recommendation.drivers.map((driver) => (
          <span key={driver.label} className="font-mono text-[11px] text-text-mid">
            {driver.label} <span className="font-semibold text-text-hi">{driver.delta}</span>
          </span>
        ))}
      </div>

      <div className="mb-3">
        <AiRationale
          whatHappened={recommendation.whatHappened}
          whyItMatters={recommendation.whyItMatters}
          modelPrediction={recommendation.modelPrediction}
          recommendedAction={recommendation.recommendedAction}
        />
      </div>

      <div className="mb-3">
        <WhyThisRecommendation
          factors={recommendation.factors}
          explanation="The model weights housing burden most heavily because it is the factor that most often precedes a tier change in the historical data. Contributions are estimated from available data and do not imply causation."
        />
      </div>

      {approved ? (
        <div className="rounded-lg border border-teal/40 bg-teal-dim px-3.5 py-2.5 text-[13px] text-teal">
          Approved · queued for the next disbursement cycle
        </div>
      ) : dismissed ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[13px] text-text-low">Dismissed</span>
          <button
            type="button"
            onClick={() => approveRecommendation(recommendation.id)}
            className="text-[13px] font-medium text-blue hover:text-text-hi"
          >
            Reconsider
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => approveRecommendation(recommendation.id)}
            className="rounded-full bg-teal px-4 py-1.5 text-sm font-semibold text-on-accent hover:bg-teal/90"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => dismissRecommendation(recommendation.id)}
            className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-text-mid hover:border-line-soft hover:text-text-hi"
          >
            Dismiss
          </button>
        </div>
      )}
    </Card>
  )
}
