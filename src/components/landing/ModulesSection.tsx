import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, Clock, Users, BarChart3, Package } from "lucide-react";

interface ModuleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const moduleList: ModuleProps[] = [
  {
    icon: <Building2 className="size-8 text-sky-400" />,
    title: "Manager Module",
    description:
      "Comprehensive business management dashboard with real-time analytics, reporting tools, and business intelligence.",
  },
  {
    icon: <Store className="size-8 text-green-400" />,
    title: "Store Module",
    description:
      "Complete inventory management, sales tracking, POS system, and customer relationship management tools.",
  },
  {
    icon: <Clock className="size-8 text-purple-400" />,
    title: "Attendance Module",
    description:
      "Employee time tracking, biometric attendance, leave management, and attendance analytics with face recognition.",
  },
  {
    icon: <Users className="size-8 text-orange-400" />,
    title: "HR Module",
    description:
      "Human resources management, payroll processing, recruitment, employee development, and performance tracking.",
  },
  {
    icon: <BarChart3 className="size-8 text-amber-400" />,
    title: "Analytics Module",
    description:
      "Advanced business analytics, custom reports, data visualization, and predictive insights for better decisions.",
  },
  {
    icon: <Package className="size-8 text-blue-400" />,
    title: "Inventory Module",
    description:
      "Stock management, warehouse operations, supplier management, and automated reordering systems.",
  },
];

export const ModulesSection = () => {
  return (
    <section id="modules" className="container py-24 sm:py-32 bg-muted/50 px-4 sm:px-6 lg:px-8">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        Modules
      </h2>

      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        Everything You Need to Run Your Business
      </h2>

      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-12">
        Choose from our comprehensive suite of modules. Start with the essentials 
        and expand as your business grows.
      </h3>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {moduleList.map(({ icon, title, description }) => (
          <Card
            key={title}
            className="bg-background/60 dark:bg-card h-full hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="mb-4">
                {icon}
              </div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="text-base">
                {description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
};
