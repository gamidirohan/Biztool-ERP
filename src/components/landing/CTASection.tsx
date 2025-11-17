import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const CTASection = () => {
  return (
    <section className="container py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <Card className="bg-primary text-primary-foreground border-0">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl md:text-5xl font-bold mb-4">
            Ready to Transform Your Business?
          </CardTitle>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Join thousands of MSMEs already using BizTool to streamline operations 
            and accelerate growth. Start your free trial today.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            asChild
            size="lg"
            className="font-bold group/arrow min-w-[200px] bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Link href="/register">
              Get Started Free
              <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button 
            asChild
            size="lg"
            variant="outline"
            className="font-bold min-w-[200px] bg-transparent hover:bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30"
          >
            <Link href="#contact">
              Schedule a Demo
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};
