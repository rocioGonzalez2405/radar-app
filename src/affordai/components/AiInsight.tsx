import type { ReactNode } from 'react'

export const AiInsight = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-line-soft bg-ink-2 p-3.5">
    <div className="mb-1.5 font-mono text-[11px] font-semibold tracking-wide text-blue uppercase">
      AI insight
    </div>
    <p className="text-[13px] leading-relaxed text-text-mid [&>b]:text-text-hi">
      {children}
    </p>
  </div>
)
