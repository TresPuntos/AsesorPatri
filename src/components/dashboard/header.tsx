'use client';

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
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

const DONUT_RADIUS = 42;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export function DashboardHeader({ summary, goal }: DashboardHeaderProps) {
  const messaging = summary ? buildMessaging(summary, goal) : null;
  const tasks = [
    {
      id: 0,
      idea:
        "Guardar primero 50 € nada más cobrar y dejarlos fuera de la vista en tu cuenta cripto.",
      success: "¡Listo! 50 € fuera de tentaciones. Déjalos crecer tranquilos.",
    },
    {
      id: 1,
      idea:
        "Revisar suscripciones en Ocio y cancelar lo que no estés usando. Dos ajustes pequeños bastan.",
      success: "¡Suscripciones afinadas! Ese ahorro se queda contigo.",
    },
    {
      id: 2,
      idea:
        "Practicar un día low-cost: comida casera + plan gratis. Aliviarás Supermercado y Ocio.",
      success: "¡Día low-cost desbloqueado! Disfruta sin gastar de más.",
    },
  ];
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [celebrating, setCelebrating] = useState<Record<number, boolean>>({});

  const toggleTask = (taskId: number) => {
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
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {tasks.map(({ id, idea, success }) => {
                const isDone = Boolean(completed[id]);
                const isCelebrating = Boolean(celebrating[id]);
                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => toggleTask(id)}
                    whileTap={{ scale: 0.98 }}
                    animate={{
                      backgroundColor: isDone
                        ? "rgba(16,185,129,0.18)"
                        : "rgba(15,23,42,0.55)",
                      borderColor: isDone ? "rgba(16,185,129,0.55)" : "rgba(255,255,255,0.1)",
                      color: isDone ? "rgba(240,253,244,1)" : "rgba(226,232,240,0.85)",
                    }}
                    className="group flex h-full flex-col gap-3 rounded-2xl border px-4 py-3 text-left text-sm shadow-inner shadow-black/20 transition hover:border-cyan-300/60 hover:bg-black/40"
                  >
                    <div className="flex items-start gap-3">
                      <motion.span
                        layout
                        animate={{
                          scale: isCelebrating ? 1.2 : 1,
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className={`mt-0.5 inline-flex size-6 items-center justify-center rounded-full border text-xs font-semibold transition ${
                          isDone
                            ? "border-emerald-300 bg-emerald-200 text-slate-950"
                            : "border-cyan-400/70 bg-cyan-500/20 text-cyan-100"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="size-4" /> : "✓"}
                      </motion.span>
                      <div className="flex-1">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={isDone ? "done" : "idea"}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="leading-relaxed"
                          >
                            {isDone ? success : idea}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isCelebrating ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-emerald-100"
                        >
                          <Sparkles className="size-3" />
                          ¡Muy bien!
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Estoy aquí para animarte, no para regañarte ✨
              </p>
            </div>
          </div>
          <div className="mt-2 flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/80 shadow-inner shadow-black/30 backdrop-blur lg:mt-0">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">
              Objetivo del mes
            </div>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24">
                <svg className="h-full w-full" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={DONUT_RADIUS}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={DONUT_RADIUS}
                    stroke="#22d3ee"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={DONUT_CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/60">
                    Llevas
                  </span>
                  <span className="text-lg font-semibold">
                    {Number.isFinite(percentage) ? percentage : 0}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3 text-sm text-white/70">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                    Ahorro actual
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      currentSavings >= 0 ? "text-emerald-200" : "text-rose-200"
                    }`}
                  >
                    {currency.format(currentSavings)}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Te faltan {currency.format(remaining)} para alcanzar los {currency.format(goal)}.
                </p>
              </div>
            </div>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
              <p className="uppercase tracking-[0.28em] text-white/40">
                Próximo paso sugerido
              </p>
              <p className="text-sm text-white/70">
                Baja hasta el final de la página para subir tu extracto y recalcular métricas
                con los últimos movimientos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

