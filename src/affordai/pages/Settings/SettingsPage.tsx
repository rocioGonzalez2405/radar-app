import { Card, Footnote, SectionHead } from '@/shared/ui/Card'
import { MetricRow } from '@/affordai/components/MetricRow'
import { topBandBySize, topBandVersusTier } from '@/affordai/data/selectors'
import { AUDIT_KEYS, FEATURE_LABELS } from '@/affordai/model/features'
import type { PredictiveFeatureKey } from '@/affordai/model/features'
import { BASELINE, COEFFICIENTS, HORIZON_DAYS, INTERCEPT } from '@/affordai/model/riskModel'
import { CYCLE_DAYS, DEMO_POLICY } from '@/affordai/model/subsidyEngine'

/**
 * Everything on this page is read from the model's own exports at render time
 * and mapped over. Nothing is transcribed.
 *
 * That is not a style preference. The coefficients are hand-set and have already
 * been changed once — a feature was dropped and the intercept re-centred — and a
 * transcribed weight survives that change looking authoritative while being
 * wrong. A page whose job is to let an administrator see what the model actually
 * does cannot contain a second, stale copy of the model.
 *
 * The one exception is BEFORE_REMOVAL below, and it is an exception precisely
 * because the state it describes no longer exists in any module to be read.
 */

/**
 * HISTORICAL RECORD — the model as it stood before household size became
 * audit-only. These figures cannot be computed, because the code that produced
 * them is gone; every "now" figure shown beside them is measured at render time.
 */
const BEFORE_REMOVAL = {
  /** The standalone weight household size used to carry. */
  sizeCoefficient: 1.2,
  intercept: -7,
  /** Households the top band paid under that model. */
  topBand: 741,
  /** The highest probability any one- or two-person household could reach. */
  smallCohortCeiling: 0.65,
  /** How many of them cleared the top band's line. None. */
  smallCohortInBand: 0,
  /** Top-band members per household size. */
  topBandBySize: { 1: 0, 2: 0, 3: 22, 4: 72, 5: 136, 6: 215, 7: 296 } as Record<
    number,
    number | undefined
  >,
}

const headerClass = 'py-2 font-mono text-[11px] tracking-wide text-text-low uppercase'
const cell = 'py-2.5 text-[13px]'
const numCell = 'py-2.5 text-right font-mono text-[13px]'

const share = (part: number, whole: number) =>
  whole === 0 ? '—' : `${((part / whole) * 100).toFixed(1)}%`

export const SettingsPage = () => {
  // (a) The coefficient table, mapped from the model's own export.
  const weighted = (Object.entries(COEFFICIENTS) as [PredictiveFeatureKey, number][])
    .map(([key, weight]) => ({
      key,
      label: FEATURE_LABELS[key],
      weight,
      baseline: BASELINE[key],
    }))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))

  const auditOnly = AUDIT_KEYS.map((key) => ({
    key,
    label: FEATURE_LABELS[key],
    baseline: BASELINE[key],
  }))

  const featureCount = Object.keys(COEFFICIENTS).length

  // (b) Fairness. Both claims are checked against the live model, not asserted.
  const absWeights = weighted.map((row) => Math.abs(row.weight))
  const minAbs = Math.min(...absWeights)
  const maxAbs = Math.max(...absWeights)
  const smallest = weighted.filter((row) => Math.abs(row.weight) === minAbs)
  const areaIsSmallest = smallest.length === 1 && smallest[0].key === 'areaPressure'
  const areaWeight = COEFFICIENTS.areaPressure
  const weightRatio = areaWeight === 0 ? null : Math.round(maxAbs / Math.abs(areaWeight))

  const sizeIsWeighted = Object.keys(COEFFICIENTS).includes('householdSize')
  const sizeIsAudited = (AUDIT_KEYS as readonly string[]).includes('householdSize')
  const recentring = BEFORE_REMOVAL.sizeCoefficient * BASELINE.householdSize

  const comparison = topBandVersusTier()
  const bandLine = comparison.minRisk.toFixed(2)
  const cohorts = topBandBySize()
  const smallCohorts = cohorts.filter((cohort) => cohort.size <= 2)
  const smallTotal = smallCohorts.reduce((sum, cohort) => sum + cohort.households, 0)
  const smallInBand = smallCohorts.reduce((sum, cohort) => sum + cohort.inTopBand, 0)
  const smallCeiling = Math.max(...smallCohorts.map((cohort) => cohort.maxRisk))
  const smallestCohort = cohorts[0]
  const largestCohort = cohorts[cohorts.length - 1]
  const largestBefore = BEFORE_REMOVAL.topBandBySize[largestCohort.size]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-text-mid">
          What the model is, what it weights, what it deliberately does not weight,
          and the policy that turns a probability into a recommendation. Every figure
          on this page is read from the running model.
        </p>
      </div>

      <div className="rounded-lg border border-line-soft bg-ink-2 px-3.5 py-2.5">
        <p className="text-[13px] text-text-mid">
          <b className="text-text-hi">Read-only.</b> Model configuration is managed by
          the program's data team. Changing a weight re-scores the whole population and
          is outside this console — so there are no inputs here, rather than inputs that
          do nothing.
        </p>
      </div>

      <Card>
        <SectionHead
          title="Risk model"
          note={`Logistic regression · ${featureCount} weighted features`}
        />
        <p className="mb-3 text-[13px] leading-relaxed text-text-mid">
          <span className="font-mono text-text-hi">
            p = σ(intercept + Σ weight × feature)
          </span>
          . In a linear model a feature's contribution to an explanation is exactly{' '}
          <span className="font-mono">weight × (feature − baseline)</span>, so the
          factor bars elsewhere in the console are not an approximation of this model —
          they are this model, rearranged. Nothing can drift between the two.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className={headerClass}>Feature</th>
                <th className={`${headerClass} text-right`}>Weight</th>
                <th className={`${headerClass} text-right`}>Baseline</th>
              </tr>
            </thead>
            <tbody>
              {weighted.map((row) => (
                <tr key={row.key} className="border-b border-line-soft">
                  <td className={`${cell} text-text-hi`}>{row.label}</td>
                  <td className={`${numCell} font-semibold`}>{row.weight.toFixed(1)}</td>
                  <td className={`${numCell} text-text-mid`}>{row.baseline.toFixed(3)}</td>
                </tr>
              ))}
              {auditOnly.map((row) => (
                <tr key={row.key} className="border-b border-line-soft">
                  <td className={`${cell} text-text-mid`}>
                    {row.label}
                    <span className="ml-2 font-mono text-[11px] text-blue">
                      audit only
                    </span>
                  </td>
                  <td className={`${numCell} text-text-low`}>not weighted</td>
                  <td className={`${numCell} text-text-mid`}>{row.baseline.toFixed(3)}</td>
                </tr>
              ))}
              <tr>
                <td className={`${cell} text-text-hi`}>Intercept</td>
                <td className={`${numCell} font-semibold`}>{INTERCEPT}</td>
                <td className={numCell} />
              </tr>
            </tbody>
          </table>
        </div>
        <Footnote>
          Sorted by absolute weight, largest first. The weights are{' '}
          <b>hand-set, not fitted</b>: the population is synthetic, so there is no
          ground truth to fit against, and they encode a direction and a relative
          ordering rather than a measured effect size. The <b>baseline</b> is the
          reference household every explanation is measured against — roughly the
          population average — so a contribution answers "why is this household
          different from a typical one". It shifts attributions only and has no effect
          on any probability. Audit-only features are measured and displayed but never
          weighted.
        </Footnote>
      </Card>

      <Card className="border-blue/40">
        <SectionHead
          title="Fairness"
          note="Both claims checked against the running model"
        />

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-line-soft bg-ink-2 p-3.5">
            <div className="mb-1.5 font-mono text-[11px] font-semibold tracking-wide text-blue uppercase">
              Area carries the smallest weight, on purpose
            </div>
            <p className="text-[13px] leading-relaxed text-text-mid">
              <b className="text-text-hi">{FEATURE_LABELS.areaPressure}</b> is kept
              deliberately small. Area is a proxy for social characteristics, and a
              large weight there would launder that proxy into a funding decision —
              the model would be paying households for where they live rather than for
              what is happening to their ledger.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-text-mid">
              {areaIsSmallest ? (
                <>
                  <b className="text-teal">Checked at render time:</b> it is the
                  smallest of the {featureCount} weights, at{' '}
                  <span className="font-mono">{areaWeight.toFixed(1)}</span>
                  {weightRatio === null ? null : (
                    <>
                      {' '}
                      — the largest weight in the model is{' '}
                      <span className="font-mono">{weightRatio}×</span> bigger
                    </>
                  )}
                  . This sentence is a measurement, not a promise: if a future weight
                  change made area anything other than the smallest, this card would
                  say so instead.
                </>
              ) : (
                <>
                  <b className="text-coral">Checked at render time, and it is not:</b>{' '}
                  {FEATURE_LABELS.areaPressure} currently carries{' '}
                  <span className="font-mono">{areaWeight.toFixed(1)}</span>, while{' '}
                  {smallest.map((row) => row.label).join(', ')} carries{' '}
                  <span className="font-mono">{minAbs.toFixed(1)}</span>. The design
                  intent above no longer matches the model, and that needs explaining
                  before it ships.
                </>
              )}
            </p>
          </div>

          <div className="rounded-lg border border-line-soft bg-ink-2 p-3.5">
            <div className="mb-1.5 font-mono text-[11px] font-semibold tracking-wide text-blue uppercase">
              Household size was removed from the model
            </div>

            {sizeIsWeighted ? (
              <p className="text-[13px] leading-relaxed text-text-mid">
                <b className="text-coral">Not yet applied.</b>{' '}
                {FEATURE_LABELS.householdSize} still carries a weight of{' '}
                <span className="font-mono">
                  {(COEFFICIENTS as Record<string, number>).householdSize.toFixed(1)}
                </span>{' '}
                in the running model, on top of the essential-spending channel it
                already flows through. While that stands, no household of one or two
                people can reach the top support band at any input: their probability
                is capped below the <span className="font-mono">{bandLine}</span> line
                by arithmetic rather than by assessment. The removal described below is
                the intended state, not the current one.
              </p>
            ) : (
              <>
                <p className="text-[13px] leading-relaxed text-text-mid">
                  {FEATURE_LABELS.householdSize} used to carry a standalone weight of{' '}
                  <span className="font-mono">{BEFORE_REMOVAL.sizeCoefficient}</span> on
                  top of the essential-spending channel it already flows through, and
                  the consequence was not subtle:{' '}
                  <b className="text-text-hi">
                    {BEFORE_REMOVAL.smallCohortInBand} of the{' '}
                    {smallTotal.toLocaleString('en-US')} households of one or two people
                    could reach the top support band at all
                  </b>
                  . Their probability topped out at{' '}
                  <span className="font-mono">{BEFORE_REMOVAL.smallCohortCeiling}</span>{' '}
                  against a <span className="font-mono">{bandLine}</span> line —
                  excluded by arithmetic rather than by assessment. It is now{' '}
                  {sizeIsAudited ? 'audit-only' : 'unweighted'}: measured and displayed,
                  never weighted.
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-text-mid">
                  Its economic content is still fully modelled, through{' '}
                  <b className="text-text-hi">{FEATURE_LABELS.essentialsBurden}</b>: more
                  people, higher essential spending, a larger monthly gap. That path is
                  explicit and measurable and carries a weight of{' '}
                  <span className="font-mono">
                    {COEFFICIENTS.essentialsBurden.toFixed(1)}
                  </span>
                  . What was dropped is the second, unevidenced claim that size implies
                  extra risk beyond the costs it actually creates.
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-text-mid">
                  <b className="text-text-hi">This was a fix, not a rescale.</b> The
                  intercept moved from{' '}
                  <span className="font-mono">{BEFORE_REMOVAL.intercept.toFixed(1)}</span>{' '}
                  to <span className="font-mono">{INTERCEPT}</span> — exactly the weight
                  the baseline household used to carry through the dropped term,{' '}
                  <span className="font-mono">
                    {BEFORE_REMOVAL.sizeCoefficient} × {BASELINE.householdSize} ={' '}
                    {recentring.toFixed(3)}
                  </span>
                  . A typical household's probability is therefore unchanged, so the
                  removal shows up as a change in <i>who</i> ranks highest rather than
                  as every number in the console sliding down at once.
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                  <div className="rounded-md border border-line-soft bg-ink-1 px-3 py-2">
                    <div className="font-mono text-[10.5px] tracking-wide text-text-low uppercase">
                      Model — fixed
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-text-mid">
                      Nothing in the arithmetic caps a small household any more. The
                      ceiling for one- and two-person households moved from{' '}
                      <span className="font-mono">
                        {BEFORE_REMOVAL.smallCohortCeiling}
                      </span>{' '}
                      to{' '}
                      <span className="font-mono text-teal">
                        {smallCeiling.toFixed(2)}
                      </span>
                      , and{' '}
                      <span className="font-mono text-teal">{smallInBand}</span> of them
                      now clear the <span className="font-mono">{bandLine}</span> line.
                      A test proves this structurally rather than through the
                      population: it constructs a single-person household at an extreme
                      rent burden, a sharp six-month income loss, and half its recent
                      months underwater, and confirms the model clears the line. The
                      old model could not reach it at <i>any</i> input.
                    </p>
                  </div>
                  <div className="rounded-md border border-line-soft bg-ink-1 px-3 py-2">
                    <div className="font-mono text-[10.5px] tracking-wide text-text-low uppercase">
                      Data coverage — not fixed
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-text-mid">
                      Households of {smallestCohort.size} still top out at{' '}
                      <span className="font-mono text-amber">
                        {smallestCohort.maxRisk.toFixed(2)}
                      </span>
                      , and{' '}
                      <span className="font-mono text-amber">
                        {smallestCohort.inTopBand}
                      </span>{' '}
                      of them reach the band. That is a property of this dataset, not of
                      the model: the generator caps rent burden at its area's maximum
                      and income at a fraction of the area median, so it contains no
                      one-person household extreme enough. The honest fix is to widen
                      the generator's tails — never to touch a coefficient to make a
                      cohort appear.
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-[13px] leading-relaxed text-text-mid">
                  What is left of size's influence now runs entirely through the
                  legitimate channel. One person's essential spending sits well below the
                  population baseline, so their {FEATURE_LABELS.essentialsBurden} is low
                  — the model correctly seeing that one person eats less, rather than a
                  standalone term deciding that a small household is safe.
                </p>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line">
                        <th className={headerClass}>People</th>
                        <th className={`${headerClass} text-right`}>Households</th>
                        <th className={`${headerClass} text-right`}>Share of pop.</th>
                        <th className={`${headerClass} text-right`}>
                          In top band ({comparison.bandPercent}%)
                        </th>
                        <th className={`${headerClass} text-right`}>Share of band</th>
                        <th className={`${headerClass} text-right`}>Max probability</th>
                        <th className={`${headerClass} text-right`}>Band before</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohorts.map((cohort) => (
                        <tr key={cohort.size} className="border-b border-line-soft">
                          <td className={`${cell} text-text-hi`}>{cohort.size}</td>
                          <td className={`${numCell} text-text-mid`}>
                            {cohort.households.toLocaleString('en-US')}
                          </td>
                          <td className={`${numCell} text-text-mid`}>
                            {share(cohort.households, comparison.population)}
                          </td>
                          <td className={`${numCell} font-semibold`}>
                            {cohort.inTopBand}
                          </td>
                          <td className={`${numCell} text-text-mid`}>
                            {share(cohort.inTopBand, comparison.inBand)}
                          </td>
                          <td className={`${numCell} text-text-mid`}>
                            {cohort.maxRisk.toFixed(2)}
                          </td>
                          <td className={`${numCell} text-text-low`}>
                            {BEFORE_REMOVAL.topBandBySize[cohort.size] ?? '—'}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className={`${cell} font-semibold`}>All</td>
                        <td className={`${numCell} font-semibold`}>
                          {comparison.population.toLocaleString('en-US')}
                        </td>
                        <td className={numCell} />
                        <td className={`${numCell} font-semibold`}>
                          {comparison.inBand}
                        </td>
                        <td className={numCell} />
                        <td className={numCell} />
                        <td className={`${numCell} text-text-low`}>
                          {BEFORE_REMOVAL.topBand}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Footnote>
                  <b>Band before</b> is the one column here that is not measured: it
                  records the distribution under the removed model, which no longer
                  exists in code to compute. Every other figure in this table is counted
                  at render time. The largest cohort ({largestCohort.size} people) holds{' '}
                  {share(largestCohort.inTopBand, comparison.inBand)} of the paid band
                  against {share(largestCohort.households, comparison.population)} of the
                  population, down from{' '}
                  {largestBefore === undefined
                    ? '—'
                    : share(largestBefore, BEFORE_REMOVAL.topBand)}{' '}
                  of a larger band before the removal. That remaining gap is correct
                  rather than something to apologise for: a large family on the same
                  income genuinely carries a bigger monthly shortfall, and that
                  shortfall is now the <i>only</i> route by which size reaches the
                  result. A flat distribution across sizes would be the suspicious
                  outcome, not this one.
                </Footnote>
              </>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <SectionHead title="Horizon and cycle" note="Two different concepts" />
        <MetricRow label="Prediction horizon" value={`${HORIZON_DAYS} days`} />
        <MetricRow label="Award duration and smoothing period" value={`${CYCLE_DAYS} days`} />
        <p className="mt-3 text-[13px] leading-relaxed text-text-mid">
          <b className="text-text-hi">
            The {HORIZON_DAYS}-day horizon is a declared interpretation, not a fitted
            parameter.
          </b>{' '}
          The model has no time term. It reads a household's present position and its
          six- and twelve-month slopes and returns one number; set this constant to 30
          and every probability in the console stays bit-identical. What justifies the
          label is the <i>input window</i> — trends measured over six and twelve months
          — not the arithmetic. Fitting a horizon would need labelled historical
          outcomes, and a synthetic population cannot supply them, so the honest
          statement is the one above rather than an implied claim that the model was
          trained against a {HORIZON_DAYS}-day outcome.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-text-mid">
          <b className="text-text-hi">The {CYCLE_DAYS}-day cycle is a separate thing</b>{' '}
          — how long an award runs before it is re-evaluated, and the period the
          per-cycle change cap smooths across. The horizon is how far ahead the
          probability looks; the cycle is the program's operating rhythm. They were
          briefly the same constant doing both jobs, which is exactly how a model
          parameter and an administrative one get confused for each other.
        </p>
      </Card>

      <Card>
        <SectionHead
          title="Subsidy policy"
          note={`${DEMO_POLICY.bands.length} bands · demonstration values`}
        />
        <p className="mb-3 text-[13px] leading-relaxed text-text-mid">
          The policy is deliberately separate from the model. The model estimates a
          probability; it never decides a benefit. Everything that turns a probability
          into money lives here, as data, where someone who has never seen the model can
          read it and argue with it.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className={headerClass}>Probability at least</th>
                <th className={`${headerClass} text-right`}>Band</th>
                <th className={headerClass}>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_POLICY.bands.map((band) => (
                <tr key={band.minRisk} className="border-b border-line-soft">
                  <td className={`${cell} font-mono text-text-hi`}>
                    {band.minRisk.toFixed(2)}
                  </td>
                  <td className={`${numCell} font-semibold`}>{band.percent}%</td>
                  <td className={`${cell} text-text-mid`}>{band.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <MetricRow label="Policy ceiling" value={`${DEMO_POLICY.maxPercent}%`} />
          <MetricRow label="Award duration" value={`${DEMO_POLICY.durationDays} days`} />
          <MetricRow
            label="Largest change per cycle"
            value={`${DEMO_POLICY.maxChangePerCycle} points`}
          />
        </div>
        <Footnote>
          <b>These percentages are an illustration.</b> Real thresholds would come from
          specialists, an actual budget, regulation, and pilot results. They are not a
          policy recommendation, and the bands are the first thing that should be
          replaced in a real deployment — which is precisely why they are data in a
          single file rather than arithmetic spread through the model.
        </Footnote>
      </Card>

      <Card>
        <SectionHead
          title="From band to recommendation"
          note="Band → need → ceiling → smoothing"
        />
        <p className="text-[13px] leading-relaxed text-text-mid">
          A band percentage is not what a household receives. Three steps sit between
          them, in this order, and each one is a rule rather than a model output.
        </p>
        <ol className="mt-3 flex flex-col gap-3">
          <li className="text-[13px] leading-relaxed text-text-mid">
            <b className="text-text-hi">Need modulation.</b> The band is scaled by how
            much of a shortfall the household actually has — rent plus essential
            spending minus income for the current month, floored at zero — measured
            against its monthly rent. A household already underwater receives the band
            and a little over; one that still balances receives a reduced, preventive
            version of the same band. The multiplier never reaches zero, because a
            household with no gap yet and deteriorating trends is the case this system
            exists to catch early. Its floor sits close to 1 on purpose: a policy that
            advertises a band and then pays a fraction of it to everyone has not
            modulated the band, it has quietly replaced it.
          </li>
          <li className="text-[13px] leading-relaxed text-text-mid">
            <b className="text-text-hi">Policy ceiling.</b> Nothing this engine returns
            exceeds {DEMO_POLICY.maxPercent}%, whatever the bands and the need
            multiplier work out to.
          </li>
          <li className="text-[13px] leading-relaxed text-text-mid">
            <b className="text-text-hi">Smoothing.</b> An <i>existing</i> award may move
            at most {DEMO_POLICY.maxChangePerCycle} percentage points in one{' '}
            {DEMO_POLICY.durationDays}-day cycle, in either direction, so a household a
            dollar over a band boundary does not jump on one unusual month and a
            household with one good month does not lose its support before the recovery
            is real. A household <i>entering</i> the program is exempt and starts at its
            assessed level: it has nothing to change from, and ramping it up over
            several cycles would delay exactly the early intervention the system exists
            to make.
          </li>
        </ol>
        <Footnote>
          The recommendation records which of these bound it, so a caseworker can see
          whether a figure came from the band, the ceiling, or the smoothing cap. The
          output is a <b>recommendation</b> in every case — a human approves it, and no
          automated prediction controls a payment on its own.
        </Footnote>
      </Card>

      <Card>
        <SectionHead
          title="Two different meanings of high risk"
          note="Both counted at render time"
        />
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <div className="rounded-lg border border-line-soft bg-ink-2 px-3.5 py-3">
            <div className="font-mono text-[10.5px] tracking-wide text-text-low uppercase">
              High-risk tier
            </div>
            <div className="mt-1 font-mono text-xl font-semibold text-amber">
              {comparison.inTier.toLocaleString('en-US')}
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-text-mid">
              A capacity-based percentile cut over the descriptive affordability score:
              a fixed number of places, filled by ranking today's snapshot.
            </p>
          </div>
          <div className="rounded-lg border border-line-soft bg-ink-2 px-3.5 py-3">
            <div className="font-mono text-[10.5px] tracking-wide text-text-low uppercase">
              Top subsidy band
            </div>
            <div className="mt-1 font-mono text-xl font-semibold text-coral">
              {comparison.inBand.toLocaleString('en-US')}
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-text-mid">
              Model probability of at least{' '}
              <span className="font-mono">{bandLine}</span>, which the policy answers
              with {comparison.bandPercent}%. No capacity limit — as many households as
              clear the line.
            </p>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-text-mid">
          <b className="text-text-hi">
            {comparison.inBoth.toLocaleString('en-US')} households are in both.
          </b>{' '}
          The console has always shown these two numbers without saying they measure
          different things, and they are not two estimates of one quantity: the tier
          ranks how strained a household looks <i>today</i> and hands out a fixed number
          of places, while the band asks what the model expects over the{' '}
          {HORIZON_DAYS} days ahead and has no ceiling on how many qualify. A household
          that looks strained but stable stays out of the band; a household that looks
          comfortable while every trend turns against it clears the band without ever
          entering the tier. That second case is the one this product exists for.
        </p>
      </Card>
    </div>
  )
}
