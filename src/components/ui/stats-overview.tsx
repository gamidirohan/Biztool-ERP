"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  LucideIcon 
} from "lucide-react";

interface Stat {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
}

interface StatsOverviewProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
}

export function StatsOverview({ stats, columns = 4 }: StatsOverviewProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change && stat.change > 0;
        const isNegative = stat.change && stat.change < 0;
        const isNeutral = stat.change === 0;

        return (
          <div
            key={index}
            className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[color:var(--foreground)]/60 uppercase tracking-wide">
                {stat.label}
              </span>
              {Icon && (
                <Icon 
                  className="h-4 w-4" 
                  style={{ color: stat.iconColor || 'var(--muted-foreground)' }}
                />
              )}
            </div>

            <div className="text-2xl font-semibold tracking-tight mb-1">
              {stat.value}
            </div>

            {stat.change !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {isPositive && (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      +{stat.change}%
                    </span>
                  </>
                )}
                {isNegative && (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {stat.change}%
                    </span>
                  </>
                )}
                {isNeutral && (
                  <>
                    <Minus className="h-3 w-3 text-[color:var(--muted-foreground)]" />
                    <span className="text-[color:var(--muted-foreground)] font-medium">
                      0%
                    </span>
                  </>
                )}
                {stat.changeLabel && (
                  <span className="text-[color:var(--foreground)]/60 ml-1">
                    {stat.changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
