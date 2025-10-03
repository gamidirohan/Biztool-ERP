// app-header.tsx
"use client";
import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "./button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Menu } from "lucide-react"; 
import { BurgerMenu } from "@/components/ui/burger-menu";
import { useRouter } from "next/navigation";

export function AppHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="flex items-center justify-between p-4 bg-[color:var(--card-bg)]/80 backdrop-blur-sm sticky top-0 z-50 border-b border-[color:var(--border)]">
      <div className="flex items-center gap-4">
        <Link href="/" aria-label="Home">
          <img 
            src="/BizTool Logo.png" 
            alt="BizTool Logo" 
            className="h-15 w-auto"
          />
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <ModeToggle />
        {user ? (
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        ) : (
          <a href="/login">
            <Button>Sign In</Button>
          </a>
        )}
        <button
          className="p-2 rounded-md hover:bg-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
          aria-label="Open menu"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="h-6 w-6 text-[color:var(--foreground)]" />
        </button>
      </div>
      <BurgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
}