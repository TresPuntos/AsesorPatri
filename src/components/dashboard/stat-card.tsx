"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const gradients: Record<string, string> = {
  positive: "from-emerald-400/90 via-emerald-500/60 to-emerald-900/40",
  negative: "from-rose-400/90 via-rose-500/60 to-rose-900/40",
  neutral: "from-slate-400/90 via-slate-500/60 to-slate-900/40",
};

type StatCardTone = keyof typeof gradients;

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  tone?: StatCardTone;
  footer?: string;
}

export function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
  footer,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/5 bg-black/60 p-6 text-white shadow-lg shadow-black/30 ring-1 ring-white/10 backdrop-blur-xl",
        "dark:border-white/5 dark:bg-white/5 dark:text-white dark:ring-white/10",
        "light:border-slate-200/60 light:bg-white light:text-slate-900 light:ring-slate-200/60",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 -top-20 h-40 opacity-50 blur-3xl",
          `bg-gradient-to-br ${gradients[tone] ?? gradients.neutral}`,
        )}
      />
      <div className="relative flex flex-col gap-4">
        <span className="text-sm uppercase tracking-[0.2em] text-slate-300/80 dark:text-slate-100/60">
          {label}
        </span>
        <div className="text-4xl font-semibold tracking-tight">{value}</div>
        {delta ? (
          <span className="text-sm text-slate-400 dark:text-slate-200/70">
            {delta}
          </span>
        ) : null}
        {footer ? (
          <span className="text-xs text-slate-500/90 dark:text-slate-300/60">
            {footer}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}


