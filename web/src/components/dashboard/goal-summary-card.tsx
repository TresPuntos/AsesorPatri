"use client";

import { motion } from "framer-motion";
import type { MonthSummary } from "@/lib/types";
import { buildMessaging } from "./header";

interface GoalSummaryCardProps {
  summary: MonthSummary;
  goal: number;
  previous?: MonthSummary;
  yearToDateSavings: number;
}

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function GoalSummaryCard({
  summary,
  goal,
  previous,
  yearToDateSavings,
}: GoalSummaryCardProps) {
  const messaging = buildMessaging(summary, goal);

  const percentage =
    goal === 0 ? 0 : Math.min(100, Math.round((summary.savings / goal) * 100));
  const remaining = Math.max(0, goal - summary.savings);
  const goalAchieved = percentage >= 100;
  const savingsDelta =
    previous && previous.savings !== undefined
      ? summary.savings - previous.savings
      : null;
  const balanceDelta =
    previous && previous.balance !== 0
      ? (summary.balance - previous.balance) / Math.abs(previous.balance)
      : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/85 via-slate-950/95 to-black p-6 text-white shadow-2xl shadow-black/30 ring-1 ring-cyan-500/5"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-40 h-72 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),transparent)]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.32em] text-white/50">
              Dashboard financiero mensual
            </span>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {messaging.title}
            </h1>
            <p className="max-w-xl text-sm text-white/70">{messaging.body}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.24em]">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
              {goalAchieved
                ? "Meta mensual superada"
                : `Faltan ${currency.format(remaining)}`}
            </span>
            {savingsDelta !== null ? (
              <span
                className={`rounded-full border px-3 py-1 ${
                  savingsDelta >= 0
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                    : "border-rose-400/30 bg-rose-500/10 text-rose-100"
                }`}
              >
                {savingsDelta >= 0 ? "↑" : "↓"} {currency.format(Math.abs(savingsDelta))} vs mes anterior
              </span>
            ) : null}
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">
              Ahorro acumulado {currency.format(yearToDateSavings)}
            </span>
            {balanceDelta !== null ? (
              <span
                className={`rounded-full border px-3 py-1 ${
                  balanceDelta >= 0
                    ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100"
                    : "border-rose-400/30 bg-rose-500/10 text-rose-100"
                }`}
              >
                Balance {balanceDelta >= 0 ? "↑" : "↓"} {percent.format(balanceDelta)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-3 rounded-3xl border border-white/10 bg-black/40 p-5 shadow-inner shadow-black/20 sm:w-auto">
          <div className="relative h-32 w-32">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#22d3ee ${percentage}%, rgba(255,255,255,0.08) ${percentage}%)`,
              }}
            />
            <div className="absolute inset-[12%] rounded-full bg-slate-950/90 backdrop-blur">
              <div className="flex h-full flex-col items-center justify-center gap-1">
                <span className="text-xs uppercase tracking-[0.18em] text-white/50">
                  Ahorro
                </span>
                <span className="text-xl font-semibold">
                  {currency.format(summary.savings)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-white/60">
            <p>
              {goalAchieved
                ? "Reserva el extra para acelerar tus objetivos."
                : `Necesitas ${currency.format(remaining)} para alcanzar la meta.`}
            </p>
            <p>
              {summary.balance >= 0
                ? `Balance actual: ${currency.format(summary.balance)}`
                : `Balance negativo: ${currency.format(summary.balance)}`}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}


