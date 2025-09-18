// Central catalog of module metadata used as a fallback or to enrich DB results.
// Keep codes in sync with the `modules` table seed data.
// NOTE: We intentionally store only serializable data (no React components) so
// it can safely be passed from Server Components to Client Components.

export type ModuleTier = "starter" | "pro" | "growth";
export type ModuleCode =
  | "dashboard"
  | "attendance"
  | "hr"
  | "store"
  | "manager"
  | "analytics";

export interface ModuleCatalogEntry {
  code: ModuleCode;
  name: string;
  description: string;
  category: string;
  tierMin: ModuleTier;
  iconName: string; // kebab-case lucide icon identifier (e.g. layout-dashboard)
  isCore: boolean;
  recommended: boolean;
  sortOrder: number;
  managerOnly?: boolean; // convenience flag for UI role filtering
}

export const moduleCatalog: Record<ModuleCode, ModuleCatalogEntry> = {
  dashboard: {
    code: "dashboard",
    name: "Dashboard",
    description: "Unified workspace overview",
    category: "core",
    tierMin: "starter",
  iconName: "layout-dashboard",
    isCore: true,
    recommended: true,
    sortOrder: 10,
  },
  attendance: {
    code: "attendance",
    name: "Attendance",
    description: "Track employee time & presence",
    category: "operations",
    tierMin: "starter",
  iconName: "calendar-check", // matches DB seed; map to CalendarCheck icon client-side
    isCore: false,
    recommended: true,
    sortOrder: 20,
  },
  hr: {
    code: "hr",
    name: "HR",
    description: "Manage employee profiles & roles",
    category: "people",
    tierMin: "starter",
  iconName: "users",
    isCore: false,
    recommended: true,
    sortOrder: 30,
  },
  store: {
    code: "store",
    name: "Store / Inventory",
    description: "Inventory & stock management",
    category: "inventory",
    tierMin: "starter",
  iconName: "boxes",
    isCore: false,
    recommended: true,
    sortOrder: 40,
  },
  manager: {
    code: "manager",
    name: "Management Console",
    description: "Manager-only controls & approvals",
    category: "administration",
    tierMin: "pro",
  iconName: "shield-check",
    isCore: false,
    recommended: false,
    sortOrder: 50,
    managerOnly: true,
  },
  analytics: {
    code: "analytics",
    name: "Analytics",
    description: "Cross-module insights & KPIs",
    category: "insights",
    tierMin: "growth",
  iconName: "chart-line",
    isCore: false,
    recommended: true,
    sortOrder: 60,
  },
};

export interface EffectiveModule {
  id: string; // code
  name: string;
  description: string;
  iconName: string;
  status: string; // subscribed | available | trial
  route: string;
  sortOrder: number;
}

export interface ModuleDbRow { code: ModuleCode | string; status: string }

export function mergeDbWithCatalog(dbRows: ModuleDbRow[], userRole: string): EffectiveModule[] {
  const subscribedCodes = new Set<string>();
  const results: EffectiveModule[] = [];

  for (const row of dbRows) {
    const cat = moduleCatalog[row.code as ModuleCode];
    if (!cat) continue;
    if (cat.managerOnly && !["manager", "admin", "owner"].includes(userRole)) continue;
    subscribedCodes.add(cat.code);
    results.push({ id: cat.code, name: cat.name, description: cat.description, iconName: cat.iconName, status: row.status === "trial" ? "trial" : "subscribed", route: mapRoute(cat.code), sortOrder: cat.sortOrder });
  }

  // Add available (not subscribed) modules visible to role
  Object.values(moduleCatalog).forEach((cat) => {
    if (subscribedCodes.has(cat.code)) return;
    if (cat.managerOnly && !["manager", "admin", "owner"].includes(userRole)) return;
    results.push({ id: cat.code, name: cat.name, description: cat.description, iconName: cat.iconName, status: "available", route: mapRoute(cat.code), sortOrder: cat.sortOrder });
  });

  return results.sort((a, b) => a.sortOrder - b.sortOrder);
}

function mapRoute(code: ModuleCode): string {
  switch (code) {
    case "attendance":
      return "/attendance";
    case "hr":
      return "/hr";
    case "store":
      return "/store";
    case "manager":
      return "/manager";
    case "analytics":
      return "/dashboard?tab=analytics"; // placeholder
    case "dashboard":
    default:
      return "/dashboard";
  }
}
