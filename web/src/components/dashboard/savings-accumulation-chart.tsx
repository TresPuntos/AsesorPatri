"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthSummary } from "@/lib/types";

interface SavingsAccumulationChartProps {
  data: MonthSummary[];
  goal: number;
}

interface ChartPoint {
  name: string;
  savings: number;
  cumulative: number;
  metGoal: boolean;
  year: number;
}

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const savings = payload.find((item: any) => item.dataKey === "savings")?.value ?? 0;
  const cumulative = payload.find((item: any) => item.dataKey === "cumulative")?.value ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/85 px-4 py-3 text-sm text-white shadow-xl backdrop-blur">
      <p className="font-semibold">{label}</p>
      <p className={savings >= 0 ? "text-emerald-300" : "text-rose-300"}>
        Ahorro del mes: {currency.format(savings)}
      </p>
      <p className="text-cyan-200">Acumulado anual: {currency.format(cumulative)}</p>
    </div>
  );
};

export function SavingsAccumulationChart({
  data,
  goal,
}: SavingsAccumulationChartProps) {
  if (!data.length) return null;

  const cumulativeByYear = new Map<number, number>();

  const chartData: ChartPoint[] = data.map((month) => {
    const previous = cumulativeByYear.get(month.year) ?? 0;
    const updated = previous + month.savings;
    cumulativeByYear.set(month.year, updated);

    return {
      name: month.label,
      savings: month.savings,
      cumulative: updated,
      metGoal: month.savings >= goal,
      year: month.year,
    };
  });

  const maxAbsSavings = Math.max(
    goal,
    ...chartData.map((point) => Math.abs(point.savings)),
  );

  const cumulativeExtents = chartData.reduce(
    (acc, point) => ({
      min: Math.min(acc.min, point.cumulative),
      max: Math.max(acc.max, point.cumulative),
    }),
    { min: 0, max: 0 },
  );

  const cumulativePadding = goal * 4;
  const cumulativeDomain: [number, number] = [
    Math.min(cumulativeExtents.min, 0) - cumulativePadding * 0.1,
    Math.max(cumulativeExtents.max, goal * 12) + cumulativePadding * 0.1,
  ];

  if (cumulativeDomain[0] === cumulativeDomain[1]) {
    cumulativeDomain[1] =
      cumulativeDomain[1] === 0 ? 1 : cumulativeDomain[1] * 1.1;
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 text-white shadow-2xl shadow-black/40">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Ritmo de ahorro anual
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            ¿Cuánto ahorramos cada mes y acumulado?
          </h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/60">
          Objetivo mensual: {currency.format(goal)}
        </div>
      </header>
      <div className="mt-6 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 24, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
            <YAxis
              yAxisId="left"
              stroke="rgba(255,255,255,0.4)"
              tickFormatter={(value) => `${value.toFixed(0)}€`}
              domain={[
                -maxAbsSavings * 1.4,
                maxAbsSavings * 1.4,
              ]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="rgba(125,211,252,0.35)"
              tickFormatter={(value) => `${value.toFixed(0)}€`}
              domain={cumulativeDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              yAxisId="left"
              y={goal}
              stroke="#22d3ee"
              strokeDasharray="3 3"
              strokeWidth={1.2}
              label={{
                value: "Objetivo mensual",
                position: "insideTopRight",
                fill: "#22d3ee",
                fontSize: 12,
                offset: 10,
              }}
            />
            <ReferenceLine
              yAxisId="left"
              y={0}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1}
            />
            <Bar
              yAxisId="left"
              dataKey="savings"
              radius={[12, 12, 12, 12]}
              barSize={26}
            >
              {chartData.map((entry) => {
                if (entry.savings < 0) {
                  return <Cell key={`bar-${entry.name}`} fill="rgba(244,63,94,0.85)" />;
                }
                if (entry.metGoal) {
                  return <Cell key={`bar-${entry.name}`} fill="rgba(52,211,153,0.9)" />;
                }
                return <Cell key={`bar-${entry.name}`} fill="rgba(14,165,233,0.85)" />;
              })}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#0ea5e9", strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: "#22d3ee", strokeWidth: 1.2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}


