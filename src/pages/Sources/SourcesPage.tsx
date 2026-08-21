import { Card, SectionHead, Footnote } from '@/shared/ui/Card'
import { publicSources, protectedSources, type SourceEntry } from '@/shared/data/radarData'

const TAG_CLASS: Record<SourceEntry['status'], string> = {
  public: 'bg-teal-dim text-[#8fe9cd]',
  'public-aggregate': 'bg-teal-dim text-[#8fe9cd]',
  protected: 'bg-amber-dim text-[#f3c67a]',
}

const TAG_LABEL: Record<SourceEntry['status'], string> = {
  public: 'Public',
  'public-aggregate': 'Public (aggregate)',
  protected: 'Protected',
}

const SourceRow = ({ source }: { source: SourceEntry }) => (
  <div className="flex items-start justify-between gap-4 border-b border-line-soft py-3.5 text-sm last:border-b-0">
    <div>
      <div className="font-medium text-text-hi">{source.name}</div>
      <div className="mt-0.5 text-xs text-text-mid">{source.description}</div>
    </div>
    <span
      className={`h-fit rounded-md px-2.5 py-0.5 font-mono text-[10.5px] whitespace-nowrap ${TAG_CLASS[source.status]}`}
    >
      {TAG_LABEL[source.status]}
    </span>
  </div>
)

export const SourcesPage = () => (
  <div>
    <div className="mb-6">
      <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
        Data provenance
      </div>
      <h1 className="text-[26px] font-semibold tracking-tight">
        What's real, what's modeled
      </h1>
      <p className="mt-1 max-w-xl text-[13px] text-text-mid">
        Aggregate indicators are public and calibrate the forecast directly.
        Case-level fields used for triage live inside a Continuum of Care's
        protected HMIS and are synthetic in this prototype.
      </p>
    </div>

    <div className="mb-7">
      <SectionHead title="Public, aggregate sources" />
      <Card>
        {publicSources.map((source) => (
          <SourceRow key={source.name} source={source} />
        ))}
      </Card>
    </div>

    <div>
      <SectionHead title="Protected, individual-level sources" />
      <Card>
        {protectedSources.map((source) => (
          <SourceRow key={source.name} source={source} />
        ))}
      </Card>
      <Footnote>
        <b>In this prototype —</b> all case-level numbers shown on the
        Triage page (case IDs, scores, day counts) are synthetic, generated
        to match plausible distributions from the public aggregate sources
        above. A production build would connect to a local CoC's real HMIS
        export under a standard data-sharing agreement, and to Eviction
        Lab's public API for eviction filings.
      </Footnote>
    </div>
  </div>
)
