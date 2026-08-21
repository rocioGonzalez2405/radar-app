import { useMemo, useState } from 'react'
import { Card, SectionHead, Footnote } from '@/shared/ui/Card'
import { simulatorScenarios } from '@/shared/data/radarData'

// Same illustrative formula used across the prototype's mockups:
// gap improves with more beds and, more slowly, with more childcare spend;
// relapse reduction scales with the childcare share of the budget.
const projectGap = (beds: number, childcarePct: number) =>
  Math.round(-55 + beds * 2.1 + childcarePct * 0.03)

const projectRelapseReduction = (childcarePct: number) =>
  Math.round(childcarePct * 0.3)

export const SimulatorPage = () => {
  const [beds, setBeds] = useState(7)
  const [childcarePct, setChildcarePct] = useState(50)

  const gap = useMemo(() => projectGap(beds, childcarePct), [beds, childcarePct])
  const relapseReduction = useMemo(
    () => projectRelapseReduction(childcarePct),
    [childcarePct],
  )

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1.5 font-mono text-[11px] tracking-wide text-coral uppercase">
          Decision support
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">
          Test a decision before you spend the budget
        </h1>
        <p className="mt-1 max-w-xl text-[13px] text-text-mid">
          Move the sliders to see how a fixed $150,000 allocation changes the
          projected family-bed gap and the relapse rate — before committing
          the money.
        </p>
      </div>

      <div className="mb-7">
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-3.5">
            <label htmlFor="beds" className="min-w-[190px] text-xs text-text-mid">
              New family beds
            </label>
            <input
              id="beds"
              type="range"
              min={0}
              max={15}
              step={1}
              value={beds}
              onChange={(e) => setBeds(Number(e.target.value))}
              className="min-w-[140px] flex-1"
            />
            <div className="min-w-10 text-right font-mono text-[13px] text-text-hi">
              {beds}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3.5">
            <label htmlFor="childcare" className="min-w-[190px] text-xs text-text-mid">
              % of budget to subsidized childcare
            </label>
            <input
              id="childcare"
              type="range"
              min={0}
              max={100}
              step={10}
              value={childcarePct}
              onChange={(e) => setChildcarePct(Number(e.target.value))}
              className="min-w-[140px] flex-1"
            />
            <div className="min-w-10 text-right font-mono text-[13px] text-text-hi">
              {childcarePct}%
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-7 border-t border-line pt-4">
            <div>
              <div className="mb-1 text-[11px] text-text-low">
                Projected gap, December
              </div>
              <div className="font-mono text-[22px] font-semibold text-teal">
                {gap}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-text-low">
                Relapse-rate reduction
              </div>
              <div className="font-mono text-[22px] font-semibold text-teal">
                {relapseReduction}%
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-text-low">
                Est. cost of this mix
              </div>
              <div className="font-mono text-[22px] font-semibold text-blue">
                $150,000
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <SectionHead
          title="Three scenarios compared"
          note="Same $150,000 budget, different mix"
        />
        <Card tight>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line">
                {['Scenario', 'Family beds', 'Childcare %', 'Projected gap, Dec', 'Relapse reduction', 'Best for'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-2.5 py-2 text-left text-[10.5px] font-medium tracking-wide text-text-low uppercase"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {simulatorScenarios.map((s) => (
                <tr key={s.name} className="border-b border-line-soft last:border-b-0">
                  <td className="px-2.5 py-2.5 font-medium text-text-hi">{s.name}</td>
                  <td className="px-2.5 py-2.5 text-text-mid">{s.beds}</td>
                  <td className="px-2.5 py-2.5 text-text-mid">{s.childcarePct}%</td>
                  <td className="px-2.5 py-2.5 text-text-mid">{s.gap}</td>
                  <td className="px-2.5 py-2.5 text-text-mid">{s.relapseReduction}%</td>
                  <td className="px-2.5 py-2.5 text-text-mid">{s.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Footnote>
          <b>Reading it —</b> there's no universally "right" mix — it depends
          on whether the organization's priority this cycle is reducing
          today's shortfall (Scenario A) or reducing how many people fall
          back into homelessness after being helped (Scenario B). The
          simulator above lets you find any point between them.
        </Footnote>
      </div>
    </div>
  )
}
