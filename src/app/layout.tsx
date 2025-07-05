"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { BurgerMenu } from "@/components/ui/burger-menu";
import Link from "next/link";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { useState } from "react";
import { ModeToggle } from "@/components/ui/mode-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function Header() {
  // Simulated auth state (replace with real auth logic)
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b border-[color:var(--card-border)] bg-[color:var(--background)]">
      {/* Left: Burger */}
      <div className="flex items-center gap-2">
        <BurgerMenu>
          <div className="flex flex-col gap-2 p-2">
            <Link
              href="/"
              className="font-medium text-[color:var(--foreground)] py-2"
            >
              Home
            </Link>
            <Link
              href="/manager"
              className="font-medium text-[color:var(--foreground)] py-2"
            >
              Manager
            </Link>
            <Link
              href="/store"
              className="font-medium text-[color:var(--foreground)] py-2"
            >
              Store
            </Link>
            <Link
              href="/attendance"
              className="font-medium text-[color:var(--foreground)] py-2"
            >
              Attendance
            </Link>
            <Link
              href="/hr"
              className="font-medium text-[color:var(--foreground)] py-2"
            >
              HR
            </Link>
            <div className="border-t border-[color:var(--card-border)] my-2"></div>
            <span className="font-semibold text-xs text-gray-500 uppercase tracking-wider mt-2 mb-1">
              Theme
            </span>
            {/* Theme toggle button */}
            <ModeToggle />
          </div>
        </BurgerMenu>
      </div>
      {/* Center: Logo/Name */}
      <span
        className="font-bold text-lg tracking-tight text-[color:var(--foreground)]"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        Biztool
      </span>
      {/* Right: Profile/Login */}
      <div className="relative">
        {user ? (
          <button
            className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            onClick={() => setShowMenu((v) => !v)}
            aria-label="Profile menu"
          >
            <DefaultAvatar className="h-8 w-8" />
          </button>
        ) : (
          <Link href="/login">
            <button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none">
              <DefaultAvatar className="h-8 w-8" />
              <span className="font-medium text-[color:var(--foreground)] hidden sm:inline">
                Login
              </span>
            </button>
          </Link>
        )}
        {/* Profile dropdown */}
        {user && showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded shadow-lg border border-gray-200 dark:border-gray-800 z-50">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="font-semibold text-[color:var(--foreground)]">
                {user.name}
              </div>
            </div>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-[color:var(--foreground)]"
              onClick={() => {
                setUser(null);
                setShowMenu(false);
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
