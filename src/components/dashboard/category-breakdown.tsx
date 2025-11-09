"use client";

import { motion } from "framer-motion";
import type { CategorySummary } from "@/lib/types";

interface CategoryBreakdownProps {
  categories: CategorySummary[];
}

const palette: Record<string, string> = {
  ingresos: "from-emerald-400/80 via-emerald-500/40 to-emerald-900/50",
  alimentacion: "from-orange-400/80 via-orange-500/40 to-orange-900/40",
  hogar: "from-sky-400/80 via-sky-500/40 to-sky-900/50",
  transporte: "from-purple-400/80 via-purple-500/40 to-purple-900/50",
  ocio: "from-pink-400/80 via-pink-500/40 to-pink-900/50",
  salud: "from-teal-400/80 via-teal-500/40 to-teal-900/50",
  educacion: "from-cyan-400/80 via-cyan-500/40 to-cyan-900/50",
  tecnologia: "from-indigo-400/80 via-indigo-500/40 to-indigo-900/50",
  viajes: "from-rose-400/80 via-rose-500/40 to-rose-900/50",
  transferencias: "from-amber-400/80 via-amber-500/40 to-amber-900/50",
  otros: "from-slate-400/80 via-slate-500/40 to-slate-900/50",
};

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (!categories.length) {
    return null;
  }

  const biggest = categories.reduce((max, current) => {
    const value = current.type === "expense" ? Math.abs(current.total) : current.total;
    return value > max ? value : max;
  }, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 text-white shadow-2xl shadow-black/40"
    >
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Dónde se va tu dinero
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Categorías clave este mes
        </h2>
        <p className="text-sm text-white/60">
          Identifica los focos de gasto y las categorías que impulsan tu ahorro.
        </p>
      </header>
      <ul className="mt-6 space-y-4">
        {categories.map((category) => {
          const value =
            category.type === "expense"
              ? Math.abs(category.total)
              : category.total;
          const progress = biggest === 0 ? 0 : (value / biggest) * 100;
          const tone = category.type === "expense" ? "text-rose-300" : "text-emerald-300";
          return (
            <li
              key={category.category}
              className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur"
            >
              <div
                className={`pointer-events-none absolute inset-0 opacity-70 blur-3xl bg-gradient-to-r ${palette[category.category] ?? palette.otros}`}
                style={{ width: `${Math.max(progress, 15)}%` }}
              />
              <div className="relative flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="uppercase tracking-[0.24em] text-white/70">
                    {category.category}
                  </span>
                  <span className={`${tone} font-semibold`}>
                    {category.type === "expense" ? "-" : "+"}
                    {currency.format(value)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>
                    {category.type === "expense"
                      ? `Representa el ${category.percentage.toFixed(0)} % de tus gastos.`
                      : "Impulsa tu ahorro este mes."}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60">
                    {category.type === "expense" ? "Gasto" : "Ingreso"}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}


