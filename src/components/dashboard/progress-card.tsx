"use client";

import { motion } from "framer-motion";

interface ProgressCardProps {
  goal: number;
  current: number;
}

export function ProgressCard({ goal, current }: ProgressCardProps) {
  const percentage = goal === 0 ? 0 : Math.min(100, Math.round((current / goal) * 100));
  const remaining = Math.max(0, goal - current);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.45 }}
      className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-950 to-black p-6 text-white shadow-xl ring-1 ring-white/10 backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300/70">
            Objetivo del mes
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">
            {percentage >= 100
              ? "¡Meta superada! 🚀"
              : `Llevas ${percentage}%`}
          </p>
          <p className="mt-2 text-sm text-slate-300/70">
            {percentage >= 100
              ? "Reserva el extra para tu plan de emergencias o un capricho calculado."
              : `Te faltan ${remaining.toFixed(
                  0,
                )} € para alcanzar los ${goal} €.`}
          </p>
        </div>
        <div className="relative h-28 w-28">
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
              <span className="text-lg font-semibold">{current.toFixed(0)} €</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


