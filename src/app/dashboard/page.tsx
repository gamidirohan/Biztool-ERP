"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { 
  Users, 
  Package, 
  Clock, 
  BarChart3,
  Home,
  Settings,
  CreditCard,
  CheckCircle,
  Bell
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-white dark:from-gray-900 dark:to-gray-800">
      <NavigationMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        currentPath="/dashboard"
      />
      
      {/* Top Navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Burger menu */}
            <div className="flex items-center">
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            </div>
            
            {/* Right side - Notifications */}
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative transition-colors">
                <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-20">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.user_metadata?.name || user.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select a module to get started with your business management.
          </p>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div key={module.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  {module.status === "subscribed" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{module.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{module.description}</p>
                <div className="flex gap-2">
                  {module.status === "subscribed" ? (
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around py-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex flex-col items-center py-2 px-3 text-blue-600 dark:text-blue-400"
            >
              <Home className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => router.push('/store')}
              className="flex flex-col items-center py-2 px-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Package className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Inventory</span>
            </button>
            <button
              onClick={() => router.push('/attendance')}
              className="flex flex-col items-center py-2 px-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Clock className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Production</span>
            </button>
            <button
              onClick={() => router.push('/manager')}
              className="flex flex-col items-center py-2 px-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <BarChart3 className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
