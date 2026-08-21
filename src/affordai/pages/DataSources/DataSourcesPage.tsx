import { Link } from 'react-router'
import { ROUTES } from '@/app/routes'
import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { Disclaimer } from '@/affordai/components/Disclaimer'
import { MetricRow } from '@/affordai/components/MetricRow'
import { ProvenanceBadge } from '@/affordai/components/ProvenanceBadge'
import { sources } from '@/affordai/data/selectors'
import type { AffordSource, ProvenanceTier } from '@/affordai/data/types'
import { AUDIT_KEYS } from '@/affordai/model/features'
import { COEFFICIENTS, HORIZON_DAYS } from '@/affordai/model/riskModel'

/**
 * There is no local SOURCES array on purpose. Provenance is data, it lives in
 * `sources.ts`, and this page renders whatever that module currently says.
 * A second hand-maintained copy here would be the one that goes stale, and a
 * stale provenance table is worse than none.
 */

const STATUS_CLASS: Record<AffordSource['status'], string> = {
  public: 'bg-teal-dim text-[#8fe9cd]',
  protected: 'bg-amber-dim text-[#f3c67a]',
  unpublished: 'bg-blue/15 text-[#a9c4fb]',
}

const STATUS_LABEL: Record<AffordSource['status'], string> = {
  public: 'Public',
  protected: 'Protected',
  unpublished: 'Not published',
}

const TIER_ORDER: ProvenanceTier[] = ['verified', 'reported', 'simulated']

const TIER_HEADING: Record<ProvenanceTier, string> = {
  verified: 'Verified',
  reported: 'Reported',
  simulated: 'Simulated',
}

const TIER_BLURB: Record<ProvenanceTier, string> = {
  verified: 'Read first-hand from the named public document.',
  reported:
    'The source is real and named, but this environment could not retrieve it — BLS and FRED answer HTTP 403 to automated requests, so the figure came from a search-result summary rather than the release itself.',
  simulated:
    'No public source exists at the granularity shown, because the underlying records are protected or the program is hypothetical.',
}

const headerClass = 'py-2 font-mono text-[11px] tracking-wide text-text-low uppercase'

const SourceTable = ({ rows }: { rows: AffordSource[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[620px] border-collapse text-left">
      <thead>
        <tr className="border-b border-line">
          <th className={headerClass}>Source</th>
          <th className={headerClass}>Data as of</th>
          <th className={headerClass}>Verified</th>
          <th className={headerClass}>Access</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((source) => (
          <tr key={source.name} className="border-b border-line-soft last:border-0">
            <td className="py-3 pr-4 align-top text-[13px]">
              <div className="font-medium text-text-hi">{source.name}</div>
              {source.note && (
                <div className="mt-0.5 text-xs leading-relaxed text-text-low">
                  {source.note}
                </div>
              )}
            </td>
            <td className="py-3 pr-3 align-top font-mono text-[11px] whitespace-nowrap text-text-mid">
              {source.dataAsOf}
            </td>
            <td className="py-3 pr-3 align-top font-mono text-[11px] whitespace-nowrap text-text-mid">
              {source.lastVerified}
            </td>
            <td className="py-3 align-top">
              <span
                className={`inline-block h-fit rounded-md px-2.5 py-0.5 font-mono text-[10.5px] whitespace-nowrap ${STATUS_CLASS[source.status]}`}
              >
                {STATUS_LABEL[source.status]}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const DataSourcesPage = () => {
  const entries = sources()
  const protectedRows = entries.filter((source) => source.status === 'protected')
  const unpublishedRows = entries.filter((source) => source.status === 'unpublished')
  const withheld = protectedRows.length + unpublishedRows.length
  const weightedFeatures = Object.keys(COEFFICIENTS).length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Data Sources</h1>
        <p className="mt-1 text-sm text-text-mid">
          What the affordability model reads, where each figure came from, and how
          much confidence it carries. Grouped by provenance rather than by topic,
          because that is the distinction a reader has to be able to make.
        </p>
      </div>

      {TIER_ORDER.map((tier) => {
        const rows = entries.filter((source) => source.tier === tier)
        if (rows.length === 0) return null
        return (
          <Card key={tier}>
            <SectionHead
              title={TIER_HEADING[tier]}
              note={`${rows.length} ${rows.length === 1 ? 'source' : 'sources'}`}
            />
            <div className="mb-3 flex flex-wrap items-start gap-3">
              <ProvenanceBadge tier={tier} />
              <p className="max-w-2xl flex-1 text-[12px] leading-relaxed text-text-mid">
                {TIER_BLURB[tier]}
              </p>
            </div>
            <SourceTable rows={rows} />
          </Card>
        )
      })}

      <Card>
        <SectionHead
          title="Why the household population is simulated"
          note={`${withheld} of ${entries.length} entries have no public aggregate`}
        />
        <p className="text-[13px] leading-relaxed text-text-mid">
          The console's per-household figures are not sampled from anything, and the
          reason is in the tables above rather than in a design preference.
        </p>
        <ul className="mt-2 flex flex-col gap-2">
          <li className="text-[13px] leading-relaxed text-text-mid">
            <b className="text-text-hi">Protected</b> ({protectedRows.length}) —
            individual-level record types with no public aggregate at household
            granularity:{' '}
            {protectedRows.map((source) => source.name).join('; ')}. A real deployment
            would read these under an agreement; a prototype cannot, so the population
            standing in for them is generated.
          </li>
          <li className="text-[13px] leading-relaxed text-text-mid">
            <b className="text-text-hi">Not published</b> ({unpublishedRows.length}) — a
            genuinely different case, and it needs its own word. Nobody is withholding{' '}
            {unpublishedRows.map((source) => source.name).join('; ')} for privacy; it
            simply is not broken out at the granularity this console displays. Filing it
            under Protected would misstate why it is missing.
          </li>
        </ul>
        <Footnote>
          Every per-household figure in this prototype is <b>synthetic</b>, generated
          from a seeded distribution. No real household record is present. The macro
          indicators the areas are grounded on are the <b>Verified</b> entries above.
        </Footnote>
      </Card>

      <Card>
        <SectionHead title="Model card" note="Affordability v1.4" />
        <MetricRow label="Model" value="Affordability v1.4 · logistic regression" />
        <MetricRow
          label="Task"
          value={`${HORIZON_DAYS}-day vulnerability probability`}
        />
        <MetricRow
          label="Inputs"
          value={`${weightedFeatures} weighted features · ${AUDIT_KEYS.length} audit-only`}
        />
        <MetricRow
          label="Output"
          value="Probability, factor attribution, subsidy recommendation"
        />
        <MetricRow label="Coefficients" value="Hand-set, not fitted" />
        <MetricRow
          label="Known limitation"
          value="No labelled outcomes to fit or validate against"
        />
        <Footnote>
          The coefficients are hand-set because the population is synthetic and there
          is nothing to fit against — so the horizon is a declared interpretation
          rather than a trained parameter, and no figure here is a measured
          performance claim. The full weight table, the fairness audit, and the
          subsidy policy are on{' '}
          <Link to={ROUTES.affordai.settings} className="text-blue hover:text-text-hi">
            Settings
          </Link>
          .
        </Footnote>
        <div className="mt-3">
          <Disclaimer />
        </div>
      </Card>
    </div>
  )
}
