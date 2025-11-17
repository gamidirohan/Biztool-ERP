import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { ModulesSection } from "@/components/landing/ModulesSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { FooterSection } from "@/components/landing/FooterSection";
import { EyeTrackingDrawer } from "@/components/analytics/EyeTrackingDrawer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden w-full">
      <LandingNavbar />
      <main className="flex-1 pt-16 w-full">
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <BenefitsSection />
        <ModulesSection />
        <TestimonialSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <FooterSection />
      <EyeTrackingDrawer />
    </div>
  );
}
