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

const GRID_COLOR = '#22304a'
const TICK_STYLE = { fill: '#9aa7c2', fontSize: 11 }

const tooltipStyle = {
  background: '#1c2740',
  border: '1px solid #2a3654',
  borderRadius: 8,
  color: '#eef1f7',
  fontSize: 12,
}

interface TrendPoint {
  year: string
  historical: number | null
  projected: number | null
}

export const TrendForecastChart = ({ data }: { data: TrendPoint[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey="year" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} />
      <Area
        type="monotone"
        dataKey="historical"
        stroke="#5b8def"
        fill="#5b8def"
        fillOpacity={0.12}
        strokeWidth={2}
        connectNulls
      />
      <Area
        type="monotone"
        dataKey="projected"
        stroke="#ff6b4a"
        strokeDasharray="6 4"
        fill="transparent"
        strokeWidth={2}
        connectNulls
      />
    </AreaChart>
  </ResponsiveContainer>
)

export const IndicatorAreaChart = ({
  data,
  dataKey,
  color,
}: {
  data: Record<string, string | number>[]
  dataKey: string
  color: string
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} />
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        fill={color}
        fillOpacity={0.12}
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
)

export const HorizontalBarChart = <T extends object>({
  data,
  categoryKey,
  bars,
}: {
  data: T[]
  categoryKey: string
  bars: { dataKey: string; color: string }[]
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
      <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis
        type="category"
        dataKey={categoryKey}
        tick={TICK_STYLE}
        axisLine={false}
        tickLine={false}
        width={110}
      />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
      {bars.map((bar) => (
        <Bar key={bar.dataKey} dataKey={bar.dataKey} fill={bar.color} radius={4} barSize={14} />
      ))}
    </BarChart>
  </ResponsiveContainer>
)

export const ThirtyDayLineChart = ({
  data,
}: {
  data: { day: string; criticalCases: number; bedCapacity: number }[]
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey="day" tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={tooltipStyle} />
      <Line type="monotone" dataKey="criticalCases" stroke="#ff6b4a" strokeWidth={2} dot={{ r: 3 }} />
      <Line
        type="monotone"
        dataKey="bedCapacity"
        stroke="#5b8def"
        strokeDasharray="6 4"
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
)
