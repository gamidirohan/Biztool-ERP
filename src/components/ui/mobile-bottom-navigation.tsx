"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Store, 
  User,
  Settings
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
  },
  {
    icon: <Settings className="h-5 w-5" />,
    label: "Settings",
    href: "/settings"
  }
];

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const [navItems, setNavItems] = useState<NavItem[]>(baseItems);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Always show at top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide
        setIsVisible(false);
      } else {
        // Scrolling up - show
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

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
    <>
      {/* Gradient accent line */}
      <div className={`fixed bottom-16 left-0 right-0 z-50 h-px bg-gradient-to-r from-sky-400/40 via-indigo-400/40 to-violet-400/40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`} />
      
      <nav 
        className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 bg-background/95 py-3 backdrop-blur-md transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 min-w-[60px] relative group"
            >
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500" />
              )}
              <div className={`transition-all ${
                isActive 
                  ? "text-blue-400 scale-110" 
                  : "text-muted-foreground group-hover:text-sky-300 group-hover:scale-105"
              }`}>
                {item.icon}
              </div>
              <p className={`text-[10px] font-medium transition-colors ${
                isActive ? "text-blue-400" : "text-muted-foreground group-hover:text-sky-300"
              }`}>
                {item.label}
              </p>
            </Link>
          );
        })}
      </nav>
    </>
  );
}