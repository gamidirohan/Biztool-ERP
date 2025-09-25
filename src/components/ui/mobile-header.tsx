"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { DefaultAvatar } from "./default-avatar";
import { BurgerMenu } from "./burger-menu";

interface MobileHeaderProps {
  companyName: string;
  userRole?: string;
  avatarUrl?: string;
}

export function MobileHeader({ companyName, userRole = "Owner", avatarUrl }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <div 
                className="aspect-square size-10 rounded-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              />
            ) : (
              <DefaultAvatar className="size-10" />
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground">{companyName}</h1>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              {userRole}
            </span>
          </div>
        </div>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted"
          aria-label="Open menu"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>
      <BurgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}