"use client";

import { Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AttendanceData {
  day: string;
  present: number;
  total: number;
}

interface AttendanceChartProps {
  data: AttendanceData[];
  title?: string;
}

export function AttendanceChart({ 
  data, 
  title = "Weekly Attendance" 
}: AttendanceChartProps) {
  if (!data || data.length === 0) return null;

  const avgAttendance = data.reduce((sum, d) => {
    const rate = d.total > 0 ? (d.present / d.total) * 100 : 0;
    return sum + rate;
  }, 0) / data.length;

  return (
    <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          {title}
        </h3>
        <div className="text-xs font-medium text-[color:var(--foreground)]/60">
          Avg: {avgAttendance.toFixed(0)}%
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis 
              dataKey="day" 
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
                const data = payload[0].payload;
                const rate = data.total > 0 ? ((data.present / data.total) * 100).toFixed(0) : 0;
                return (
                  <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-2 shadow-lg">
                    <p className="text-xs text-[color:var(--foreground)]/60">
                      {data.day}
                    </p>
                    <p className="text-sm font-semibold">
                      {data.present}/{data.total} ({rate}%)
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="present"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-[color:var(--card-border)]">
        <div>
          <div className="text-[10px] text-[color:var(--foreground)]/60 uppercase tracking-wide">
            Total Employees
          </div>
          <div className="text-sm font-semibold mt-0.5">
            {data[0]?.total || 0}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[color:var(--foreground)]/60 uppercase tracking-wide">
            Best Day
          </div>
          <div className="text-sm font-semibold mt-0.5">
            {data.reduce((best, d) => {
              const rate = d.total > 0 ? (d.present / d.total) : 0;
              const bestRate = best.total > 0 ? (best.present / best.total) : 0;
              return rate > bestRate ? d : best;
            }, data[0] || { day: '-', present: 0, total: 0 }).day}
          </div>
        </div>
      </div>
    </div>
  );
}
