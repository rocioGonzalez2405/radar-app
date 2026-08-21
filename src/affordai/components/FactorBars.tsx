import { FactorBarChart } from '@/affordai/charts/AffordCharts'
import type { RiskFactor } from '@/affordai/data/types'

export const FactorBars = ({
  factors,
  title = 'Main contributing factors',
}: {
  factors: RiskFactor[]
  title?: string
}) => (
  <div>
    <div className="mb-2 font-mono text-[11px] tracking-wide text-text-low uppercase">
      {title}
    </div>
    <div style={{ height: factors.length * 34 + 32 }}>
      <FactorBarChart data={factors} />
    </div>
    <ol className="mt-1 flex flex-col gap-1">
      {factors.map((factor, index) => (
        <li
          key={factor.label}
          className="flex items-baseline justify-between gap-3 text-[12px]"
        >
          <span className="text-text-mid">
            {index + 1}. {factor.label}
          </span>
          <span className="font-mono font-semibold text-text-hi">
            {factor.contribution}%
          </span>
        </li>
      ))}
    </ol>
  </div>
)
