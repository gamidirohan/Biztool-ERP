"use client";
import Link from "next/link";
import { BurgerMenu } from "@/components/ui/burger-menu";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "./button";
import { authClient } from "@/lib/auth-client";

export function AppHeader() {
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-medium text-[color:var(--foreground)] py-2">Home</Link>
        <Link href="/manager" className="font-medium text-[color:var(--foreground)] py-2">Manager</Link>
        <Link href="/store" className="font-medium text-[color:var(--foreground)] py-2">Store</Link>
        <Link href="/attendance" className="font-medium text-[color:var(--foreground)] py-2">Attendance</Link>
        <Link href="/hr" className="font-medium text-[color:var(--foreground)] py-2">HR</Link>
      </div>
      <div className="flex items-center gap-4">
        <ModeToggle />
        {session ? (
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        ) : (
          <a href="/login">
            <Button>Sign In</Button>
          </a>
        )}
        <BurgerMenu />
      </div>
    </header>
  );
}
