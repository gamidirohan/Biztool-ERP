import { Card, CardContent } from "./card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
}

function MetricCard({ label, value, change, changeType }: MetricCardProps) {
  const TrendIcon = changeType === "positive" ? TrendingUp : TrendingDown;
  
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <div className="flex items-center gap-1">
            <TrendIcon className={`h-3 w-3 ${changeType === "positive" ? "text-green-500" : "text-red-500"}`} />
            <p className={`text-sm font-medium ${changeType === "positive" ? "text-green-500" : "text-red-500"}`}>
              {change}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OverviewMetricsProps {
  metrics: MetricCardProps[];
}

export function OverviewMetrics({ metrics }: OverviewMetricsProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-foreground">Overview</h2>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
          />
        ))}
      </div>
    </section>
  );
}