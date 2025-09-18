"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import React, { useEffect } from "react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(""); // Person name
  const [companyName, setCompanyName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // Invite-aware state
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteEmailLocked, setInviteEmailLocked] = useState(false);
  const [inviteMeta, setInviteMeta] = useState<{ tenantName?: string; role?: string } | null>(null);

  // On mount, read search params for token/prefillEmail
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const prefill = url.searchParams.get('prefillEmail');
    if (token) {
      setInviteToken(token);
      if (prefill) {
        setEmail(prefill);
        setInviteEmailLocked(true);
      }
      // Fetch invite meta for banner
      fetch(`/api/invitations/${token}`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => setInviteMeta(data ? { tenantName: data.tenantName, role: data.role } : null))
        .catch(() => {});
    }
  }, []);
        const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
          if (submitting) return; // guard against double submit
          setSubmitting(true);
    // Normalize inputs
    const trimmedCompany = companyName.trim();
    const trimmedSub = subdomain.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Tenant fields validation only when NOT joining via invite
    if (!inviteToken) {
      // Basic subdomain validation (true 2-30 length): start & end alphanumeric, hyphens allowed inside, all lowercase.
      const subdomainPattern = /^[a-z0-9][a-z0-9-]{0,28}[a-z0-9]$/; // length 2-30
      const reserved = new Set(["admin","api","app","www","root","support","help","billing"]);
      if (!subdomainPattern.test(trimmedSub)) {
        setError("Invalid subdomain. Use 2-30 lowercase letters, numbers or hyphens (no leading/trailing hyphen).");
        return;
      }
      if (reserved.has(trimmedSub)) {
        setError("That subdomain is reserved. Please choose another.");
        return;
      }
      if (!trimmedCompany) {
        setError("Company name required");
        return;
      }
    }

    // Email validation (Supabase also validates server-side; this gives quicker feedback)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setError(`Invalid email format`);
      return;
    }
    if (normalizedEmail.length > 320) { // practical upper bound
      setError('Email too long');
      return;
    }
    
    const supabase = createClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: trimmedName,
        }
      }
    });
    
    if (signUpError) {
      // Provide clearer mapping for common issues
      const raw = signUpError.message || 'Registration failed';
      let friendly = raw;
      if (/invalid email/i.test(raw)) friendly = 'Email address appears invalid.';
      if (/already registered|user already exists/i.test(raw)) friendly = 'An account with this email already exists.';
      if (/for security purposes/i.test(raw)) friendly = raw; // Supabase throttle: ask user to wait indicated seconds
      if (/rate limit/i.test(raw)) friendly = 'Too many attempts. Please wait a moment.';
      setError(friendly);
      if (process.env.NODE_ENV !== 'production') {
        console.error('[register] signUp error detail:', signUpError);
      }
      return;
    }
    const user = signUpData.user;
    const session = (signUpData as any).session;

    // If email confirmation required, user may be null; inform user to confirm first.
    if (!user || !session) {
      // Email confirmation is required; send user to login and return to invite to accept afterwards
      const next = inviteToken ? `/invite/${inviteToken}` : '/dashboard';
      const msg = inviteToken
        ? 'Check your email to confirm, then sign in to join your team.'
        : 'Check your email to confirm, then sign in to finish tenant setup.';
      router.push(`/login?message=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`);
      return;
    }

    // If invited, accept invitation instead of creating a tenant
    if (inviteToken) {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to accept invitation');
        return;
      }
      // Go to dashboard for the joined tenant
      router.push('/dashboard');
      return;
    }

    // Regular owner signup flow (no invite): create tenant
    const firstName = trimmedName.split(" ")[0] || trimmedName;
    const lastName = trimmedName.split(" ").slice(1).join(" ") || null;
    const { data: rpcData, error: rpcError } = await supabase.rpc('bootstrap_tenant_owner', {
      p_company_name: trimmedCompany,
      p_subdomain: trimmedSub,
      p_user_id: user.id,
      p_first_name: firstName,
      p_last_name: lastName
    });
    if (rpcError || !rpcData) {
      setError("Failed to bootstrap tenant: " + (rpcError?.message || 'Unknown'));
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* Left brand / marketing panel */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden p-10 items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--primary)]/15 via-[color:var(--accent)]/10 to-transparent" />
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[color:var(--primary)]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[color:var(--background)] to-transparent" />
        <div className="relative z-10 max-w-sm space-y-8">
          <div className="flex items-center">
            <Image src="/BizTool Logo.png" alt="BizTool Logo" width={220} height={64} className="h-auto w-[220px] drop-shadow-sm" priority />
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-[color:var(--foreground)]/80">
            <p>
              Create an account to access the full BizTool suite—built for MSMEs to move faster.
            </p>
            <ul className="space-y-2 text-[13px]">
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />Unified platform</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />Modular growth</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />Secure & reliable</li>
            </ul>
          </div>
          <div className="text-xs text-[color:var(--foreground)]/50">
            Your data stays yours.
          </div>
        </div>
      </div>

      {/* Auth panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 md:py-20">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center md:text-left space-y-2">
            <Link href="/" className="md:hidden inline-flex items-center justify-center space-x-2 mb-4 text-[color:var(--primary)] hover:opacity-90 transition">
              <span className="text-xl font-semibold">BizTool</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">{inviteToken ? 'Join your team' : 'Create your tenant'}</h1>
            <p className="text-sm text-[color:var(--foreground)]/60">
              {inviteToken
                ? <>You’re joining as {inviteMeta?.role || 'employee'}{inviteMeta?.tenantName ? <> at <span className="font-medium">{inviteMeta.tenantName}</span></> : null}.</>
                : 'Sign up as the owner. Employees will be invited later.'}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-sm p-6 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--card-bg)]/90 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!inviteToken && (
              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/70">
                  Company / Tenant Name
                </label>
                <div className="relative">
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-md border border-[color:var(--card-border)] bg-[color:var(--background)]/60 dark:bg-[color:var(--background)]/80 px-4 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/35 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40 focus:border-[color:var(--primary)] transition"
                    placeholder="Acme Industries"
                    required
                  />
                </div>
              </div>
              )}
              {!inviteToken && (
              <div className="space-y-2">
                <label htmlFor="subdomain" className="block text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/70">
                  Subdomain
                </label>
                <div className="relative flex">
                  <input
                    id="subdomain"
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                    className="flex-1 rounded-md border border-[color:var(--card-border)] bg-[color:var(--background)]/60 dark:bg-[color:var(--background)]/80 px-4 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/35 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40 focus:border-[color:var(--primary)] transition"
                    placeholder="acme"
                    required
                  />
                  <span className="ml-2 self-center text-xs text-[color:var(--foreground)]/60">.yourdomain.com</span>
                </div>
              </div>
              )}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/70">
                  Name
                </label>
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-[color:var(--card-border)] bg-[color:var(--background)]/60 dark:bg-[color:var(--background)]/80 px-4 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/35 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40 focus:border-[color:var(--primary)] transition"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/70">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--foreground)]/40" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-[color:var(--card-border)] bg-[color:var(--background)]/60 dark:bg-[color:var(--background)]/80 pl-10 pr-4 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/35 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40 focus:border-[color:var(--primary)] transition"
                    placeholder="you@company.com"
                    required
                    readOnly={inviteEmailLocked}
                    aria-readonly={inviteEmailLocked}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/70">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--foreground)]/40" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-[color:var(--card-border)] bg-[color:var(--background)]/60 dark:bg-[color:var(--background)]/80 pl-10 pr-12 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/35 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40 focus:border-[color:var(--primary)] transition"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/40 hover:text-[color:var(--foreground)]/70 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/70">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--foreground)]/40" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-[color:var(--card-border)] bg-[color:var(--background)]/60 dark:bg-[color:var(--background)]/80 pl-10 pr-12 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/35 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40 focus:border-[color:var,--primary)] transition"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
              <Button
                type="submit"
                className="w-full h-10 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white text-sm font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/40 focus-visible:outline-none transition"
              >
                {inviteToken ? 'Join Team' : 'Create Tenant'}
              </Button>
            </form>
            <div className="text-center text-xs text-[color:var(--foreground)]/60">
              <span>Already have an account? </span>
              <Link href="/login" className="font-medium text-[color:var(--primary)] hover:text-[color:var(--primary-hover)] transition">Sign in</Link>
            </div>
            <div className="border-t border-[color:var(--card-border)] pt-4 text-center">
              <p className="text-[10px] text-[color:var(--foreground)]/50 leading-relaxed">
                By signing up you agree to our
                <span className="mx-1" />
                <Link href="/terms" className="underline hover:text-[color:var(--foreground)]/80">Terms</Link>
                <span className="mx-1">•</span>
                <Link href="/privacy" className="underline hover:text-[color:var(--foreground)]/80">Privacy</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
