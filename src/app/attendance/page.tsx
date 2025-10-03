"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FaceAttendance from "./FaceAttendance";
import AttendanceAnalytics from "./AttendanceAnalytics";

export default function AttendancePage() {
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

  // Owners, managers, and admins see analytics; employees see face attendance
  const isPrivileged = ['owner', 'manager', 'admin'].includes(userRole || '');

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isPrivileged ? <AttendanceAnalytics /> : <FaceAttendance />}
      </div>
    </div>
  );
}
