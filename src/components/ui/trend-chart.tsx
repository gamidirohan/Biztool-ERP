"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

interface DataPoint {
  name: string;
  [key: string]: string | number;
}

interface TrendChartProps {
  data: DataPoint[];
  dataKeys: { key: string; color?: string; name?: string }[];
  title?: string;
  icon?: React.ReactNode;
  height?: number;
}

export function TrendChart({ 
  data, 
  dataKeys,
  title = "Trend Analysis",
  icon,
  height = 250,
}: TrendChartProps) {
  if (!data || data.length === 0) return null;

  // Calculate trend for first data key
  const firstKey = dataKeys[0]?.key;
  const firstValue = data[0]?.[firstKey] as number || 0;
  const lastValue = data[data.length - 1]?.[firstKey] as number || 0;
  const trendPercentage = firstValue !== 0 
    ? (((lastValue - firstValue) / firstValue) * 100).toFixed(1)
    : "0.0";
  const isPositive = lastValue >= firstValue;

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <div className={`flex items-center gap-1 text-xs font-medium ${
          isPositive 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositive ? '+' : ''}{trendPercentage}%
        </div>
      </div>

      <div style={{ height: `${height}px` }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-3 shadow-lg">
                    <p className="text-xs text-[color:var(--foreground)]/60 mb-1">
                      {payload[0].payload.name}
                    </p>
                    {payload.map((entry, index) => (
                      <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            {dataKeys.length > 1 && (
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
            )}
            {dataKeys.map((dataKey, index) => (
              <Line
                key={dataKey.key}
                type="monotone"
                dataKey={dataKey.key}
                name={dataKey.name || dataKey.key}
                stroke={dataKey.color || colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
