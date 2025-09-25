import { Card, CardContent } from "./card";
import { TrendingUp } from "lucide-react";

interface SalesChartProps {
  className?: string;
}

function SalesChart({ className }: SalesChartProps) {
  return (
    <div className={`h-36 ${className}`}>
      <svg
        fill="none"
        height="100%"
        preserveAspectRatio="none"
        viewBox="-3 0 478 150"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z"
          fill="url(#paint0_linear_1131_5935)"
        />
        <path
          d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25"
          stroke="hsl(var(--primary))"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id="paint0_linear_1131_5935"
            x1="236"
            x2="236"
            y1="1"
            y2="149"
          >
            <stop stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

interface InsightsSectionProps {
  salesTrend: {
    title: string;
    value: string;
    period: string;
    change: string;
    changeType: "positive" | "negative";
  };
}

export function InsightsSection({ salesTrend }: InsightsSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-foreground">Insights</h2>
      <Card className="border-border">
        <CardContent className="p-4">
          <p className="text-muted-foreground">{salesTrend.title}</p>
          <p className="text-3xl font-bold text-foreground">{salesTrend.value}</p>
          <div className="flex items-center gap-2 text-sm">
            <p className="text-muted-foreground">{salesTrend.period}</p>
            <div className="flex items-center gap-1">
              <TrendingUp className={`h-3 w-3 ${salesTrend.changeType === "positive" ? "text-green-500" : "text-red-500"}`} />
              <p className={`font-medium ${salesTrend.changeType === "positive" ? "text-green-500" : "text-red-500"}`}>
                {salesTrend.change}
              </p>
            </div>
          </div>
          <SalesChart className="mt-4" />
          <div className="flex justify-between pt-2 text-xs font-medium text-muted-foreground">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}