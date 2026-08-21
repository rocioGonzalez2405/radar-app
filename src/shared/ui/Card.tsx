import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  tight?: boolean
  noPadding?: boolean
  className?: string
}

export const Card = ({
  children,
  tight = false,
  noPadding = false,
  className = '',
}: CardProps) => (
  <div
    className={`rounded-xl border border-line bg-ink-1 ${noPadding ? '' : tight ? 'p-4' : 'p-5'} ${className}`}
  >
    {children}
  </div>
)

interface SectionHeadProps {
  title: string
  note?: string
}

export const SectionHead = ({ title, note }: SectionHeadProps) => (
  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-1.5">
    <div className="text-[15px] font-semibold">{title}</div>
    {note && <div className="font-mono text-[11px] text-text-low">{note}</div>}
  </div>
)

interface LegendItem {
  label: string
  color: string
}

export const Legend = ({ items }: { items: LegendItem[] }) => (
  <div className="mb-2.5 flex flex-wrap gap-4 font-mono text-[11px] text-text-mid">
    {items.map((item) => (
      <span key={item.label} className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{ backgroundColor: item.color }}
        />
        {item.label}
      </span>
    ))}
  </div>
)

export const Footnote = ({ children }: { children: ReactNode }) => (
  <p className="mt-2.5 text-[11px] leading-relaxed text-text-low [&>b]:text-text-mid">
    {children}
  </p>
)
