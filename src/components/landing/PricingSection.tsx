import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

enum PopularPlan {
  NO = 0,
  YES = 1,
}

interface PlanProps {
  title: string;
  popular: PopularPlan;
  price: number;
  description: string;
  buttonText: string;
  benefitList: string[];
}

const plans: PlanProps[] = [
  {
    title: "Starter",
    popular: 0,
    price: 0,
    description:
      "Perfect for small businesses just getting started. Free forever.",
    buttonText: "Get Started Free",
    benefitList: [
      "Up to 5 team members",
      "2 GB storage",
      "Basic modules access",
      "Community support",
      "Mobile app access",
    ],
  },
  {
    title: "Growth",
    popular: 1,
    price: 49,
    description:
      "For growing businesses that need more features and support.",
    buttonText: "Start Free Trial",
    benefitList: [
      "Up to 20 team members",
      "50 GB storage",
      "All modules included",
      "Priority email support",
      "Advanced analytics",
      "Custom branding",
    ],
  },
  {
    title: "Enterprise",
    popular: 0,
    price: 149,
    description:
      "For large organizations with advanced needs and compliance requirements.",
    buttonText: "Contact Sales",
    benefitList: [
      "Unlimited team members",
      "Unlimited storage",
      "All modules + custom modules",
      "24/7 phone & email support",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="container py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        Pricing
      </h2>

      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        Simple, Transparent Pricing
      </h2>

      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground pb-14">
        Choose the plan that fits your business. All plans include a 14-day free trial. 
        No credit card required.
      </h3>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-4">
        {plans.map(
          ({ title, popular, price, description, buttonText, benefitList }) => (
            <Card
              key={title}
              className={
                popular === PopularPlan?.YES
                  ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10 border-[1.5px] border-primary lg:scale-[1.1]"
                  : ""
              }
            >
              <CardHeader>
                <CardTitle className="pb-2">{title}</CardTitle>

                <CardDescription className="pb-4">
                  {description}
                </CardDescription>

                <div>
                  <span className="text-3xl font-bold">${price}</span>
                  <span className="text-muted-foreground"> /month</span>
                </div>
              </CardHeader>

              <CardContent className="flex">
                <div className="space-y-4">
                  {benefitList.map((benefit) => (
                    <span key={benefit} className="flex">
                      <Check className="text-primary mr-2" />
                      <h3>{benefit}</h3>
                    </span>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className={`w-full ${
                    popular === PopularPlan?.YES 
                      ? "bg-blue-500 hover:bg-blue-600 text-white" 
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {buttonText}
                </Button>
              </CardFooter>
            </Card>
          )
        )}
      </div>
    </section>
  );
};
