"use client";

import { motion } from "framer-motion";

interface DashboardHeaderProps {
  currentSavings?: number;
  monthLabel?: string;
}

export function DashboardHeader({
  currentSavings,
  monthLabel,
}: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-4xl relative overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 shadow-2xl shadow-black/30 ring-1 ring-white/10"
    >
      <div className="absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.25),transparent)]" />
      <div className="relative flex flex-col gap-4 text-white">
        <span className="text-sm uppercase tracking-[0.25em] text-white/50">
          Dashboard financiero mensual
        </span>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Buen mes, Patri 💪
        </h1>
        <p className="max-w-xl text-sm text-white/70">
          {currentSavings !== undefined ? (
            <>
              {monthLabel ? `${monthLabel}: ` : null}
              Has ahorrado{" "}
              <span className="font-semibold text-cyan-200">
                {currentSavings.toFixed(0)} €
              </span>
              . Cada euro cuenta para llegar a tu libertad financiera.
            </>
          ) : (
            "Sube tu extracto para ver cómo va tu plan de ahorro y recibir consejos al instante."
          )}
        </p>
      </div>
    </motion.header>
  );
}


