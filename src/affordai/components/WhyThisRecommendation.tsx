import { useState } from 'react'
import { FactorBars } from '@/affordai/components/FactorBars'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import type { RiskFactor } from '@/affordai/data/types'

export const WhyThisRecommendation = ({
  factors,
  explanation,
}: {
  factors: RiskFactor[]
  explanation: string
}) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-line-soft bg-ink-2/60">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[13px] font-medium text-blue hover:text-text-hi"
      >
        Why this recommendation?
        <span className="font-mono text-[11px] text-text-low">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-line-soft px-3.5 py-3.5">
          <FactorBars factors={factors} title="Top factors influencing the model" />
          <p className="text-[13px] leading-relaxed text-text-mid">{explanation}</p>
          <Disclaimer />
        </div>
      )}
    </div>
  )
}
