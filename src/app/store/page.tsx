"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store, Home } from "lucide-react";

export default function StorePage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Coming Soon Content */}
        <div className="text-center py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[color:var(--card-bg)] rounded-lg shadow-sm border border-[color:var(--card-border)] p-8">
              <Store className="h-24 w-24 text-purple-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Store Module</h2>
              <p className="text-lg mb-8">
                Retail management, inventory tracking, sales analytics, and e-commerce integration.
              </p>
              <div className="bg-[color:var(--muted)] border border-[color:var(--card-border)] rounded-lg p-4 mb-8">
                <h3 className="text-lg font-semibold mb-2">🚧 Coming Soon</h3>
                <p>
                  This module is currently under development. Check back soon for updates!
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <Link href="/">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white" aria-label="Home">
                    <Home className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">Login</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}