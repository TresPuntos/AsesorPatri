"use client";

import { motion } from "framer-motion";
import type { MonthSummary } from "@/lib/types";

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
  const defaultTips = [
    "Ahorrar primero te da paz mental",
    "Revisa suscripciones y ocio cada semana",
    "Un día low-cost = más colchón para ti",
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 shadow-2xl shadow-black/30 ring-1 ring-white/10"
    >
      <div className="absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.25),transparent)]" />
      <div className="relative flex flex-col gap-6 text-white md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white/60 shadow-inner shadow-cyan-400/10">
            Dashboard financiero mensual
          </span>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {messaging ? messaging.title : "Organiza tus finanzas, Patri 🌟"}
          </h1>
          <p className="max-w-lg text-sm text-white/70">
            {messaging
              ? messaging.body
              : "Sube tu extracto para ver cómo va tu plan de ahorro y recibir consejos al instante."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:max-w-xs">
          {defaultTips.map((tip) => (
            <span
              key={tip}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 shadow-inner shadow-black/20"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              {tip}
            </span>
          ))}
        </div>
      </div>
    </motion.header>
  );
}


