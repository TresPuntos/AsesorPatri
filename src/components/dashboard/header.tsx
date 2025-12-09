'use client';

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Lightbulb, Sparkles } from "lucide-react";
import type { MonthSummary } from "@/lib/types";
import { ThemeToggle } from "../theme-toggle";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type DashboardPeriod = "monthly" | "yearly";

export interface DashboardTask {
  id: string;
  title: string;
  description: string;
  success: string;
  impact?: string;
}

export interface HeaderNarrativeContext {
  comparisonLabel?: string;
  incomeDelta?: number | null;
  expenseDelta?: number | null;
  balanceDelta?: number | null;
  topExpenseCategory?: {
    name: string;
    amount: number;
    share: number;
    variation?: number | null;
  };
  topIncomeCategory?: {
    name: string;
    amount: number;
    share: number;
    variation?: number | null;
  };
  goalGap?: number;
  pendingTransactions?: number;
}

interface DashboardHeaderProps {
  summary?: MonthSummary;
  goal: number;
  period?: DashboardPeriod;
  tasks: DashboardTask[];
  context?: HeaderNarrativeContext;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildMessaging(
  summary: MonthSummary,
  goal: number,
  period: DashboardPeriod,
  context?: HeaderNarrativeContext,
) {
  const savings = summary.savings;
  const goalAchieved = savings >= goal;
  const positive = savings >= 0;
  const gap = goal - savings;
  const timeRef = period === "yearly" ? "este año" : "este mes";
  const comparison = context?.comparisonLabel
    ? `frente a ${context.comparisonLabel}`
    : `en ${timeRef}`;
  const topExpense = context?.topExpenseCategory;
  const topIncome = context?.topIncomeCategory;
  const formatShare = (share?: number) =>
    typeof share === "number" ? `${share.toFixed(1)} %` : "";

  const highlight =
    topExpense && topExpense.amount > 0
      ? `Tu mayor desvío está en ${topExpense.name}: ${currency.format(
          topExpense.amount,
        )} (${formatShare(topExpense.share)} del gasto).`
      : topIncome && topIncome.amount > 0
        ? `Tu impulsor principal de ingresos es ${topIncome.name} con ${currency.format(
            topIncome.amount,
          )} (${formatShare(topIncome.share)}).`
        : null;

  if (goalAchieved) {
    return {
      title: "¡Objetivo conseguido, Patri! 🚀",
      body: `${capitalize(summary.label)}: Has ahorrado ${currency.format(
        savings,
      )} ${comparison}. Mantén una reserva para seguir invirtiendo con cabeza.`,
      highlight:
        highlight ??
        (gap < 0
          ? `Llevas ${currency.format(Math.abs(gap))} extra sobre el objetivo. Decide hoy dónde guardarlo.`
          : null),
    };
  }

  if (positive && gap <= goal * 0.25) {
    return {
      title: "Lo tienes al alcance, Patri 🙌",
      body: `${capitalize(summary.label)}: Llevas ${currency.format(
        savings,
      )} acumulados ${comparison}. Con ${currency.format(gap)} más, alcanzamos el reto.`,
      highlight,
    };
  }

  if (positive) {
    return {
      title: "Seguimos sumando, Patri ⚡️",
      body: `${capitalize(summary.label)}: Ya ahorraste ${currency.format(
        savings,
      )}. Ajustemos categorías clave para cubrir los ${currency.format(
        gap,
      )} que faltan ${timeRef}.`,
      highlight,
    };
  }

  return {
    title: "Toca remontar, Patri 💡",
    body: `${capitalize(summary.label)}: Vamos ${currency.format(
      Math.abs(savings),
    )} por debajo. Revisemos ocio y suscripciones para darle la vuelta ${timeRef}.`,
    highlight:
      highlight ??
      (context?.expenseDelta && context.expenseDelta > 0
        ? `Los gastos subieron ${Math.round(context.expenseDelta * 100)} % ${comparison}. Pausa dos partidas puntuales para recuperar margen.`
        : null),
  };
}

const DONUT_RADIUS = 42;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const VISUAL_DONUT_RADIUS = DONUT_RADIUS + 18;
const VISUAL_DONUT_CIRCUMFERENCE = 2 * Math.PI * VISUAL_DONUT_RADIUS;

export function DashboardHeader({
  summary,
  goal,
  period = "monthly",
  tasks,
  context,
}: DashboardHeaderProps) {
  const descriptor = period === "yearly" ? "anual" : "mensual";
  const objectiveLabel = period === "yearly" ? "Objetivo anual" : "Objetivo del mes";
  const messaging = summary ? buildMessaging(summary, goal, period, context) : null;
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [celebrating, setCelebrating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCompleted({});
    setCelebrating({});
  }, [tasks]);

  const toggleTask = (taskId: string) => {
    setCompleted((prev) => {
      const nextCompleted = !prev[taskId];
      const updated = { ...prev, [taskId]: nextCompleted };
      if (nextCompleted) {
        setCelebrating((prevCelebrating) => ({
          ...prevCelebrating,
          [taskId]: true,
        }));
        window.setTimeout(() => {
          setCelebrating((prevCelebrating) => ({
            ...prevCelebrating,
            [taskId]: false,
          }));
        }, 900);
      }
      return updated;
    });
  };

  const { percentage, remaining, currentSavings, normalizedProgress } = useMemo(
    () => {
      if (!summary) {
        return {
          percentage: 0,
          remaining: Math.max(0, goal),
          currentSavings: 0,
          normalizedProgress: 0,
        };
      }

      if (goal === 0) {
        return {
          percentage: 0,
          remaining: 0,
          currentSavings: summary.savings,
          normalizedProgress: 0,
        };
      }

      const pct = Math.round((summary.savings / goal) * 100);
      const normalized = Math.min(100, Math.max(0, pct));

      return {
        percentage: pct,
        remaining: Math.max(0, goal - summary.savings),
        currentSavings: summary.savings,
        normalizedProgress: normalized,
      };
    },
    [goal, summary],
  );

  const dashOffset = DONUT_CIRCUMFERENCE * (1 - normalizedProgress / 100);
  const percentageLabel =
    Number.isFinite(percentage) && summary ? Math.max(-999, Math.min(999, percentage)) : 0;
  const remainingMessage = summary
    ? currentSavings >= goal
      ? "Objetivo superado. ¡Reserva este impulso!"
      : `Te faltan ${currency.format(remaining)} para alcanzar los ${currency.format(goal)}.`
    : `Tu objetivo es ahorrar ${currency.format(goal)} ${descriptor === "anual" ? "cada año" : "este mes"}.`;
  const savingsStatus = summary
    ? currentSavings >= 0
      ? `Llevas ${currency.format(currentSavings)} apartados.`
      : `Vamos ${currency.format(Math.abs(currentSavings))} por debajo del objetivo.`
    : "Sube tu extracto para ver tu avance real.";

  return (
    <motion.header
      id="dashboard-resumen"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-7 text-white shadow-2xl shadow-black/30 ring-1 ring-white/10"
    >
      <div className="absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.22),transparent)]" />
      <div className="relative flex flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white/60 shadow-inner shadow-cyan-400/10">
                Dashboard financiero {descriptor}
              </span>
              {summary ? (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/50">
                  {summary.label}
                </span>
              ) : null}
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-[34px]">
                {messaging ? messaging.title : "Organiza tus finanzas, Patri 🌟"}
              </h1>
              <p className="max-w-2xl text-sm text-white/70">
                {messaging
                  ? messaging.body
                  : "Sube tu extracto para ver cómo va tu plan de ahorro y recibir consejos al instante."}
              </p>
              {messaging?.highlight ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-100">
                  <Lightbulb className="size-4" />
                  {messaging.highlight}
                </div>
              ) : null}
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-inner shadow-black/25 backdrop-blur">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">{objectiveLabel}</p>
                  <h2 className="text-[38px] font-semibold leading-tight text-white">
                    {currency.format(goal)}
                  </h2>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">
                    {summary ? capitalize(summary.label) : "Sin periodo seleccionado"}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Ahorro actual</p>
                    <p
                      className={`text-[28px] font-semibold ${
                        currentSavings >= 0 ? "text-emerald-200" : "text-rose-200"
                      }`}
                    >
                      {currency.format(currentSavings)}
                    </p>
                    <p className="text-sm text-white/70">{savingsStatus}</p>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Próximo hito</p>
                    <p className="text-base text-white/75">{remainingMessage}</p>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-cyan-400/90 transition-all"
                          style={{ width: `${Math.max(0, Math.min(100, normalizedProgress))}%` }}
                        />
                      </div>
                      <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100">
                        {Math.max(0, Math.min(100, normalizedProgress))}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-white/10 bg-black/30 p-6">
                <svg className="h-full w-full" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r={VISUAL_DONUT_RADIUS}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r={VISUAL_DONUT_RADIUS}
                    stroke="#22d3ee"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={VISUAL_DONUT_CIRCUMFERENCE}
                    strokeDashoffset={
                      VISUAL_DONUT_CIRCUMFERENCE * (1 - normalizedProgress / 100)
                    }
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                  <span className="text-[11px] uppercase tracking-[0.28em] text-white/60">
                    Llevas
                  </span>
                  <span className="text-3xl font-semibold">
                    {Number.isFinite(percentageLabel) ? percentageLabel : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <a
                href="#actualiza-datos"
                className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 px-6 py-2.5 text-sm font-semibold text-cyan-50 shadow-inner shadow-cyan-400/20 transition hover:border-cyan-300/70 hover:bg-cyan-500/30 hover:text-white"
              >
                Subir extracto y recalcular
              </a>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">
                Actualiza tus datos para ajustar métricas y alertas.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80 shadow-inner shadow-black/25 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">Plan de acción guiado</p>
                <p className="text-sm text-white/60">
                  Marca cada paso cuando lo tengas listo y celebra el progreso.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/45">
                Vista {descriptor}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/70">
                  Añadiremos acciones en cuanto cargues más movimientos. Mientras tanto, vigila tus alertas y clasifica los pendientes.
                </div>
              ) : null}
              {tasks.map(({ id, title, description, success, impact }, index) => {
                const isDone = Boolean(completed[id]);
                const isCelebrating = Boolean(celebrating[id]);
                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => toggleTask(id)}
                    whileTap={{ scale: 0.98 }}
                    animate={{
                      backgroundColor: isDone ? "rgba(16,185,129,0.15)" : "rgba(15,23,42,0.55)",
                      borderColor: isDone ? "rgba(16,185,129,0.55)" : "rgba(255,255,255,0.12)",
                      color: isDone ? "rgba(240,253,244,1)" : "rgba(226,232,240,0.85)",
                    }}
                    className="group flex flex-col gap-3 rounded-2xl border px-5 py-4 text-left text-sm shadow-inner shadow-black/25 transition hover:border-cyan-300/60 hover:bg-black/45"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">
                          Paso {index + 1}
                        </p>
                        <h3 className="text-base font-semibold text-white">{title}</h3>
                      </div>
                      <div className="flex items-start gap-2">
                        <motion.span
                          layout
                          animate={{
                            scale: isCelebrating ? 1.2 : 1,
                          }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          className={`inline-flex size-7 items-center justify-center rounded-full border text-xs font-semibold transition ${
                            isDone
                              ? "border-emerald-300 bg-emerald-200 text-slate-950"
                              : "border-cyan-400/70 bg-cyan-500/20 text-cyan-100"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="size-4" /> : "✓"}
                        </motion.span>
                        {impact ? (
                          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                            {impact}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={isDone ? `${id}-done` : `${id}-idea`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="leading-relaxed text-white/80"
                      >
                        {isDone ? success : description}
                      </motion.p>
                    </AnimatePresence>
                    <AnimatePresence>
                      {isCelebrating ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.25 }}
                          className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-emerald-100"
                        >
                          <Sparkles className="size-3" />
                          ¡Muy bien!
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">
              Estoy aquí para animarte, no para regañarte ✨
            </p>
          </section>
        </div>
      </div>
    </motion.header>
  );
}

