import type { ProvenanceTier } from '@/affordai/data/types'

/**
 * How much confidence one figure carries. Deliberately the same tag shape
 * Radar's Sources page uses, so a reader moving between the two products reads
 * one visual language rather than two.
 *
 * `reported` is never styled like `verified`: the whole point of the middle tier
 * is that a real, named source could not be retrieved from this environment, and
 * a badge that flattened that into "verified" would be the one lie this console
 * cannot afford.
 */
const TIER_CLASS: Record<ProvenanceTier, string> = {
  verified: 'bg-teal-dim text-[#8fe9cd]',
  reported: 'bg-amber-dim text-[#f3c67a]',
  simulated: 'bg-blue/15 text-[#a9c4fb]',
}

const TIER_LABEL: Record<ProvenanceTier, string> = {
  verified: 'Verified',
  reported: 'Reported',
  simulated: 'Simulated',
}

const TIER_TITLE: Record<ProvenanceTier, string> = {
  verified: 'Read first-hand from the named public source.',
  reported:
    'The source is real and named, but could not be retrieved from this environment — the figure came from a search-result summary.',
  simulated:
    'No public source exists at this granularity, because the records are protected or the program is hypothetical.',
}

export const ProvenanceBadge = ({ tier }: { tier: ProvenanceTier }) => (
  <span
    title={TIER_TITLE[tier]}
    className={`inline-block h-fit rounded-md px-2.5 py-0.5 font-mono text-[10.5px] font-semibold whitespace-nowrap ${TIER_CLASS[tier]}`}
  >
    {TIER_LABEL[tier]}
  </span>
)
