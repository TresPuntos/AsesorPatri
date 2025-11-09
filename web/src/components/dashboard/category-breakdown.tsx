"use client";

import { motion } from "framer-motion";
import {
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
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

const chartColors: Record<string, string> = {
  ingresos: "#34d399",
  alimentacion: "#fb923c",
  hogar: "#38bdf8",
  transporte: "#a855f7",
  ocio: "#f472b6",
  salud: "#14b8a6",
  educacion: "#22d3ee",
  tecnologia: "#6366f1",
  viajes: "#f9739d",
  transferencias: "#facc15",
  otros: "#94a3b8",
};

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, type, share } = payload[0].payload;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/85 px-4 py-3 text-sm text-white shadow-xl backdrop-blur">
      <p className="font-semibold capitalize">{name}</p>
      <p className={type === "expense" ? "text-rose-300" : "text-emerald-300"}>
        {type === "expense" ? "-" : "+"}
        {currency.format(value)}
      </p>
      <p className="text-xs text-white/60">{share.toFixed(1)} % del total del mes</p>
    </div>
  );
};

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (!categories.length) {
    return null;
  }

  const chartData = categories.map((category) => {
    const value =
      category.type === "expense"
        ? Math.abs(category.total)
        : category.total;

    return {
      name: category.category,
      value,
      type: category.type,
      color: chartColors[category.category] ?? chartColors.otros,
    };
  });

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const shareMap = new Map(
    chartData.map((item) => [
      item.name,
      totalValue === 0 ? 0 : (item.value / totalValue) * 100,
    ]),
  );

  const biggest = chartData.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0,
  );

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
          Visualiza la mezcla de gastos e ingresos y detecta rápidamente los focos de ahorro.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px,1fr] lg:items-center">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.map((item) => ({
                    ...item,
                    share: shareMap.get(item.name) ?? 0,
                  }))}
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  stroke="rgba(15,23,42,0.85)"
                  strokeWidth={1}
                >
                  {chartData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                  <Label
                    position="center"
                    content={(props) => {
                      const { viewBox } = props;
                      if (
                        !viewBox ||
                        typeof viewBox !== "object" ||
                        typeof (viewBox as any).cx !== "number" ||
                        typeof (viewBox as any).cy !== "number"
                      ) {
                        return null;
                      }
                      const { cx, cy } = viewBox as { cx: number; cy: number };
                      return (
                        <>
                          <text
                            x={cx}
                            y={cy - 8}
                            textAnchor="middle"
                            className="fill-white/60 text-[10px] uppercase tracking-[0.28em]"
                          >
                            Total mes
                          </text>
                          <text
                            x={cx}
                            y={cy + 12}
                            textAnchor="middle"
                            className="fill-white text-lg font-semibold"
                          >
                            {currency.format(totalValue)}
                          </text>
                        </>
                      );
                    }}
                  />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <ul className="space-y-4">
          {categories.map((category) => {
            const value =
              category.type === "expense"
                ? Math.abs(category.total)
                : category.total;
            const progress = biggest === 0 ? 0 : (value / biggest) * 100;
            const tone =
              category.type === "expense" ? "text-rose-300" : "text-emerald-300";
            const share = shareMap.get(category.category) ?? 0;

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
                      {totalValue === 0
                        ? "Sin impacto relevante este mes."
                        : `Representa el ${share.toFixed(0)} % del total.`}
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
      </div>
    </motion.section>
  );
}

