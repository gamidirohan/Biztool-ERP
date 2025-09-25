"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileHeader } from "@/components/ui/mobile-header";
import { ActionButtons } from "@/components/ui/action-buttons";
import { OverviewMetrics } from "@/components/ui/overview-metrics";
import { PriorityTasks } from "@/components/ui/priority-tasks";
import { ShortcutsGrid } from "@/components/ui/shortcuts-grid";
import { InsightsSection } from "@/components/ui/insights-section";
import { MobileBottomNavigation } from "@/components/ui/mobile-bottom-navigation";
import { createClient } from "@/lib/supabase/client";

interface ModuleDef { 
  id: string; 
  name: string; 
  description: string; 
  iconName: string; 
  status: string; 
  route: string; 
  sortOrder?: number 
}

interface MobileDashboardProps {
  user: { 
    id: string; 
    email: string | null; 
    name?: string | null 
  } | null;
  profile: { 
    first_name?: string; 
    last_name?: string; 
    role?: string; 
    tenant_id?: string 
  } | null;
  effectiveRole: string;
  modules?: ModuleDef[];
}

export function MobileDashboard({ user, profile, effectiveRole, modules = [] }: MobileDashboardProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [orgStats, setOrgStats] = useState<{
    activeUsers: number;
    pendingInvites: number;
    activeModules: number;
    approvals: number;
  } | null>(null);
  const router = useRouter();
  
  const privileged = ['owner','manager','admin'].includes(effectiveRole);

  useEffect(() => {
    async function loadOrgStats() {
      if (!privileged || !profile?.tenant_id) return;
      
      const supabase = createClient();
      try {
        // Count active memberships
        const { count: membershipCount } = await supabase
          .from('tenant_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id);

        // Count pending invites
        const { count: inviteCount } = await supabase
          .from('tenant_invitations')
          .select('id', { count: 'exact', head: true })
          .is('accepted_at', null)
          .is('canceled_at', null)
          .eq('tenant_id', profile.tenant_id);

        const activeModules = modules.filter(m => ['subscribed','trial'].includes(m.status)).length;

        setOrgStats({
          activeUsers: membershipCount ?? 0,
          pendingInvites: inviteCount ?? 0,
          activeModules,
          approvals: 0 // Placeholder for future approval system
        });
      } catch (error) {
        console.error('Failed to load org stats:', error);
      }
    }

    loadOrgStats();
  }, [privileged, profile?.tenant_id, modules]);
  
  // Dynamic metrics based on real data
  const metrics = [
    {
      label: "Active Users",
      value: orgStats?.activeUsers.toString() ?? "0",
      change: "+2",
      changeType: "positive" as const
    },
    {
      label: "Active Modules",
      value: orgStats?.activeModules.toString() ?? "0",
      change: "+1",
      changeType: "positive" as const
    },
    {
      label: "Pending Invites",
      value: orgStats?.pendingInvites.toString() ?? "0",
      change: orgStats?.pendingInvites ? "+1" : "0",
      changeType: (orgStats?.pendingInvites ?? 0) > 0 ? "positive" as const : "negative" as const
    },
    {
      label: "Approvals",
      value: orgStats?.approvals.toString() ?? "0",
      change: "0",
      changeType: "negative" as const
    }
  ];

  const priorityTasks = [
    {
      icon: "approvals",
      title: "Approvals",
      subtitle: `${orgStats?.approvals ?? 0} pending`,
      href: "/approvals"
    },
    {
      icon: "activity",
      title: "Pending Invites",
      subtitle: `${orgStats?.pendingInvites ?? 0} new`,
      href: "#invites"
    }
  ].filter(task => 
    // Only show tasks that have actionable items
    (task.title === "Approvals" && (orgStats?.approvals ?? 0) > 0) ||
    (task.title === "Pending Invites" && (orgStats?.pendingInvites ?? 0) > 0)
  );

  const shortcuts = [
    ...(privileged ? [{
      icon: "invite",
      title: "Invite employee",
      href: "#invite-action"
    }] : []),
    {
      icon: "modules",
      title: "Modules",
      href: "/modules"
    },
    {
      icon: "settings",
      title: "Settings",
      href: "/settings"
    },
    ...(privileged ? [{
      icon: "roles",
      title: "Manage roles",
      href: "/roles"
    }] : []),
    ...(effectiveRole === "owner" ? [{
      icon: "billing",
      title: "Billing",
      href: "/billing"
    }] : [])
  ];

  const salesTrend = {
    title: "Organization Growth",
    value: `${orgStats?.activeUsers ?? 0} Users`,
    period: "Current active users",
    change: "+12%",
    changeType: "positive" as const
  };

  const handleInvite = () => {
    // For mobile, we could either show a modal or navigate to invite page
    router.push('/invite/new');
  };

  const handleAddModule = () => {
    router.push('/modules');
  };

  const handleShortcutClick = (href: string) => {
    if (href === "#invite-action") {
      handleInvite();
    } else {
      router.push(href);
    }
  };

  // Get company name from profile or fallback
  const companyName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}` 
    : user?.name || "Your Company";

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden">
      <div className="flex-grow">
        <MobileHeader 
          companyName={companyName}
          userRole={effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)}
        />
        <main className="p-4">
          <ActionButtons 
            onInvite={privileged ? handleInvite : undefined}
            onAddModule={handleAddModule}
          />
          <OverviewMetrics metrics={metrics} />
          {priorityTasks.length > 0 && (
            <PriorityTasks tasks={priorityTasks} />
          )}
          <ShortcutsGrid 
            shortcuts={shortcuts}
            onShortcutClick={handleShortcutClick}
          />
          <InsightsSection salesTrend={salesTrend} />
        </main>
      </div>
      <MobileBottomNavigation />
    </div>
  );
}