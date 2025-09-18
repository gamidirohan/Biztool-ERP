"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase will redirect here with an access token in the URL hash.
    // When this page loads, the client library should establish a session automatically.
    // We give it a tiny tick and then consider the page ready for password reset.
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || loading) return;
    setMessage(null);
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || "Failed to update password");
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully. Redirecting to sign in…");
    setTimeout(() => router.push("/login"), 900);
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
            <p>Set a new password for your account.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 md:py-20">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center md:text-left space-y-2">
            <Link href="/" className="md:hidden inline-flex items-center justify-center space-x-2 mb-4 text-[color:var(--primary)] hover:opacity-90 transition">
              <span className="text-xl font-semibold">BizTool</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
            <p className="text-sm text-[color:var(--foreground)]/60">Enter a new password for your account.</p>
          </div>

          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-sm p-6 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--card-bg)]/90 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/70">New Password</label>
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
                    autoComplete="new-password"
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
                <label htmlFor="confirm" className="block text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/70">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--foreground)]/40" />
                  <input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border border-[color:var(--card-border)] bg-[color:var(--background)]/60 dark:bg-[color:var(--background)]/80 pl-10 pr-12 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/35 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40 focus:border-[color:var(--primary)] transition"
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {message && <p className="text-sm text-green-700 dark:text-green-400" role="status">{message}</p>}
              {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full h-10 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white text-sm font-medium">
                {loading ? "Updating…" : "Update password"}
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
