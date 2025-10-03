// burger-menu.tsx
"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface BurgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BurgerMenu({ isOpen, onClose }: BurgerMenuProps) {
  const [user, setUser] = useState<User | null>(null); // Updated type to match Supabase user object
  const [attendanceActive, setAttendanceActive] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Determine tenant and attendance module status
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("tenant_id,role")
          .eq("id", user.id)
          .single();
        if (profile?.role) setRole(profile.role);
        const tenantId = profile?.tenant_id;
        if (tenantId) {
          // Try effective view first
          const { data: mods, error: viewErr } = await supabase
            .from("tenant_effective_modules")
            .select("code,status")
            .eq("tenant_id", tenantId)
            .eq("code", "attendance");
          if (!viewErr && mods && mods.length > 0) {
            const status = (mods[0] as { status: string }).status;
            setAttendanceActive(["active","subscribed","trial"].includes(status));
          } else {
            // Fallback to raw subscriptions table
            const { data: subs } = await supabase
              .from("tenant_module_subscriptions")
              .select("module_code,status")
              .eq("tenant_id", tenantId)
              .eq("module_code", "attendance")
              .in("status", ["active","trial"]);
            setAttendanceActive(Boolean(subs && subs.length > 0));
          }
        }
      } else {
        setAttendanceActive(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  const canSeeManager = role ? ["manager","admin","owner"].includes(role) : false;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Menu */}
      <div className="relative w-80 bg-[color:var(--background)] shadow-2xl rounded-r-2xl border-r border-[color:var(--card-border)] p-4">
        <div className="flex items-center justify-between p-4 border-b border-[color:var(--card-border)]">
          <Image
            src="/BizTool Logo.png"
            alt="BizTool Logo"
            width={250}
            height={80} 
            className="h-[80px] w-[250px]"
          />
          <button
            onClick={onClose}
            className="text-[color:var(--foreground)] hover:text-[color:var(--muted)] focus:outline-none"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-4 mt-4">
          <a href="/dashboard" className="block text-[color:var(--foreground)] hover:bg-[color:var(--button-hover-bg)] hover:text-[color:var(--button-hover-text)] rounded-md px-2 py-1 transition-colors">Dashboard</a>
          {canSeeManager && (
            <a href="/manager" className="block text-[color:var(--foreground)] hover:bg-[color:var(--button-hover-bg)] hover:text-[color:var(--button-hover-text)] rounded-md px-2 py-1 transition-colors">Manager</a>
          )}
          <a href="/store" className="block text-[color:var(--foreground)] hover:bg-[color:var(--button-hover-bg)] hover:text-[color:var(--button-hover-text)] rounded-md px-2 py-1 transition-colors">Store</a>
          {attendanceActive && (
            <a href="/attendance" className="block text-[color:var(--foreground)] hover:bg-[color:var(--button-hover-bg)] hover:text-[color:var(--button-hover-text)] rounded-md px-2 py-1 transition-colors">Attendance</a>
          )}
          <a href="/hr" className="block text-[color:var(--foreground)] hover:bg-[color:var(--button-hover-bg)] hover:text-[color:var(--button-hover-text)] rounded-md px-2 py-1 transition-colors">HR</a>
        </nav>

        {/* Footer */}
        <div className="mt-4 border-t border-[color:var(--card-border)] pt-4 flex flex-col items-center space-y-4">
          <div className="self-start">
            <ModeToggle />
          </div>
          {user ? (
            <Button
              variant="outline"
              className="w-full text-center hover:bg-[color:var(--button-hover-bg)] hover:text-[color:var(--button-hover-text)]"
              onClick={handleSignOut}
            >Sign Out</Button>
          ) : (
            <a href="/login" className="w-full">
              <Button
                variant="outline"
                className="w-full text-center hover:bg-[color:var(--button-hover-bg)] hover:text-[color:var(--button-hover-text)]"
              >Sign In</Button>
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}