"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/ui/app-header";
import BreadcrumbWrapper from "@/components/ui/breadcrumb-wrapper";

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show header on landing page, login, register, or auth pages
  const hideHeader = pathname === "/" || 
                     pathname.startsWith("/login") || 
                     pathname.startsWith("/register") ||
                     pathname.startsWith("/auth") ||
                     pathname.startsWith("/forgot-password") ||
                     pathname.startsWith("/reset-password");

  if (hideHeader) {
    return null;
  }

  return (
    <>
      <div className="hidden md:block">
        <AppHeader />
      </div>
      <div className="hidden md:block">
        <BreadcrumbWrapper />
      </div>
    </>
  );
}
