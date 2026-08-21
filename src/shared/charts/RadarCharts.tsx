import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

export const IndicatorAreaChart = ({
  data,
  dataKey,
  xKey = 'month',
  color,
}: {
  data: Record<string, string | number>[]
  dataKey: string
  xKey?: string
  color: string
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} vertical={false} />
      <XAxis dataKey={xKey} tick={TICK_STYLE} axisLine={false} tickLine={false} />
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

interface SubgroupChangeDatum {
  subgroup: string
  changePercent: number
  source: string
}

const CHANGE_UP_COLOR = '#ff6b4a' // coral — rising, a warning sign
const CHANGE_DOWN_COLOR = '#2dd4a7' // teal — falling

export const SubgroupChangeBarChart = ({
  data,
  onSelect,
}: {
  data: SubgroupChangeDatum[]
  onSelect?: (item: SubgroupChangeDatum) => void
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
      <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
      <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} unit="%" />
      <YAxis
        type="category"
        dataKey="subgroup"
        tick={TICK_STYLE}
        axisLine={false}
        tickLine={false}
        width={110}
      />
      <Tooltip
        contentStyle={tooltipStyle}
        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}%`, 'Change vs 2024']}
      />
      <Bar
        dataKey="changePercent"
        radius={4}
        barSize={16}
        onClick={(entry) => onSelect?.(entry as unknown as SubgroupChangeDatum)}
        cursor="pointer"
      >
        {data.map((entry) => (
          <Cell key={entry.subgroup} fill={entry.changePercent < 0 ? CHANGE_DOWN_COLOR : CHANGE_UP_COLOR} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
)
