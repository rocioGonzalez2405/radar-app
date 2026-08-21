import type { TimeRange } from '@/affordai/data/types'

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
]

export const RangeToggle = ({
  value,
  onChange,
}: {
  value: TimeRange
  onChange: (range: TimeRange) => void
}) => (
  <div className="inline-flex rounded-lg border border-line bg-ink-2 p-0.5">
    {RANGES.map((range) => (
      <button
        key={range.value}
        type="button"
        aria-pressed={range.value === value}
        onClick={() => onChange(range.value)}
        className={`rounded-md px-3 py-1 font-mono text-[11px] transition-colors ${
          range.value === value
            ? 'bg-ink-1 text-text-hi'
            : 'text-text-mid hover:text-text-hi'
        }`}
      >
        {range.label}
      </button>
    ))}
  </div>
)
