"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthSummary } from "@/lib/types";

interface HistoryChartProps {
  data: MonthSummary[];
}

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const income = payload.find((item: any) => item.dataKey === "income")?.value ?? 0;
  const expenses = payload.find((item: any) => item.dataKey === "expenses")?.value ?? 0;
  const balance = payload.find((item: any) => item.dataKey === "balance")?.value ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white shadow-xl backdrop-blur">
      <p className="font-semibold">{label}</p>
      <p className="text-cyan-200">Ingresos: {currency.format(income)}</p>
      <p className="text-rose-300">
        Gastos: {currency.format(Math.abs(expenses))}
      </p>
      <p className={balance >= 0 ? "text-emerald-300" : "text-rose-200"}>
        Balance: {currency.format(balance)}
      </p>
    </div>
  );
};

function capitalize(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function HistoryChart({ data }: HistoryChartProps) {
  const chartData = data.map((month) => ({
    name: capitalize(month.label),
    income: month.income,
    expenses: Math.abs(month.expenses),
    balance: month.balance,
  }));

  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950/90 via-slate-900/70 to-black p-6 text-white shadow-xl shadow-black/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">
            Evolución mensual
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-white">
            Ingresos, gastos y balance del mes
          </p>
        </div>
      </div>
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="expensesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(244,63,94,0.65)" />
                <stop offset="100%" stopColor="rgba(244,63,94,0.15)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.4)"
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              domain={[0, "auto"]}
              stroke="rgba(255,255,255,0.4)"
              tickFormatter={(value) => currency.format(value)}
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              stroke="rgba(255,255,255,0.4)"
              tickFormatter={(value) => currency.format(value)}
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
              }}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" yAxisId="right" />
            <Bar
              yAxisId="left"
              name="Gastos"
              dataKey="expenses"
              barSize={18}
              fill="url(#expensesFill)"
              radius={[12, 12, 12, 12]}
            />
            <Line
              yAxisId="left"
              name="Ingresos"
              type="monotone"
              dataKey="income"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              name="Balance"
              type="monotone"
              dataKey="balance"
              stroke="#34d399"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


