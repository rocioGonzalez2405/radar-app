import type { ReactNode } from 'react'

export const MetricRow = ({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  tone?: 'default' | 'danger'
}) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-line-soft py-2 last:border-0">
    <span className="text-[12px] text-text-mid">{label}</span>
    <span
      className={`font-mono text-[13px] font-semibold ${
        tone === 'danger' ? 'text-coral' : 'text-text-hi'
      }`}
    >
      {value}
    </span>
  </div>
)
