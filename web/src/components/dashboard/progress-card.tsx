"use client";

import { motion } from "framer-motion";

interface ProgressCardProps {
  goal: number;
  current: number;
  previousSavings: number | null;
  yearToDateSavings?: number;
}

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function ProgressCard({
  goal,
  current,
  previousSavings,
  yearToDateSavings,
}: ProgressCardProps) {
  const percentage = goal === 0 ? 0 : Math.min(100, Math.round((current / goal) * 100));
  const remaining = Math.max(0, goal - current);
  const goalAchieved = percentage >= 100;
  const delta =
    previousSavings !== null && previousSavings !== undefined
      ? current - previousSavings
      : null;
  const ytdValue = yearToDateSavings ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.45 }}
      className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/85 via-slate-950 to-black p-6 text-white shadow-xl ring-1 ring-white/10 backdrop-blur"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">
            Objetivo del mes
          </p>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <p className="text-4xl font-semibold tracking-tight">
              {goalAchieved ? "¡Meta superada! 🚀" : `Llevas ${percentage}%`}
            </p>
            {delta !== null ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                  delta >= 0
                    ? "bg-emerald-500/15 text-emerald-200"
                    : "bg-rose-500/15 text-rose-200"
                }`}
              >
                {delta >= 0 ? "↑" : "↓"} {currency.format(Math.abs(delta))} vs mes anterior
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-300/70">
            {goalAchieved
              ? "Reserva el extra en tu fondo de emergencia o avanza tu inversión preferida."
              : `Te faltan ${currency.format(remaining)} para alcanzar los ${currency.format(goal)}.`}
          </p>
          {ytdValue !== null ? (
            <p className="text-xs uppercase tracking-[0.28em] text-white/50">
              Ahorro acumulado {currency.format(ytdValue)}
            </p>
          ) : null}
        </div>
        <div className="relative h-32 w-32">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#22d3ee ${percentage}%, rgba(255,255,255,0.08) ${percentage}%)`,
            }}
          />
          <div className="absolute inset-[12%] rounded-full bg-slate-950/90 backdrop-blur">
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <span className="text-xs uppercase tracking-[0.1em] text-slate-300/70">
                Ahorro
              </span>
              <span className="text-xl font-semibold">{currency.format(current)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


