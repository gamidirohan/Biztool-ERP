"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message || "Login failed");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
              Manage operations, CRM, HR and finance from a unified, mobile‑first platform designed for MSMEs.
            </p>
            <ul className="space-y-2 text-[13px]">
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />Secure authentication</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />Modular & scalable</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />Fast mobile experience</li>
            </ul>
          </div>
          <div className="text-xs text-[color:var(--foreground)]/50">
            Built for clarity, speed & control.
          </div>
        </div>
      </div>

      {/* Auth panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 md:py-20">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center md:text-left space-y-2">
            <Link href="/" className="md:hidden inline-flex items-center justify-center space-x-2 mb-4 text-[color:var(--primary)] hover:opacity-90 transition">
              <Image src="/BizTool Logo.png" alt="BizTool Logo" width={32} height={32} className="h-8 w-8" />
              <span className="text-xl font-semibold">BizTool</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-[color:var(--foreground)]/60">Enter your credentials to access your dashboard.</p>
          </div>
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-sm p-6 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--card-bg)]/90 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    autoComplete="email"
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
                    autoComplete="current-password"
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
              {errorMsg && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">{errorMsg}</p>
              )}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 select-none">
                  <input type="checkbox" className="h-4 w-4 rounded border-[color:var(--card-border)] text-[color:var(--primary)] focus:ring-[color:var(--primary)]/40" />
                  <span className="text-xs text-[color:var(--foreground)]/60">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-xs font-medium text-[color:var(--primary)] hover:text-[color:var(--primary-hover)] transition">
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white text-sm font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/40 focus-visible:outline-none transition"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="text-center text-xs text-[color:var(--foreground)]/60">
              <span>Don't have an account? </span>
              <Link href="/register" className="font-medium text-[color:var(--primary)] hover:text-[color:var(--primary-hover)] transition">Create one</Link>
            </div>
            <div className="border-t border-[color:var(--card-border)] pt-4 text-center">
              <p className="text-[10px] text-[color:var(--foreground)]/50 leading-relaxed">
                By signing in you agree to our
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
