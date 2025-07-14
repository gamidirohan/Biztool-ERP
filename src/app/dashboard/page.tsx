"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.user_metadata?.name || user.email}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select a module to get started with your business management.
          </p>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className="h-8 w-8 text-blue-600" />
                    {module.status === "subscribed" && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <CardTitle className="text-xl">{module.name}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {module.status === "subscribed" ? (
                      <Button 
                        className="flex-1"
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
                        <Button className="flex-1">
                          Subscribe
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
