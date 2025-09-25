"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Store, 
  User 
} from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
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
    icon: <CalendarCheck className="h-5 w-5" />,
    label: "Attendance",
    href: "/attendance"
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