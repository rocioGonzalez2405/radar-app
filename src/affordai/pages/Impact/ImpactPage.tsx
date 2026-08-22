import { Card, Footnote, Legend, SectionHead } from '@/shared/ui/Card'
import { Kpi } from '@/shared/ui/Kpi'
import { AFFORD_CHART_COLORS, BeforeAfterChart } from '@/affordai/charts/AffordCharts'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { impactMetrics } from '@/affordai/data/selectors'
import { useAffordStore } from '@/affordai/state/AffordStore'

export const ImpactPage = () => {
  const baseline = impactMetrics()
  const { approvedInterventions, approvedRecommendations } = useAffordStore()

  // Approvals made during this session count toward the program totals, so the
  // number moves when an administrator acts. Reloading resets to the baseline.
  const sessionApprovals = approvedInterventions.length
  const stabilized = baseline.householdsStabilized + sessionApprovals
  const prevented = baseline.preventedFromHighRisk + sessionApprovals

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Impact</h1>
        <p className="mt-1 text-sm text-text-mid">
          Whether the interventions this program approved are actually working.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-sm:grid-cols-1">
        <Kpi
          label="Households stabilized"
          value={stabilized.toLocaleString('en-US')}
          delta={sessionApprovals > 0 ? `+${sessionApprovals} this session` : undefined}
          deltaTone="down"
          tone="ok"
        />
        <Kpi
          label="Avg. subsidy per household"
          value={`$${baseline.averageSubsidyPerHousehold}`}
          tone="neutral"
        />
        <Kpi
          label="Reduction in vulnerability"
          value={`${baseline.vulnerabilityReduction}%`}
          tone="ok"
        />
        <Kpi
          label="Cost per successful intervention"
          value={`$${baseline.costPerSuccessfulIntervention}`}
          tone="neutral"
        />
        <Kpi
          label="Approved recommendations"
          value={approvedRecommendations.length}
          tone="neutral"
        />
      </div>

      <Card>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="font-mono text-[11px] tracking-wide text-text-low uppercase">
            Estimated households prevented from entering high-risk status
          </div>
          <div className="font-mono text-[56px] leading-none font-semibold text-teal max-sm:text-[40px]">
            {prevented.toLocaleString('en-US')}
          </div>
          <p className="max-w-[560px] text-[13px] leading-relaxed text-text-mid">
            Estimated by comparing each intervened household's observed tier against the
            model's counterfactual projection for the same 90-day window.
          </p>
          {sessionApprovals > 0 && (
            <p className="text-[12px] text-teal">
              Includes {sessionApprovals} intervention
              {sessionApprovals === 1 ? '' : 's'} approved in this session.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <SectionHead title="Before and after intervention" note="Program to date" />
        <Legend
          items={[
            { label: 'Before', color: AFFORD_CHART_COLORS.highRisk },
            { label: 'After', color: AFFORD_CHART_COLORS.stable },
          ]}
        />
        <div className="h-[300px]">
          <BeforeAfterChart data={baseline.beforeAfter} />
        </div>
        <Footnote>
          Lower is better on every measure shown. Figures are <b>estimated</b> from
          available data.
        </Footnote>
        <div className="mt-3">
          <Disclaimer />
        </div>
      </Card>
    </div>
  )
}
