import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Store, 
  Clock, 
  Users, 
  TrendingUp, 
  Shield,
  Smartphone,
  Zap
} from "lucide-react";
import React from "react";

export default function Home() {
  const modules = [
    {
      title: "Manager",
      description: "Comprehensive business management dashboard with real-time analytics and reporting tools.",
      icon: <Building2 className="h-10 w-10 text-blue-500" />,
      href: "/manager"
    },
    {
      title: "Store Module",
      description: "Complete inventory management, sales tracking, and customer relationship tools.",
      icon: <Store className="h-10 w-10 text-green-500" />,
      href: "/store"
    },
    {
      title: "Attendance Module",
      description: "Employee time tracking, leave management, and attendance analytics.",
      icon: <Clock className="h-10 w-10 text-purple-500" />,
      href: "/attendance"
    },
    {
      title: "HR Module",
      description: "Human resources management, payroll, recruitment, and employee development.",
      icon: <Users className="h-10 w-10 text-orange-500" />,
      href: "/hr"
    }
  ];

  const features = [
    {
      icon: <Smartphone className="h-6 w-6 text-blue-500" />,
      title: "Mobile First Design",
      description: "Optimized for mobile devices with responsive design"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-green-500" />,
      title: "Growth Focused",
      description: "Built to scale with your business needs"
    },
    {
      icon: <Shield className="h-6 w-6 text-purple-500" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security and data protection"
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: "Lightning Fast",
      description: "Optimized performance for quick operations"
    }
  ];

  return (
    <>
      <main className="px-4 py-10 sm:px-6 lg:px-8 bg-[color:var(--background)] min-h-[calc(100vh-56px)]">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-[color:var(--foreground)]" style={{fontFamily:'var(--font-sans)'}}>
            All your business on
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)]"> one platform.</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mb-8" style={{fontFamily:'var(--font-sans)'}}>Mobile-first ERP & CRM for MSMEs. Simple, efficient, and affordable.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/login">
              <Button className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white font-semibold px-6 py-3 rounded-lg shadow" style={{fontFamily:'var(--font-sans)'}}>Start Now</Button>
            </Link>
          </div>
        </div>
        {/* Features */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {features.map((feature, i) => (
            <div
              key={i}
              className="rounded-xl bg-[color:var(--card-bg)] border border-[color:var(--card-border)] shadow"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <div className="flex items-center gap-3 p-5 min-h-[96px]">
                <span className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[color:var(--muted)]">
                  {React.cloneElement(feature.icon, { className: "h-5 w-5 sm:h-6 sm:w-6" })}
                </span>
                <div>
                  <div className="font-semibold text-[color:var(--foreground)] text-base sm:text-lg leading-tight">
                    {feature.title}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 leading-snug">
                    {feature.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Modules */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {modules.map((mod, i) => (
            <Link href={mod.href} key={i} className="block rounded-xl bg-[color:var(--card-bg)] border border-[color:var(--card-border)] shadow p-6 transition hover:shadow-lg" style={{fontFamily:'var(--font-sans)'}}>
              <div className="flex items-center gap-4 mb-2">
                {mod.icon}
                <div className="font-semibold text-[color:var(--foreground)]">{mod.title}</div>
              </div>
              <div className="text-sm text-gray-500">{mod.description}</div>
            </Link>
          ))}
        </div>
      </main>
      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-8 w-8 text-blue-500" />
                <span className="text-2xl font-bold">BizTool</span>
              </div>
              <p className="text-gray-400">
                Streamline your business operations with our comprehensive ERP & CRM solution.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/tutorials" className="hover:text-white">Tutorials</Link></li>
                <li><Link href="/documentation" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/forum" className="hover:text-white">Forum</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/hosting" className="hover:text-white">Hosting</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
                <li><Link href="/custom" className="hover:text-white">Custom Development</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">About Us</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/company" className="hover:text-white">Our Company</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 BizTool. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
