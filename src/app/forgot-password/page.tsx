"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setMessage(null);
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });

    if (resetError) {
      setError(resetError.message || "Failed to send reset email");
    } else {
      setMessage("If an account exists for that email, we've sent a reset link.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden p-10 items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--primary)]/15 via-[color:var(--accent)]/10 to-transparent" />
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[color:var(--primary)]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[color:var(--background)] to-transparent" />
        <div className="relative z-10 max-w-sm space-y-8">
          <div className="flex items-center">
            <Image src="/BizTool Logo.png" alt="BizTool Logo" width={220} height={64} className="h-auto w-[220px] drop-shadow-sm" priority />
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-[color:var(--foreground)]/80">
            <p>We’ll email you a secure link to reset your password.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 md:py-20">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center md:text-left space-y-2">
            <Link href="/" className="md:hidden inline-flex items-center justify-center space-x-2 mb-4 text-[color:var(--primary)] hover:opacity-90 transition">
              <span className="text-xl font-semibold">BizTool</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
            <p className="text-sm text-[color:var(--foreground)]/60">Enter your email and we’ll send you a reset link.</p>
          </div>

          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-sm p-6 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--card-bg)]/90 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/70">Email</label>
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
              {message && <p className="text-sm text-green-700 dark:text-green-400" role="status">{message}</p>}
              {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full h-10 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white text-sm font-medium">
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
            <div className="text-center text-xs text-[color:var(--foreground)]/60">
              <Link href="/login" className="font-medium text-[color:var(--primary)] hover:text-[color:var(--primary-hover)] transition">Back to sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
