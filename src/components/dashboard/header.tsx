'use client';

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { MonthSummary } from "@/lib/types";
import { ThemeToggle } from "../theme-toggle";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

interface DashboardHeaderProps {
  summary?: MonthSummary;
  goal: number;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildMessaging(summary: MonthSummary, goal: number) {
  const savings = summary.savings;
  const goalAchieved = savings >= goal;
  const positive = savings >= 0;
  const gap = goal - savings;

  if (goalAchieved) {
    return {
      title: "¡Objetivo conseguido, Patri! 🚀",
      body: `${capitalize(summary.label)}: Has ahorrado ${currency.format(
        savings,
      )}. Reserva parte de este impulso para tus metas cripto.`,
    };
  }

  if (positive && gap <= goal * 0.25) {
    return {
      title: "Lo tienes al alcance, Patri 🙌",
      body: `${capitalize(
        summary.label,
      )}: Llevas ${currency.format(
        savings,
      )} acumulados. Con ${currency.format(gap)} más, alcanzamos el reto.`,
    };
  }

  if (positive) {
    return {
      title: "Seguimos sumando, Patri ⚡️",
      body: `${capitalize(
        summary.label,
      )}: Ya ahorraste ${currency.format(
        savings,
      )}. Ajustemos algunos gastos para cubrir los ${currency.format(
        gap,
      )} que faltan.`,
    };
  }

  return {
    title: "Toca remontar, Patri 💡",
    body: `${capitalize(summary.label)}: Vamos ${currency.format(
      Math.abs(savings),
    )} por debajo. Revisemos ocio y suscripciones para darle la vuelta este mes.`,
  };
}

export function DashboardHeader({ summary, goal }: DashboardHeaderProps) {
  const messaging = summary ? buildMessaging(summary, goal) : null;
  const tasks = [
    "Guardar primero 50 € al cobrar y apartarlos en tu cuenta cripto.",
    "Revisar suscripciones y cancelar las que no uses.",
    "Planear un día low-cost para suavizar Supermercado y Ocio.",
  ];

  const { percentage, remaining, currentSavings } = useMemo(() => {
    if (!summary) {
      return {
        percentage: 0,
        remaining: Math.max(0, goal),
        currentSavings: 0,
      };
    }

    if (goal === 0) {
      return {
        percentage: 0,
        remaining: 0,
        currentSavings: summary.savings,
      };
    }

    const pct = Math.round((summary.savings / goal) * 100);

    return {
      percentage: pct,
      remaining: Math.max(0, goal - summary.savings),
      currentSavings: summary.savings,
    };
  }, [goal, summary]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 text-white shadow-2xl shadow-black/30 ring-1 ring-white/10"
    >
      <div className="absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.25),transparent)]" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 lg:flex-1">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white/60 shadow-inner shadow-cyan-400/10">
                Dashboard financiero mensual
              </span>
              <ThemeToggle />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {messaging ? messaging.title : "Organiza tus finanzas, Patri 🌟"}
              </h1>
              <p className="max-w-xl text-sm text-white/70">
                {messaging
                  ? messaging.body
                  : "Sube tu extracto para ver cómo va tu plan de ahorro y recibir consejos al instante."}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <div
                  key={task}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 shadow-inner shadow-black/30"
                >
                  <CheckCircle2 className="mt-0.5 size-4 text-cyan-300" />
                  <span>{task}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/80 shadow-inner shadow-black/30 backdrop-blur lg:mt-0">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">
              Objetivo del mes
            </div>
            <div>
              <p className="text-sm text-white/60">Llevas</p>
              <p className="text-3xl font-semibold tracking-tight text-white">
                {Number.isFinite(percentage) ? percentage : 0}%
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3 shadow-inner shadow-black/20">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/50">
                <span>Ahorro actual</span>
                <span
                  className={
                    currentSavings >= 0 ? "text-emerald-200" : "text-rose-200"
                  }
                >
                  {currency.format(currentSavings)}
                </span>
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">
              Te faltan {currency.format(remaining)} para alcanzar los {currency.format(goal)}.
            </p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

