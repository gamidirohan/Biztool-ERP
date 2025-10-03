import { ReactNode } from "react";

// Dashboard has its own MobileHeader component in mobile view,
// so we don't need the global AppHeader on mobile screens
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
