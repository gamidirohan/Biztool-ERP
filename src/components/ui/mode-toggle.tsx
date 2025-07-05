"use client";
import * as React from "react";
import { Button } from "../ui/button";
import { useTheme } from "../theme-provider";

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      {...props}
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      {...props}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  // Only toggle between light and dark on button click
  const handleToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={handleToggle}
    >
      <SunIcon className={`h-5 w-5 transition-all text-yellow-500 ${theme === 'dark' ? 'scale-0 rotate-90' : 'scale-100 rotate-0'}`} />
      <MoonIcon className={`absolute h-5 w-5 transition-all text-gray-900 dark:text-yellow-400 ${theme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
