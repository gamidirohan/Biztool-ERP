"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, CalendarCheck, Users, Boxes, ShieldCheck, ChartLine, Clock, Settings, CreditCard, CheckCircle, Loader2, Plus, Mail, X, Star, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ModuleDef { id: string; name: string; description: string; iconName: string; status: string; route: string; sortOrder?: number }
interface PendingInvite { id: string; email: string; role: string; created_at: string; expires_at: string }
interface DashboardContentProps { user: { id: string; email: string | null; name?: string | null } | null; profile: { first_name?: string; last_name?: string; role?: string; tenant_id?: string } | null; effectiveRole: string; modules: ModuleDef[] }

export function DashboardContent({ user, profile, effectiveRole, modules }: DashboardContentProps) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [localModules, setLocalModules] = useState<ModuleDef[]>(modules);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string| null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  // Manager / privileged org stats
  const [orgStats, setOrgStats] = useState<{ activeUsers: number; pendingInvites: number; activeModules: number } | null>(null);
  const [orgStatsLoading, setOrgStatsLoading] = useState(false);
  const privileged = ['owner','manager','admin'].includes(effectiveRole);

  useEffect(() => {
    async function loadInvites() {
      if (!privileged || !profile?.tenant_id) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('tenant_invitations')
        .select('id,email,role,created_at,expires_at')
        .is('accepted_at', null)
        .is('canceled_at', null)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(10);
      setPendingInvites(data || []);
      // Update org stats partial (pending invites) if already loaded
      setOrgStats(prev => prev ? { ...prev, pendingInvites: data?.length || 0 } : prev);
    }
    loadInvites();
  }, [privileged, profile?.tenant_id]);

  // Load org statistics (active users, active modules) for privileged roles
  useEffect(() => {
    async function loadStats() {
      if (!privileged || !profile?.tenant_id) return;
      setOrgStatsLoading(true);
      try {
        const supabase = createClient();
        // Count active memberships (users) in tenant
        const { count: membershipCount } = await supabase
          .from('tenant_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id);
        // Active modules derived locally (status subscribed or trial)
        const activeModules = modules.filter(m => ['subscribed','trial'].includes(m.status)).length;
        setOrgStats({
          activeUsers: membershipCount ?? 0,
          pendingInvites: pendingInvites.length,
          activeModules
        });
      } finally {
        setOrgStatsLoading(false);
      }
    }
    loadStats();
    // Recompute when modules or pendingInvites change
  }, [privileged, profile?.tenant_id, modules, pendingInvites.length]);

  const handleInvite = async () => {
    if (!profile?.tenant_id) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      const res = await fetch('/api/invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail, role: inviteRole, tenantId: profile.tenant_id }) });
      if (!res.ok) {
        const data = await res.json().catch(()=>({}));
        setInviteError(data.error || 'Failed');
      } else {
        setInviteEmail('');
        setShowInvite(false);
        // refresh invites
        const supabase = createClient();
        const { data } = await supabase
          .from('tenant_invitations')
          .select('id,email,role,created_at,expires_at')
          .is('accepted_at', null)
          .is('canceled_at', null)
          .eq('tenant_id', profile.tenant_id)
          .order('created_at', { ascending: false })
          .limit(10);
        setPendingInvites(data || []);
      }
    } finally {
      setInviteLoading(false);
    }
  };

  useEffect(() => setLocalModules(modules), [modules]);
  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);

  const handleSubscribe = useCallback(async (mod: ModuleDef) => {
    if (!user || !profile?.tenant_id) return;
    if (mod.status === "subscribed" || mod.status === "trial") return;
    setPending(mod.id);
    setLocalModules(prev => prev.map(m => m.id === mod.id ? { ...m, status: "subscribed" } : m));
    const supabase = createClient();
    const { error } = await supabase.from("tenant_module_subscriptions").insert({ tenant_id: profile.tenant_id, module_code: mod.id, status: 'active' });
    if (error) {
      console.error('Subscription error', error);
      setLocalModules(prev => prev.map(m => m.id === mod.id ? { ...m, status: "available" } : m));
    } else {
      router.refresh();
    }
    setPending(null);
  }, [user, profile?.tenant_id, router]);

  if (!user) return <div className="min-h-screen flex items-center justify-center text-[color:var(--foreground)]/70">Redirecting to login...</div>;

  const displayName = profile?.first_name ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ""}` : (user.name || user.email?.split("@")[0] || "User");

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-24">
        {/* Header / Welcome */}
        <section aria-labelledby="dashboard-welcome" className="mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 id="dashboard-welcome" className="text-2xl font-bold tracking-tight">Welcome back, {displayName}!</h1>
                <span className="inline-flex items-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-2 py-0.5 text-xs text-[color:var(--foreground)]/70 capitalize" aria-label={`Role: ${effectiveRole}`}>{effectiveRole}</span>
              </div>
              <p className="text-sm text-[color:var(--foreground)]/70">Your central hub for BizTool modules & account actions.</p>
            </div>
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-1" aria-label="Quick actions">
              {privileged && (
                <button onClick={()=>setShowInvite(true)} className="inline-flex items-center gap-2 rounded-md border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-xs font-medium hover:bg-[color:var(--card-bg)]/70 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40">
                  <Mail className="h-4 w-4" /> Invite User
                </button>
              )}
              <button onClick={()=>router.refresh()} className="inline-flex items-center gap-2 rounded-md border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-xs font-medium hover:bg-[color:var(--card-bg)]/70 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40">
                <ArrowRight className="h-4 w-4" /> Refresh
              </button>
              <button className="inline-flex items-center gap-2 rounded-md border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-3 py-2 text-xs font-medium hover:bg-[color:var(--card-bg)]/70 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40" disabled>
                <Star className="h-4 w-4" /> Favorites (soon)
              </button>
            </div>
          </div>
        </section>

        {/* Manager / Admin Widgets */}
        {privileged && (
          <section aria-labelledby="manager-widgets" className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 id="manager-widgets" className="text-lg font-semibold">Organization Overview</h2>
              <div className="flex gap-2">
                <button onClick={() => document.getElementById('pending-invites')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs rounded-md border border-[color:var(--card-border)] px-3 py-1.5 hover:bg-[color:var(--card-bg)]/60">Invitations</button>
                <button disabled className="text-xs rounded-md border border-[color:var(--card-border)] px-3 py-1.5 opacity-60">User Management (soon)</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-[color:var(--foreground)]/60"><span>Active Users</span><Users className="h-4 w-4" /></div>
                <div className="text-2xl font-semibold tracking-tight">
                  {orgStatsLoading ? <span className="flex items-center gap-1 text-sm text-[color:var(--foreground)]/50"><Loader2 className="h-4 w-4 animate-spin" />...</span> : orgStats?.activeUsers ?? '–'}
                </div>
              </div>
              <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-[color:var(--foreground)]/60"><span>Active Modules</span><LayoutDashboard className="h-4 w-4" /></div>
                <div className="text-2xl font-semibold tracking-tight">
                  {orgStatsLoading ? <span className="flex items-center gap-1 text-sm text-[color:var(--foreground)]/50"><Loader2 className="h-4 w-4 animate-spin" />...</span> : orgStats?.activeModules ?? '–'}
                </div>
              </div>
              <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-[color:var(--foreground)]/60"><span>Pending Invites</span><Mail className="h-4 w-4" /></div>
                <div className="text-2xl font-semibold tracking-tight">
                  {orgStatsLoading ? <span className="flex items-center gap-1 text-sm text-[color:var(--foreground)]/50"><Loader2 className="h-4 w-4 animate-spin" />...</span> : orgStats?.pendingInvites ?? pendingInvites.length}
                </div>
              </div>
              <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-[color:var(--foreground)]/60"><span>Approvals</span><ShieldCheck className="h-4 w-4" /></div>
                <div className="text-2xl font-semibold tracking-tight">0</div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Approvals Placeholder */}
              <div className="lg:col-span-2 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Pending Approvals</h3>
                <p className="text-xs text-[color:var(--foreground)]/60">No approval workflows yet. This area will surface leave requests, expense claims, and other actionable items.</p>
              </div>
              {/* Quick Links Placeholder */}
              <div className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Settings className="h-4 w-4" /> Admin Quick Links</h3>
                <ul className="space-y-2 text-xs">
                  <li><button disabled className="w-full text-left px-2 py-1.5 rounded-md border border-dashed border-[color:var(--card-border)]/50 hover:border-[color:var(--card-border)]/80 disabled:opacity-60">User Directory (soon)</button></li>
                  <li><button onClick={() => document.getElementById('pending-invites')?.scrollIntoView({ behavior: 'smooth' })} className="w-full text-left px-2 py-1.5 rounded-md border border-[color:var(--card-border)]/50 hover:border-[color:var(--card-border)]">Manage Invitations</button></li>
                  <li><button disabled className="w-full text-left px-2 py-1.5 rounded-md border border-dashed border-[color:var(--card-border)]/50 disabled:opacity-60">Module Billing (soon)</button></li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Modules Section */}
        <section aria-labelledby="modules-heading" className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 id="modules-heading" className="text-lg font-semibold">Your Modules</h2>
            {privileged && (
              <button onClick={()=>setShowInvite(true)} className="inline-flex items-center gap-2 text-xs rounded-md border border-[color:var(--card-border)] px-3 py-1.5 hover:bg-[color:var(--card-bg)]/60 transition" aria-label="Invite a new user">
                <Plus className="h-4 w-4" /> Invite
              </button>
            )}
          </div>
          {localModules.length === 0 && (
            <div className="border border-dashed border-[color:var(--card-border)] rounded-lg p-10 text-center text-sm text-[color:var(--foreground)]/60">
              <p className="mb-3 font-medium">No modules yet</p>
              <p className="mb-4">Core modules will appear here once provisioned.</p>
              {privileged && <Button onClick={()=>router.refresh()} variant="outline" size="sm">Refresh</Button>}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localModules.map(module => {
              const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = { "layout-dashboard": LayoutDashboard, "calendar-check": CalendarCheck, users: Users, boxes: Boxes, "shield-check": ShieldCheck, "chart-line": ChartLine, clock: Clock };
              const Icon = ICON_MAP[module.iconName] || LayoutDashboard;
              return (
                <div key={module.id} className="group bg-[color:var(--card-bg)] rounded-lg shadow-sm border border-[color:var(--card-border)] p-6 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-[color:var(--primary)]/40">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-8 w-8 text-[color:var(--primary)]" />
                    {module.status === "subscribed" && <CheckCircle className="h-5 w-5 text-green-500" aria-label="Subscribed" />}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{module.name}</h3>
                  <p className="text-sm mb-4 text-[color:var(--foreground)]/70">{module.description}</p>
                  <div className="flex gap-2">
                    {module.status === "subscribed" ? (
                      <Button aria-label={`Open ${module.name} module`} className="flex-1 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white" onClick={() => router.push(module.route)}>Open</Button>
                    ) : (
                      <>
                        <Button aria-label={`Preview ${module.name} module`} variant="outline" className="flex-1" onClick={() => router.push(module.route)}>Preview</Button>
                        <Button aria-label={`Subscribe to ${module.name}`} disabled={pending === module.id} className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleSubscribe(module)}>
                          {pending === module.id ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Subscribing</span> : 'Subscribe'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Invitations Section (privileged) */}
        {privileged && (
          <section aria-labelledby="pending-invites" className="mb-12">
            <div className="bg-[color:var(--card-bg)] rounded-lg shadow-sm border border-[color:var(--card-border)] p-6">
              <h2 id="pending-invites" className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Pending Invitations</h2>
              {pendingInvites.length === 0 && <p className="text-sm text-[color:var(--foreground)]/60">No pending invitations.</p>}
              {pendingInvites.length > 0 && (
                <ul className="space-y-3 text-sm">
                  {pendingInvites.map(inv => (
                    <li key={inv.id} className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-2 last:border-none last:pb-0">
                      <div className="flex flex-col">
                        <span className="font-medium">{inv.email}</span>
                        <span className="text-[10px] uppercase tracking-wide text-[color:var(--foreground)]/50">{inv.role}</span>
                      </div>
                      <span className="text-[11px] text-[color:var(--foreground)]/50">exp {new Date(inv.expires_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* Account Section */}
        <section aria-labelledby="account-settings">
          <div className="bg-[color:var(--card-bg)] rounded-lg shadow-sm border border-[color:var(--card-border)] p-6">
            <h2 id="account-settings" className="text-lg font-semibold mb-4 flex items-center gap-2"><Settings className="h-5 w-5" /> Account Settings</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex items-center gap-2" aria-label="Billing and Subscriptions"><CreditCard className="h-4 w-4" /> Billing & Subscriptions</Button>
              <Button variant="outline" className="flex items-center gap-2" aria-label="Profile Settings"><Settings className="h-4 w-4" /> Profile Settings</Button>
            </div>
          </div>
        </section>
      </main>

      {showInvite && privileged && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6 shadow-lg relative">
            <button onClick={()=>setShowInvite(false)} className="absolute top-3 right-3 text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)]"><X className="h-4 w-4" /></button>
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2"><Mail className="h-5 w-5" /> Invite User</h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/60">Email</label>
                <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} type="email" placeholder="user@example.com" className="w-full rounded-md border border-[color:var(--card-border)] bg-[color:var(--background)]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/60">Role</label>
                <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} className="w-full rounded-md border border-[color:var(--card-border)] bg-[color:var(--background)]/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {inviteError && <div className="text-xs text-red-600 dark:text-red-400">{inviteError}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowInvite(false)} className="px-4 py-2 text-sm border border-[color:var(--card-border)] rounded-md">Cancel</button>
                <button disabled={inviteLoading || !inviteEmail} onClick={handleInvite} className="flex-1 px-4 py-2 text-sm rounded-md bg-[color:var(--primary)] text-white disabled:opacity-60">
                  {inviteLoading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
              <p className="text-[10px] text-[color:var(--foreground)]/50">An email with a secure link will be sent to the user.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
