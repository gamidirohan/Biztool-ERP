"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export const HeroSection = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/register");
  };

  const handleBookDemo = () => {
    const contactSection = document.getElementById("contact");
    contactSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="container w-full py-20 md:py-32 overflow-hidden">
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 max-w-full">
          <Badge variant="outline" className="text-sm py-2 px-4">
            <span className="mr-2 text-primary">
              <Badge className="bg-primary text-primary-foreground">New</Badge>
            </span>
            <span>Mobile-First ERP for MSMEs</span>
          </Badge>

          <div className="max-w-screen-md mx-auto text-center text-4xl md:text-6xl font-bold px-4">
            <h1>
              All your business on{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-400">
                one platform
              </span>
            </h1>
          </div>

          <p className="max-w-screen-sm mx-auto text-xl text-muted-foreground px-4">
            Simple, efficient, and affordable ERP & CRM solution designed specifically 
            for Micro, Small, and Medium Enterprises. Streamline operations, boost productivity.
          </p>

          <div className="space-y-4 md:space-y-0 md:space-x-4 px-4">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="w-full md:w-auto font-bold group/arrow bg-blue-500 hover:bg-blue-600 text-white"
            >
              Get Started
              <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
            </Button>

            <Button
              onClick={handleBookDemo}
              variant="outline"
              size="lg"
              className="w-full md:w-auto font-bold"
            >
              Book a Demo
            </Button>
          </div>
        </div>

        {/* Product Preview */}
        <div className="relative group mt-14 w-full max-w-full px-4">
          <div className="absolute top-2 lg:-top-8 left-1/2 transform -translate-x-1/2 w-[90%] mx-auto h-24 lg:h-80 bg-primary/30 rounded-full blur-3xl"></div>
          <div className="relative w-full max-w-6xl mx-auto rounded-lg border-2 border-primary/20 bg-card shadow-2xl overflow-hidden">
            <div className="aspect-video bg-white flex items-center justify-center">
              <img
            src="/Dashboard.png"
            alt="Product preview"
            className="w-full h-full object-contain rounded-lg"
            loading="eager"
              />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-20 md:h-28 bg-gradient-to-b from-background/0 via-background/50 to-background rounded-lg"></div>
        </div>
      </div>
    </section>
  );
};
