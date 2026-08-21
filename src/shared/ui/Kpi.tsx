import type { ReactNode } from 'react'

type KpiTone = 'danger' | 'warn' | 'ok' | 'neutral'

const TONE_BORDER: Record<KpiTone, string> = {
  danger: 'before:bg-coral',
  warn: 'before:bg-amber',
  ok: 'before:bg-teal',
  neutral: 'before:bg-blue',
}

interface KpiProps {
  label: string
  value: ReactNode
  delta?: ReactNode
  deltaTone?: 'up' | 'down' | 'neutral'
  tone: KpiTone
}

const DELTA_COLOR: Record<'up' | 'down' | 'neutral', string> = {
  up: 'text-coral',
  down: 'text-teal',
  neutral: 'text-text-mid',
}

export const Kpi = ({
  label,
  value,
  delta,
  deltaTone = 'neutral',
  tone,
}: KpiProps) => (
  <div
    className={`relative overflow-hidden rounded-[10px] border border-line bg-ink-1 p-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] ${TONE_BORDER[tone]}`}
  >
    <div className="mb-2.5 text-[11px] tracking-wide text-text-low uppercase">
      {label}
    </div>
    <div className="font-mono text-[28px] font-semibold">{value}</div>
    {delta && (
      <div className={`mt-1.5 text-[11px] ${DELTA_COLOR[deltaTone]}`}>
        {delta}
      </div>
    )}
  </div>
)
