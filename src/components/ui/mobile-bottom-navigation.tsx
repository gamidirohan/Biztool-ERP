"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Store, 
  User 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const baseItems: NavItem[] = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: "Dashboard",
    href: "/dashboard"
  },
  {
    icon: <Users className="h-5 w-5" />,
    label: "HR",
    href: "/hr"
  },
  {
    icon: <Store className="h-5 w-5" />,
    label: "Store",
    href: "/store"
  },
  {
    icon: <User className="h-5 w-5" />,
    label: "Profile",
    href: "/profile"
  }
];

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const [navItems, setNavItems] = useState<NavItem[]>(baseItems);
  const supabase = createClient();

  useEffect(() => {
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
      setNavItems(() => {
        const items = [...baseItems];
        if (active) items.splice(2, 0, { icon: <CalendarCheck className="h-5 w-5" />, label: "Attendance", href: "/attendance" });
        return items;
      });
    })();
  }, [supabase]);

  return (
    <nav className="sticky bottom-0 z-10 flex items-center justify-around border-t border-border bg-background/90 py-2 backdrop-blur-sm">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-end gap-1 ${
              isActive 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.icon}
            <p className="text-xs font-medium">{item.label}</p>
          </Link>
        );
      })}
    </nav>
  );
}