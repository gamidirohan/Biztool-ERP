import { Separator } from "@/components/ui/separator";
import { Building2 } from "lucide-react";
import Link from "next/link";

export const FooterSection = () => {
  return (
    <footer id="footer" className="container py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="p-10 bg-card border border-secondary rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
          <div className="col-span-full xl:col-span-2">
            <Link href="#" className="flex font-bold items-center">
              <Building2 className="w-9 h-9 mr-2 bg-gradient-to-tr from-primary via-primary/70 to-primary rounded-lg border border-secondary p-1.5 text-white" />

              <h3 className="text-2xl">BizTool</h3>
            </Link>
            <p className="mt-4 text-muted-foreground">
              Streamline your business operations with our comprehensive ERP & CRM solution 
              designed for MSMEs.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Product</h3>
            <div>
              <Link href="#features" className="opacity-60 hover:opacity-100">
                Features
              </Link>
            </div>

            <div>
              <Link href="#modules" className="opacity-60 hover:opacity-100">
                Modules
              </Link>
            </div>

            <div>
              <Link href="#pricing" className="opacity-60 hover:opacity-100">
                Pricing
              </Link>
            </div>

            <div>
              <Link href="/dashboard" className="opacity-60 hover:opacity-100">
                Dashboard
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Resources</h3>
            <div>
              <Link href="/documentation" className="opacity-60 hover:opacity-100">
                Documentation
              </Link>
            </div>

            <div>
              <Link href="/tutorials" className="opacity-60 hover:opacity-100">
                Tutorials
              </Link>
            </div>

            <div>
              <Link href="/blog" className="opacity-60 hover:opacity-100">
                Blog
              </Link>
            </div>

            <div>
              <Link href="/api" className="opacity-60 hover:opacity-100">
                API Reference
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Company</h3>
            <div>
              <Link href="/about" className="opacity-60 hover:opacity-100">
                About Us
              </Link>
            </div>

            <div>
              <Link href="/careers" className="opacity-60 hover:opacity-100">
                Careers
              </Link>
            </div>

            <div>
              <Link href="/partners" className="opacity-60 hover:opacity-100">
                Partners
              </Link>
            </div>

            <div>
              <Link href="/press" className="opacity-60 hover:opacity-100">
                Press Kit
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Legal</h3>
            <div>
              <Link href="/privacy" className="opacity-60 hover:opacity-100">
                Privacy Policy
              </Link>
            </div>

            <div>
              <Link href="/terms" className="opacity-60 hover:opacity-100">
                Terms of Service
              </Link>
            </div>

            <div>
              <Link href="/security" className="opacity-60 hover:opacity-100">
                Security
              </Link>
            </div>

            <div>
              <Link href="/gdpr" className="opacity-60 hover:opacity-100">
                GDPR
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        <section className="flex flex-col md:flex-row md:justify-between gap-4">
          <h3 className="text-muted-foreground">
            &copy; 2025 BizTool. All rights reserved.
          </h3>
          <div className="flex gap-4">
            <Link href="https://twitter.com" target="_blank" className="opacity-60 hover:opacity-100">
              Twitter
            </Link>
            <Link href="https://linkedin.com" target="_blank" className="opacity-60 hover:opacity-100">
              LinkedIn
            </Link>
            <Link href="https://github.com" target="_blank" className="opacity-60 hover:opacity-100">
              GitHub
            </Link>
          </div>
        </section>
      </div>
    </footer>
  );
};
