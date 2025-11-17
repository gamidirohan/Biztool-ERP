import { Badge } from "@/components/ui/badge";
import { Shield, Award, Users, TrendingUp } from "lucide-react";

export const SocialProofSection = () => {
  const stats = [
    { icon: <Users className="size-6" />, value: "1000+", label: "Active Businesses" },
    { icon: <TrendingUp className="size-6" />, value: "98%", label: "Customer Satisfaction" },
    { icon: <Award className="size-6" />, value: "50+", label: "Industry Awards" },
    { icon: <Shield className="size-6" />, value: "100%", label: "Data Security" },
  ];

  return (
    <section className="container py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          Social Proof
        </h2>
        <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
          Trusted by MSMEs Across India
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="flex justify-center mb-2 text-primary">
              {stat.icon}
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <Badge variant="secondary" className="px-4 py-2 text-base">
          <Shield className="size-4 mr-2" />
          GDPR Compliant
        </Badge>
        <Badge variant="secondary" className="px-4 py-2 text-base">
          <Shield className="size-4 mr-2" />
          ISO 27001 Certified
        </Badge>
        <Badge variant="secondary" className="px-4 py-2 text-base">
          <Shield className="size-4 mr-2" />
          SOC 2 Type II
        </Badge>
        <Badge variant="secondary" className="px-4 py-2 text-base">
          <Award className="size-4 mr-2" />
          Best MSME Software 2025
        </Badge>
      </div>

      <div className="text-center">
        <p className="text-muted-foreground italic max-w-2xl mx-auto">
          "Featured in leading business publications and recognized by industry experts 
          as the go-to ERP solution for Indian MSMEs."
        </p>
      </div>
    </section>
  );
};
