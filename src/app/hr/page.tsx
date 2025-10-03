"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TaskManager } from "@/components/ui/task-manager";
import { Users } from "lucide-react";

export default function HRPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUserRole("guest");
        setLoading(false);
        return;
      }

      // Get user profile and role
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Check membership role as fallback
      const { data: membership } = await supabase
        .from("tenant_memberships")
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      const effectiveRole = profile?.role || membership?.role || "employee";
      setUserRole(effectiveRole);
      setLoading(false);
    };

    checkUserRole();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--primary)] mx-auto mb-4"></div>
          <p className="text-sm text-[color:var(--muted-foreground)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Only owners, managers, and admins can access HR module
  const isPrivileged = ['owner', 'manager', 'admin'].includes(userRole || '');

  if (!isPrivileged) {
    return (
      <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Users className="h-16 w-16 mx-auto mb-4 text-[color:var(--muted-foreground)]" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-[color:var(--muted-foreground)]">
            Only administrators can access the HR module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8" style={{ color: 'var(--module-orange)' }} />
            <h1 className="text-3xl font-bold">HR Module</h1>
          </div>
          <p className="text-[color:var(--muted-foreground)]">
            Manage employees, assign tasks, and oversee team performance
          </p>
        </div>

        <TaskManager />
      </div>
    </div>
  );
}