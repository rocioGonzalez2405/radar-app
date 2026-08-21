import { Kpi } from '@/shared/ui/Kpi'
import { SectionHead, Footnote } from '@/shared/ui/Card'
import { investmentOutcomes } from '@/shared/data/radarData'

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US')}`

export const SimulatorPage = () => (
  <div>
    <div className="mb-6">
      <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
        Regional investment
      </div>
      <h1 className="text-[26px] font-semibold tracking-tight">
        What real funding has actually produced
      </h1>
      <p className="mt-1 max-w-xl text-[13px] text-text-mid">
        The previous version of this page was a "what-if" slider driven by an
        invented projection formula with no real data behind it. It was
        removed. In its place, this page shows verified regional outcomes
        from actual State Homeless Housing, Assistance and Prevention (HHAP)
        funding.
      </p>
    </div>

    <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-3">
      <Kpi
        label="HHAP funding, San Diego area (rounds 1–5)"
        value={formatCurrency(investmentOutcomes.hhapFunding)}
        delta="2019–2025"
        tone="neutral"
      />
      <Kpi
        label="People connected to services"
        value={investmentOutcomes.peopleConnectedToServices.toLocaleString('en-US')}
        delta="Jan 2023 – Jun 2025"
        tone="ok"
      />
      <Kpi
        label="People housed"
        value={investmentOutcomes.peopleHoused.toLocaleString('en-US')}
        delta="Jan 2023 – Jun 2025"
        tone="ok"
      />
    </div>

    <div>
      <SectionHead
        title="Data quality caveat"
        note="Source: accountability.ca.gov; California State Auditor Report 2023-102.1"
      />
      <div className="rounded-xl border border-amber/40 bg-amber-dim p-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-[22px] font-semibold text-amber">
            {investmentOutcomes.unknownExitDestinationShare}
          </span>
          <span className="text-[13px] text-[#f3c67a]">
            of program exits have an unknown destination
          </span>
        </div>
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#f3c67a]/90">
          The California State Auditor found that roughly one in three people
          who exit a homelessness program in this region have no recorded
          destination — meaning outcome data like "people housed" above is
          likely an undercount, and the true resolution rate is not fully
          known. This is not hidden or downplayed here on purpose: it's a
          real limitation of the state's own tracking.
        </p>
      </div>
      <Footnote>
        <b>Reading it —</b> {investmentOutcomes.source}.
      </Footnote>
    </div>
  </div>
)
