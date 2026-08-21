const SLOTS = [
  { key: 'whatHappened', label: 'What happened' },
  { key: 'whyItMatters', label: 'Why it matters' },
  { key: 'modelPrediction', label: 'What the model predicts' },
  { key: 'recommendedAction', label: 'Recommended action' },
] as const

export interface AiRationaleProps {
  whatHappened: string
  whyItMatters: string
  modelPrediction: string
  recommendedAction: string
}

/**
 * The product's core UX principle: whenever the model recommends something, all
 * four slots are shown. A model output with a missing slot is not shippable.
 */
export const AiRationale = (props: AiRationaleProps) => (
  <ol className="flex flex-col gap-2.5">
    {SLOTS.map((slot, index) => (
      <li key={slot.key} className="flex gap-3">
        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ink-2 font-mono text-[10px] text-text-mid">
          {index + 1}
        </span>
        <div>
          <div className="font-mono text-[10px] tracking-wide text-text-low uppercase">
            {slot.label}
          </div>
          <p className="text-[13px] leading-relaxed text-text-mid">{props[slot.key]}</p>
        </div>
      </li>
    ))}
  </ol>
)
