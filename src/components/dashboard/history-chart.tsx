"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthSummary } from "@/lib/types";

interface HistoryChartProps {
  data: MonthSummary[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const income = payload.find((item: any) => item.dataKey === "income")?.value ?? 0;
  const expenses = payload.find((item: any) => item.dataKey === "expenses")?.value ?? 0;
  const savings = payload.find((item: any) => item.dataKey === "balance")?.value ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-sm text-white shadow-xl backdrop-blur">
      <p className="font-semibold">{label}</p>
      <p className="text-emerald-300">Ingresos: {income.toFixed(0)} €</p>
      <p className="text-rose-300">Gastos: {Math.abs(expenses).toFixed(0)} €</p>
      <p className="text-cyan-200">Ahorro: {savings.toFixed(0)} €</p>
    </div>
  );
};

export function HistoryChart({ data }: HistoryChartProps) {
  const chartData = data.map((month) => ({
    name: month.label,
    income: month.income,
    expenses: month.expenses,
    balance: month.savings,
  }));

  return (
    <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950/90 via-slate-900/70 to-black p-6 text-white shadow-xl shadow-black/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">
            Evolución mensual
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-white">
            Ingresos, gastos y ahorro acumulado
          </p>
        </div>
      </div>
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="balance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
            <YAxis stroke="rgba(255,255,255,0.4)" tickFormatter={(value) => `${value}€`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="income" stroke="#22d3ee" fill="url(#income)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="url(#expenses)" strokeWidth={2} />
            <Area type="monotone" dataKey="balance" stroke="#34d399" fill="url(#balance)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


