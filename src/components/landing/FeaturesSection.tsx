import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, TrendingUp, Shield, Zap, BarChart3, Users2 } from "lucide-react";

interface FeaturesProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconWrapClass: string;
  iconColorClass: string;
}

const featureList: FeaturesProps[] = [
  {
    icon: <Smartphone className="size-6" />,
    title: "Mobile-First Design",
    description:
      "Optimized for mobile devices with responsive design. Manage your business on the go.",
    iconWrapClass: "bg-sky-500/15 ring-sky-500/10",
    iconColorClass: "text-sky-400",
  },
  {
    icon: <TrendingUp className="size-6" />,
    title: "Growth Focused",
    description:
      "Built to scale with your business needs. From startup to enterprise, we grow with you.",
    iconWrapClass: "bg-green-500/15 ring-green-500/10",
    iconColorClass: "text-green-400",
  },
  {
    icon: <Shield className="size-6" />,
    title: "Secure & Reliable",
    description:
      "Enterprise-grade security and data protection. Your business data is always safe.",
    iconWrapClass: "bg-purple-500/15 ring-purple-500/10",
    iconColorClass: "text-purple-400",
  },
  {
    icon: <Zap className="size-6" />,
    title: "Lightning Fast",
    description:
      "Optimized performance for quick operations. No more waiting for slow software.",
    iconWrapClass: "bg-amber-500/15 ring-amber-500/10",
    iconColorClass: "text-amber-400",
  },
  {
    icon: <BarChart3 className="size-6" />,
    title: "Real-Time Analytics",
    description:
      "Get instant insights into your business performance with live dashboards and reports.",
    iconWrapClass: "bg-blue-500/15 ring-blue-500/10",
    iconColorClass: "text-blue-400",
  },
  {
    icon: <Users2 className="size-6" />,
    title: "Team Collaboration",
    description:
      "Built-in tools for team communication and collaboration. Work together seamlessly.",
    iconWrapClass: "bg-orange-500/15 ring-orange-500/10",
    iconColorClass: "text-orange-400",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="container py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        Features
      </h2>

      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        What Makes Us Different
      </h2>

      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
        Powerful features designed specifically for MSMEs. Everything you need to run 
        your business efficiently, all in one place.
      </h3>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featureList.map(({ icon, title, description, iconWrapClass, iconColorClass }) => (
          <div key={title}>
            <Card className="h-full bg-background border-0 shadow-none hover:shadow-lg transition-shadow">
              <CardHeader className="flex justify-center items-center">
                <div className={`p-2 rounded-full ring-8 mb-4 ${iconWrapClass}`}>
                  <div className={iconColorClass}>
                    {icon}
                  </div>
                </div>

                <CardTitle>{title}</CardTitle>
              </CardHeader>

              <CardContent className="text-muted-foreground text-center">
                {description}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
};
