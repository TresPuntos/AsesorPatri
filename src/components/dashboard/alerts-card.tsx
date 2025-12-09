"use client";

import { motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";

interface AlertsCardProps {
  alerts: string[];
}

export function AlertsCard({ alerts }: AlertsCardProps) {
  if (!alerts.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6 text-emerald-100"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">
          Todo bajo control
        </p>
        <p className="mt-2 text-base text-emerald-50/80">
          No hay alertas. Sigue así: consistencia y foco en tu objetivo. 💚
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-rose-600/20 p-6 text-white shadow-lg shadow-rose-900/20 backdrop-blur"
    >
      <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-white/80">
        <TriangleAlert className="size-5" />
        Alertas
      </div>
      <ul className="mt-4 space-y-3 text-sm text-white/90">
        {alerts.map((alert, index) => (
          <li
            key={`${alert}-${index}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 leading-relaxed backdrop-blur"
          >
            {alert}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}


