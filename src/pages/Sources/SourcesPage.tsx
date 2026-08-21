import { Card, SectionHead, Footnote } from '@/shared/ui/Card'
import { dataSources, type SourceEntry } from '@/shared/data/radarData'

const TAG_CLASS: Record<SourceEntry['status'], string> = {
  public: 'bg-teal-dim text-[#8fe9cd]',
  protected: 'bg-amber-dim text-[#f3c67a]',
}

const TAG_LABEL: Record<SourceEntry['status'], string> = {
  public: 'Public',
  protected: 'Protected',
}

const SourceRow = ({ source }: { source: SourceEntry }) => (
  <div className="flex items-start justify-between gap-4 border-b border-line-soft py-3.5 text-sm last:border-b-0">
    <div>
      <div className="font-medium text-text-hi">{source.name}</div>
      <div className="mt-0.5 font-mono text-[11px] text-text-mid">
        Data as of: {source.dataAsOf} · Verified: {source.lastVerified}
      </div>
      {source.note && (
        <div className="mt-0.5 text-xs text-text-low">{source.note}</div>
      )}
    </div>
    <span
      className={`h-fit rounded-md px-2.5 py-0.5 font-mono text-[10.5px] whitespace-nowrap ${TAG_CLASS[source.status]}`}
    >
      {TAG_LABEL[source.status]}
    </span>
  </div>
)

const publicSources = dataSources.filter((s) => s.status === 'public')
const protectedSources = dataSources.filter((s) => s.status === 'protected')

export const SourcesPage = () => (
  <div>
    <div className="mb-6">
      <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
        Data provenance
      </div>
      <h1 className="text-[26px] font-semibold tracking-tight">
        What's real, what's protected
      </h1>
      <p className="mt-1 max-w-xl text-[13px] text-text-mid">
        Every indicator shown elsewhere in this dashboard traces back to one
        of the public sources below. Case-level fields used for triage live
        inside a Continuum of Care's protected HMIS and have no public
        aggregate — they are simulated on the Triage page.
      </p>
    </div>

    <div className="mb-7">
      <SectionHead title="Public sources" note={`${publicSources.length} sources`} />
      <Card>
        {publicSources.map((source) => (
          <SourceRow key={source.name} source={source} />
        ))}
      </Card>
    </div>

    <div>
      <SectionHead title="Protected, individual-level sources" note={`${protectedSources.length} sources`} />
      <Card>
        {protectedSources.map((source) => (
          <SourceRow key={source.name} source={source} />
        ))}
      </Card>
      <Footnote>
        <b>In this dashboard —</b> all case-level numbers shown on the Triage
        page (case IDs, scores, day counts) are simulated illustrations, not
        real records. Every other number in this app is drawn from the
        public sources above, current as of the dates listed next to each
        one.
      </Footnote>
    </div>
  </div>
)
