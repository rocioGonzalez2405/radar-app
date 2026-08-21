type BadgeTone = 'crit' | 'high' | 'mod'

const TONE_CLASS: Record<BadgeTone, string> = {
  crit: 'bg-coral-dim text-[#ffb199]',
  high: 'bg-amber-dim text-[#f3c67a]',
  mod: 'bg-blue/15 text-[#a9c4fb]',
}

export const Badge = ({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) => (
  <span
    className={`rounded-md px-2.5 py-0.5 font-mono text-[11px] font-semibold ${TONE_CLASS[tone]}`}
  >
    {children}
  </span>
)
