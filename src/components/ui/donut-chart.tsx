"use client";

import { PieChart as PieChartIcon } from "lucide-react";
import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}

interface DonutChartProps {
  data: DataPoint[];
  title?: string;
  icon?: React.ReactNode;
  height?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
}

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function DonutChart({ 
  data, 
  title = "Distribution",
  icon,
  height = 300,
  showLegend = true,
  showPercentage = true,
}: DonutChartProps) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {icon || <PieChartIcon className="h-4 w-4" />}
          {title}
        </h3>
        {showPercentage && (
          <div className="text-xs font-medium text-[color:var(--foreground)]/60">
            Total: {total.toLocaleString()}
          </div>
        )}
      </div>

      <div style={{ height: `${height}px` }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0];
                const percentage = ((data.value as number / total) * 100).toFixed(1);
                return (
                  <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-3 shadow-lg">
                    <p className="text-xs text-[color:var(--foreground)]/60 mb-1">
                      {data.name}
                    </p>
                    <p className="text-sm font-semibold">
                      {data.value} ({percentage}%)
                    </p>
                  </div>
                );
              }}
            />
            {showLegend && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value, entry: any) => {
                  const percentage = ((entry.value / total) * 100).toFixed(0);
                  return `${value} (${percentage}%)`;
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
