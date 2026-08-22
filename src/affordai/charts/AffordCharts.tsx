import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ForecastPoint, RiskFactor, VulnerabilityPoint } from '@/affordai/data/types'

// Copied verbatim from src/shared/charts/RadarCharts.tsx so both products render
// identically. Radar's wrappers themselves are not reused: that module has no
// counterpart for the chart shapes this section needs.
const GRID_COLOR = '#22304a'
const TICK_STYLE = { fill: '#9aa7c2', fontSize: 11 }
const tooltipStyle = {
  background: '#1c2740',
  border: '1px solid #2a3654',
  borderRadius: 8,
  color: '#eef1f7',
  fontSize: 12,
}

/** Tier semantics, resolved from the shared tokens in src/index.css. */
export const AFFORD_CHART_COLORS = {
  stable: '#2dd4a7',
  emerging: '#e8a53d',
  highRisk: '#ff6b4a',
  projected: '#5b8def',
} as const

export const VulnerabilityStackChart = ({ data }: { data: VulnerabilityPoint[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} />
      <Area
        type="monotone"
        stackId="tier"
        dataKey="highRisk"
        name="High risk"
        stroke={AFFORD_CHART_COLORS.highRisk}
        fill={AFFORD_CHART_COLORS.highRisk}
        fillOpacity={0.22}
        strokeWidth={2}
      />
      <Area
        type="monotone"
        stackId="tier"
        dataKey="emerging"
        name="Emerging vulnerability"
        stroke={AFFORD_CHART_COLORS.emerging}
        fill={AFFORD_CHART_COLORS.emerging}
        fillOpacity={0.18}
        strokeWidth={2}
      />
      <Area
        type="monotone"
        stackId="tier"
        dataKey="stable"
        name="Stable"
        stroke={AFFORD_CHART_COLORS.stable}
        fill={AFFORD_CHART_COLORS.stable}
        fillOpacity={0.1}
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
)

export const ForecastLineChart = ({ data }: { data: ForecastPoint[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} />
      <Line
        type="monotone"
        dataKey="historical"
        name="Historical"
        stroke={AFFORD_CHART_COLORS.projected}
        strokeWidth={2}
        dot={{ r: 3 }}
        connectNulls
      />
      <Line
        type="monotone"
        dataKey="projected"
        name="Projected"
        stroke={AFFORD_CHART_COLORS.highRisk}
        strokeDasharray="6 4"
        strokeWidth={2}
        dot={{ r: 3 }}
        connectNulls
      />
    </LineChart>
  </ResponsiveContainer>
)

export const FactorBarChart = ({ data }: { data: RiskFactor[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={data}
      layout="vertical"
      margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
    >
      <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
      <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} unit="%" />
      <YAxis
        type="category"
        dataKey="label"
        tick={TICK_STYLE}
        axisLine={false}
        tickLine={false}
        width={140}
      />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
      <Bar
        dataKey="contribution"
        name="Contribution"
        fill={AFFORD_CHART_COLORS.projected}
        radius={4}
        barSize={14}
      />
    </BarChart>
  </ResponsiveContainer>
)

export const BeforeAfterChart = ({
  data,
}: {
  data: { label: string; before: number; after: number }[]
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
      <Bar
        dataKey="before"
        name="Before"
        fill={AFFORD_CHART_COLORS.highRisk}
        radius={4}
        barSize={22}
      />
      <Bar
        dataKey="after"
        name="After"
        fill={AFFORD_CHART_COLORS.stable}
        radius={4}
        barSize={22}
      />
    </BarChart>
  </ResponsiveContainer>
)

/**
 * The household ledger. Twenty-four monthly points, so ticks are thinned to
 * every third month and per-point dots are dropped — at this density they
 * merge into a band and hide the trend the chart exists to show.
 */
export const ScoreTimelineChart = ({
  data,
}: {
  data: { label: string; income: number; rent: number; score: number }[]
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis
        dataKey="label"
        tick={TICK_STYLE}
        axisLine={false}
        tickLine={false}
        interval={2}
      />
      <YAxis yAxisId="money" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis
        yAxisId="score"
        orientation="right"
        domain={[0, 100]}
        tick={TICK_STYLE}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip contentStyle={tooltipStyle} />
      <Line
        yAxisId="money"
        type="monotone"
        dataKey="income"
        name="Monthly income"
        stroke={AFFORD_CHART_COLORS.stable}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 4 }}
      />
      <Line
        yAxisId="money"
        type="monotone"
        dataKey="rent"
        name="Monthly rent"
        stroke={AFFORD_CHART_COLORS.emerging}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 4 }}
      />
      <Line
        yAxisId="score"
        type="monotone"
        dataKey="score"
        name="Affordability score"
        stroke={AFFORD_CHART_COLORS.highRisk}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 4 }}
      />
    </LineChart>
  </ResponsiveContainer>
)
