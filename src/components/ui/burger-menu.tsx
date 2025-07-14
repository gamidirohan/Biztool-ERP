"use client";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";

export function BurgerMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-6 w-6 text-[color:var(--foreground)]" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end">
          <div className="w-72 max-w-full h-full bg-[color:var(--background)] shadow-lg p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-lg tracking-tight text-[color:var(--foreground)]" style={{fontFamily:'var(--font-sans)'}}>Menu</span>
              <button
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-6 w-6 text-[color:var(--foreground)]" />
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              {children}
            </div>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}