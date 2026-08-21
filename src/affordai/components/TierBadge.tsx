import { Badge } from '@/shared/ui/Badge'
import type { Tier } from '@/affordai/data/types'

const TIER_LABEL: Record<Tier, string> = {
  stable: 'Stable',
  emerging: 'Emerging',
  'high-risk': 'High risk',
}

const TIER_TONE = { stable: 'mod', emerging: 'high', 'high-risk': 'crit' } as const

export const TierBadge = ({ tier }: { tier: Tier }) => (
  <Badge tone={TIER_TONE[tier]}>{TIER_LABEL[tier]}</Badge>
)
