"use client";
import Link from "next/link";
import { BurgerMenu } from "@/components/ui/burger-menu";
import { ModeToggle } from "@/components/ui/mode-toggle";

export function AppHeader() {
  return (
    <div className="w-full flex justify-between items-center px-4 py-3 border-b border-[color:var(--card-border)] bg-[color:var(--background)]">
      <BurgerMenu>
        <Link href="/" className="font-medium text-[color:var(--foreground)] py-2">Home</Link>
        <Link href="/manager" className="font-medium text-[color:var(--foreground)] py-2">Manager</Link>
        <Link href="/store" className="font-medium text-[color:var(--foreground)] py-2">Store</Link>
        <Link href="/attendance" className="font-medium text-[color:var(--foreground)] py-2">Attendance</Link>
        <Link href="/hr" className="font-medium text-[color:var(--foreground)] py-2">HR</Link>
      </BurgerMenu>
      <ModeToggle />
    </div>
  );
}
