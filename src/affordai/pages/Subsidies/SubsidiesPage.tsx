import { Link } from 'react-router'
import { householdPath } from '@/app/routes'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { recommendations, subsidyAllocations } from '@/affordai/data/selectors'
import { useAffordStore } from '@/affordai/state/AffordStore'

export const SubsidiesPage = () => {
  const allocations = subsidyAllocations()
  const { approvedInterventions, approvedRecommendations } = useAffordStore()
  const approvedRecs = recommendations().filter((recommendation) =>
    approvedRecommendations.includes(recommendation.id),
  )
  const totalCost = allocations.reduce((total, row) => total + row.monthlyCost, 0)

  const headerClass = 'py-2 font-mono text-[11px] tracking-wide text-text-low uppercase'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Subsidies</h1>
        <p className="mt-1 text-sm text-text-mid">
          Where the program's subsidy budget is allocated, and what has been approved.
        </p>
      </div>

      <Card>
        <SectionHead title="Allocation by area" note="Vulnerable households only" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className={headerClass}>Area</th>
                <th className={`${headerClass} text-right`}>Households</th>
                <th className={`${headerClass} text-right`}>Avg. subsidy</th>
                <th className={`${headerClass} text-right`}>Monthly cost</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((row) => (
                <tr key={row.areaId} className="border-b border-line-soft">
                  <td className="py-2.5 text-[13px] text-text-mid">{row.areaLabel}</td>
                  <td className="py-2.5 text-right font-mono text-[13px]">
                    {row.households.toLocaleString('en-US')}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px]">
                    {row.averageSubsidy}%
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px]">
                    ${row.monthlyCost.toLocaleString('en-US')}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5 text-[13px] font-semibold">Total</td>
                <td className="py-2.5 text-right font-mono text-[13px] font-semibold">
                  {allocations
                    .reduce((total, row) => total + row.households, 0)
                    .toLocaleString('en-US')}
                </td>
                <td />
                <td className="py-2.5 text-right font-mono text-[13px] font-semibold">
                  ${totalCost.toLocaleString('en-US')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Footnote>
          Monthly cost is <b>estimated</b> from the average subsidy percentage applied to
          a modeled essential-goods basket.
        </Footnote>
      </Card>

      <Card>
        <SectionHead
          title="Approved this session"
          note={`${approvedInterventions.length + approvedRecs.length} approvals`}
        />
        {approvedInterventions.length === 0 && approvedRecs.length === 0 ? (
          <p className="py-4 text-[13px] text-text-low">
            Nothing approved yet. Approve a recommendation on Overview or an intervention
            on a household to see it here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {approvedRecs.map((recommendation) => (
              <li
                key={recommendation.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft pb-2 last:border-0"
              >
                <span className="text-[13px] text-text-hi">{recommendation.title}</span>
                <span className="font-mono text-[12px] text-teal">
                  {recommendation.subsidyFrom}% → {recommendation.subsidyTo}%
                </span>
              </li>
            ))}
            {approvedInterventions.map((intervention) => (
              <li
                key={intervention.householdId}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft pb-2 last:border-0"
              >
                <Link
                  to={householdPath(intervention.householdId)}
                  className="text-[13px] text-blue hover:text-text-hi"
                >
                  Household #{intervention.householdId}
                </Link>
                <span className="font-mono text-[12px] text-teal">
                  {intervention.subsidy}% food subsidy
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Disclaimer />
        </div>
      </Card>
    </div>
  )
}
