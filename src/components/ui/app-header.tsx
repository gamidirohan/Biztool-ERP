// app-header.tsx
"use client";
import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "./button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import { Menu, Home, X } from "lucide-react"; 
import { BurgerMenu } from "@/components/ui/burger-menu";

export function AppHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const supabase = createClient();

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
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <Link href="/" aria-label="Home">
          <Home className="h-6 w-6 text-[color:var(--foreground)]" />
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
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700"
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