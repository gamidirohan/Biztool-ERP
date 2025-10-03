"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Store,
  Clock,
  Users,
  Home,
  Settings,
  LogOut,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
}

export function NavigationMenu({ isOpen, onClose, currentPath }: NavigationMenuProps) {
  const router = useRouter();
  const supabase = createClient();
  const [navigationItems, setNavigationItems] = React.useState([
    { title: "Dashboard", icon: <Home className="h-5 w-5" />, href: "/dashboard" },
    { title: "Manager", icon: <Building2 className="h-5 w-5" />, href: "/manager" },
    { title: "Store", icon: <Store className="h-5 w-5" />, href: "/store" },
    { title: "HR", icon: <Users className="h-5 w-5" />, href: "/hr" },
  ]);

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();
      const tenantId = profile?.tenant_id;
      if (!tenantId) return;
      const { data: mods, error } = await supabase
        .from("tenant_effective_modules")
        .select("code,status")
        .eq("tenant_id", tenantId)
        .eq("code", "attendance");
      let active = false;
      if (!error && mods && mods.length > 0) {
        active = ["active","subscribed","trial"].includes((mods[0] as { status: string }).status);
      } else {
        const { data: subs } = await supabase
          .from("tenant_module_subscriptions")
          .select("module_code,status")
          .eq("tenant_id", tenantId)
          .eq("module_code", "attendance")
          .in("status", ["active","trial"]);
        active = Boolean(subs && subs.length > 0);
      }
      if (active) {
        setNavigationItems(prev => {
          // Insert Attendance after Store
          const next = [...prev];
          const has = next.some(i => i.href === "/attendance");
          if (!has) next.splice(3, 0, { title: "Attendance", icon: <Clock className="h-5 w-5" />, href: "/attendance" });
          return next;
        });
      }
    })();
  }, [supabase]);

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose(); // Close menu when navigating
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300 lg:hidden"
        onClick={onClose}
      />
      
      {/* Menu */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">BizTool</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-4">
            <nav className="space-y-1 px-4">
              {navigationItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${
                    currentPath === item.href
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-inner"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {item.icon}
                  <span className="font-semibold text-md">{item.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <button
              onClick={() => handleNavigation("/settings")}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default NavigationMenu;
