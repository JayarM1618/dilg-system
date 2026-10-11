"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { focusRing } from "./public/PublicFrame";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={`fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-3xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/40 dark:border-white/10 text-[#5A18C9] dark:text-[#E9DFFF] transition-all duration-500 ease-out hover:rotate-12 hover:scale-110 hover:bg-white/60 dark:hover:bg-black/40 hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,1)] dark:hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] ${focusRing}`}
      aria-label="Toggle theme"
    >
      <span className="dark:hidden">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </span>
      <span className="hidden dark:block">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </span>
    </button>
  );
}
