"use client";

import { useEffect, useState } from "react";
import { MoonStar, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70"
        aria-label="Cambiar tema"
      />
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white shadow-lg shadow-black/30 ring-1 ring-white/10 transition hover:bg-black/60 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:ring-slate-700/60"
      aria-label="Cambiar tema"
    >
      {isDark ? <Sun className="size-5" /> : <MoonStar className="size-5" />}
    </button>
  );
}


