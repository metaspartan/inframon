import * as React from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChartProps {
  data: number[]
  timePoints: string[]
  title: string
  color: string
  unit: string
}

const timeRanges = [
  { value: "1m", label: "1 minute" },
  { value: "5m", label: "5 minutes" },
  { value: "15m", label: "15 minutes" },
  { value: "30m", label: "30 minutes" },
  { value: "1h", label: "1 hour" },
]

export function Chart({ data, timePoints, title, color, unit }: ChartProps) {
  const [timeRange, setTimeRange] = React.useState("5m")

  const getDataPointsCount = (range: string) => {
    switch (range) {
      case "5m": return 300;
      case "15m": return 900;
      case "30m": return 1800;
      case "1h": return 3600;
      default: return 300;
    }
  }

  const chartData = React.useMemo(() => {
    const dataPointsCount = getDataPointsCount(timeRange)
    return timePoints.slice(-dataPointsCount).map((time, index) => ({
      time,
      value: data[data.length - dataPointsCount + index] || 0,
    }))
  }, [data, timePoints, timeRange, title])

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{title}</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="w-full aspect-[16/9] h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis 
            stroke="#888888" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            unit={unit}
            domain={['auto', 'auto']}
          />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            name={title} 
            stroke={color} 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
    </Card>
  )
}