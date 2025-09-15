"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { 
  Users, 
  Package, 
  Clock, 
  BarChart3,
  Settings,
  CreditCard,
  CheckCircle
} from "lucide-react";

const modules = [
  {
    id: "hr",
    name: "Human Resources",
    description: "Manage employee data, payroll, and benefits",
    icon: Users,
    status: "available", // available, subscribed, premium
    route: "/hr"
  },
  {
    id: "inventory",
    name: "Inventory Management", 
    description: "Track stock levels, orders, and suppliers",
    icon: Package,
    status: "available",
    route: "/store"
  },
  {
    id: "attendance",
    name: "Time & Attendance",
    description: "Monitor work hours and track attendance",
    icon: Clock,
    status: "subscribed",
    route: "/attendance"
  },
  {
    id: "manager",
    name: "Management Dashboard",
    description: "Overview and analytics for business insights",
    icon: BarChart3,
    status: "subscribed", 
    route: "/manager"
  }
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-20">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {user.user_metadata?.name || user.email?.split('@')[0]}!
          </h2>
          <p>
            Select a module to get started with your business management.
          </p>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div key={module.id} className="bg-[color:var(--card-bg)] rounded-lg shadow-sm border border-[color:var(--card-border)] p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8 text-[color:var(--primary)]" />
                  {module.status === "subscribed" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">{module.name}</h3>
                <p className="text-sm mb-4">{module.description}</p>
                <div className="flex gap-2">
                  {module.status === "subscribed" ? (
                    <Button 
                      className="flex-1 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white"
                      onClick={() => router.push(module.route)}
                    >
                      Open Module
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => router.push(module.route)}
                      >
                        Preview
                      </Button>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        Subscribe
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Account Section */}
        <div className="bg-[color:var(--card-bg)] rounded-lg shadow-sm border border-[color:var(--card-border)] p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Settings
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing & Subscriptions
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Profile Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}