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
          {messaging ? messaging.title : "Organiza tus finanzas, Patri 🌟"}
        </h1>
        <p className="max-w-xl text-sm text-white/70">
          {messaging
            ? messaging.body
            : "Sube tu extracto para ver cómo va tu plan de ahorro y recibir consejos al instante."}
        </p>
      </div>
    </motion.header>
  );
}


