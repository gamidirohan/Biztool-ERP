import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign, LineChart, Blocks } from "lucide-react";

interface BenefitsProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const benefitList: BenefitsProps[] = [
  {
    icon: <Clock className="size-8" />,
    title: "Save Time",
    description:
      "Automate repetitive tasks and streamline workflows. Focus on growing your business instead of managing operations.",
  },
  {
    icon: <DollarSign className="size-8" />,
    title: "Reduce Costs",
    description:
      "Affordable pricing for MSMEs. Get enterprise features without the enterprise price tag.",
  },
  {
    icon: <LineChart className="size-8" />,
    title: "Increase Revenue",
    description:
      "Make data-driven decisions with real-time analytics. Identify opportunities and maximize profitability.",
  },
  {
    icon: <Blocks className="size-8" />,
    title: "Modular Approach",
    description:
      "Start with what you need, add modules as you grow. Pay only for features you use.",
  },
];

export const BenefitsSection = () => {
  return (
    <section id="benefits" className="container py-24 sm:py-32">
      <div className="grid lg:grid-cols-2 place-items-center lg:gap-24 px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-lg text-primary mb-2 tracking-wider">Benefits</h2>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Shortcut to Success
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Experience the difference with BizTool. Designed for MSMEs, our solution 
            helps you work smarter, not harder. Join thousands of businesses already 
            transforming their operations.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 w-full">
          {benefitList.map(({ icon, title, description }, index) => (
            <Card
              key={title}
              className="bg-muted/50 dark:bg-card hover:bg-background transition-all delay-75 group/number"
            >
              <CardHeader>
                <div className="flex justify-between">
                  <div className="mb-6 text-primary">
                    {icon}
                  </div>
                  <span className="text-5xl text-muted-foreground/15 font-medium transition-all delay-75 group-hover/number:text-muted-foreground/30">
                    0{index + 1}
                  </span>
                </div>

                <CardTitle>{title}</CardTitle>
              </CardHeader>

              <CardContent className="text-muted-foreground">
                {description}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
