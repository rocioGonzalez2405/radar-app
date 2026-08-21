import { Card, SectionHead, Footnote } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { triageCases, triageMethodologyNote } from '@/shared/data/radarData'

const SCOPE_PILLS = ['All cases', 'With children', '18–24', 'Shelter exits']

const levelCounts = {
  crit: triageCases.filter((c) => c.level === 'crit').length,
  high: triageCases.filter((c) => c.level === 'high').length,
  mod: triageCases.filter((c) => c.level === 'mod').length,
}

export const TriagePage = () => (
  <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          Simulated — grounded in real study
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">
          Who needs help first, today
        </h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          Case-level urgency scoring, ranked by how little time is left. The
          case rows below are illustrative, not real records — individual
          HMIS data is protected. The risk-factor model is grounded in a real
          211 San Diego study (see the card below).
        </p>
      </div>
      <div className="flex flex-wrap gap-2 font-mono text-xs">
        {SCOPE_PILLS.map((pill, i) => (
          <button
            key={pill}
            type="button"
            className={`rounded-full border px-3.5 py-1.5 ${
              i === 0
                ? 'border-coral bg-coral-dim text-[#ffbfa8]'
                : 'border-line text-text-mid'
            }`}
          >
            {pill}
          </button>
        ))}
      </div>
    </div>

    <div className="mb-7">
      <SectionHead
        title="Simulated case triage — ranked by urgency, not arrival order"
        note="Illustrative rows · not real records"
      />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card tight>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line">
                {['#', 'Case', 'Primary factor', 'Days left', 'Score'].map((h) => (
                  <th
                    key={h}
                    className="px-2.5 py-2 text-left text-[10.5px] font-medium tracking-wide text-text-low uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {triageCases.map((c, i) => (
                <tr key={c.id} className="border-b border-line-soft last:border-b-0">
                  <td className="px-2.5 py-2.5 text-text-mid">{i + 1}</td>
                  <td className="px-2.5 py-2.5 font-medium text-text-hi">{c.id}</td>
                  <td className="px-2.5 py-2.5 text-text-mid">{c.factor}</td>
                  <td className="px-2.5 py-2.5 text-text-mid">{c.daysLeft}d</td>
                  <td className="px-2.5 py-2.5">
                    <Badge tone={c.level}>{c.score}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Footnote>
            <b>Note —</b> {levelCounts.crit} critical, {levelCounts.high} high,
            and {levelCounts.mod} moderate cases shown above are a simulated
            illustration of how the model would rank cases — not a real,
            current caseload.
          </Footnote>
        </Card>

        <Card>
          <div className="mb-2.5 text-[13px] font-semibold text-text-hi">
            Methodology — what this model is grounded in
          </div>
          <p className="mb-3 text-[12.5px] leading-relaxed text-text-mid">
            <b className="text-text-hi">{triageMethodologyNote.studySource}:</b>{' '}
            {triageMethodologyNote.finding}
          </p>
          <div className="mb-2 text-[10.5px] font-medium tracking-wide text-text-low uppercase">
            Risk factors
          </div>
          <ul className="mb-3 flex flex-wrap gap-1.5">
            {triageMethodologyNote.riskFactors.map((factor) => (
              <li
                key={factor}
                className="rounded-md bg-coral-dim px-2.5 py-0.5 font-mono text-[11px] text-[#ffb199]"
              >
                {factor}
              </li>
            ))}
          </ul>
          <div className="mb-2 text-[10.5px] font-medium tracking-wide text-text-low uppercase">
            Protective factors
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {triageMethodologyNote.protectiveFactors.map((factor) => (
              <li
                key={factor}
                className="rounded-md bg-teal-dim px-2.5 py-0.5 font-mono text-[11px] text-[#8fe9cd]"
              >
                {factor}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>

    <p className="mt-7 text-[11px] text-text-low">
      See the{' '}
      <a href="/sources" className="text-text-mid underline">
        Sources
      </a>{' '}
      page for which indicators are drawn from public official data versus
      simulated for this prototype.
    </p>
  </div>
)
