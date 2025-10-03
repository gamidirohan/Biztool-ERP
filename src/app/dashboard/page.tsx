import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "./DashboardContent";
import { mergeDbWithCatalog } from "@/lib/moduleCatalog";

async function getUserContext() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, membership: null, effectiveRole: "guest" };
  }

  // Fetch profile (optional if table not yet implemented)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name,last_name,role,tenant_id,preferences")
    .eq("id", user.id)
    .single();

  // Fetch membership (for future multi-tenant logic)
  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("role,tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const effectiveRole = profile?.role || membership?.role || "employee";

  return { user, profile, membership, effectiveRole };
}

type ModuleRow = { code: string; status: string };

export default async function DashboardPage() {
  const { user, profile, effectiveRole } = await getUserContext();

  // Fetch subscribed modules from view if tenant context available
  let modules: ModuleRow[] = [];
  if (profile?.tenant_id) {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    const { data } = await supabase
      .from("tenant_effective_modules")
      .select("code,status")
      .eq("tenant_id", profile.tenant_id);
    modules = (data as ModuleRow[] | null) || [];

    // Optional per-user assignment filter: if assignments exist, restrict modules
    if (user) {
      const { data: assigns, error: assignErr } = await supabase
        .from("tenant_user_module_assignments")
        .select("module_code")
        .eq("tenant_id", profile.tenant_id)
        .eq("user_id", user.id);
      if (!assignErr && assigns && assigns.length > 0) {
        const allow = new Set<string>(assigns.map((a: any) => a.module_code));
        modules = modules.filter((m) => allow.has(m.code));
      }
      // if table missing or no rows, we keep the full subscribed set
    }
  }

  const merged = mergeDbWithCatalog(modules, effectiveRole);

  return (
    <DashboardContent
      user={user ? { id: user.id, email: user.email ?? null, name: user.user_metadata?.name } : null}
      profile={profile}
      effectiveRole={effectiveRole}
      modules={merged}
    />
  );
}