"use client";

import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DataPoint {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data: DataPoint[];
  title?: string;
  valuePrefix?: string;
}

export function RevenueChart({ 
  data, 
  title = "Monthly Revenue",
  valuePrefix = "$" 
}: RevenueChartProps) {
  if (!data || data.length === 0) return null;

  const firstValue = data[0].revenue;
  const lastValue = data[data.length - 1].revenue;
  const trendPercentage = firstValue !== 0 
    ? (((lastValue - firstValue) / firstValue) * 100).toFixed(1)
    : "0.0";
  const isPositive = lastValue >= firstValue;

  const maxValue = Math.max(...data.map(d => d.revenue));
  const avgValue = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;

  return (
    <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
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

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor="hsl(var(--primary))" 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="95%" 
                  stopColor="hsl(var(--primary))" 
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis 
              dataKey="month" 
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
              tickFormatter={(value) => `${valuePrefix}${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-2 shadow-lg">
                    <p className="text-xs text-[color:var(--foreground)]/60">
                      {payload[0].payload.month}
                    </p>
                    <p className="text-sm font-semibold">
                      {valuePrefix}{payload[0].value?.toLocaleString()}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-[color:var(--card-border)]">
        <div>
          <div className="text-[10px] text-[color:var(--foreground)]/60 uppercase tracking-wide">
            Current
          </div>
          <div className="text-sm font-semibold mt-0.5">
            {valuePrefix}{lastValue.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[color:var(--foreground)]/60 uppercase tracking-wide">
            Average
          </div>
          <div className="text-sm font-semibold mt-0.5">
            {valuePrefix}{avgValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[color:var(--foreground)]/60 uppercase tracking-wide">
            Peak
          </div>
          <div className="text-sm font-semibold mt-0.5">
            {valuePrefix}{maxValue.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
