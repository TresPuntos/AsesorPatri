import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthSummary } from "@/lib/types";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

interface DashboardHeaderProps {
  summary?: MonthSummary;
  goal: number;
  history: MonthSummary[];
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

interface HeroChartPoint {
  name: string;
  income: number;
  expenses: number;
  balance: number;
}

interface TooltipContentProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    dataKey?: string;
    value?: number;
  }>;
}

const TooltipContent = ({ active, payload, label }: TooltipContentProps) => {
  if (!active || !payload?.length) return null;

  const income =
    payload.find((entry) => entry.dataKey === "income")?.value ?? 0;
  const expenses =
    payload.find((entry) => entry.dataKey === "expenses")?.value ?? 0;
  const balance =
    payload.find((entry) => entry.dataKey === "balance")?.value ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/85 px-4 py-3 text-sm text-white shadow-xl backdrop-blur">
      <p className="font-semibold">{label ?? ""}</p>
      <p className="text-cyan-200">Ingresos: {currency.format(income)}</p>
      <p className="text-rose-300">Gastos: {currency.format(expenses)}</p>
      <p className="text-emerald-300">
        Ahorro acumulado: {currency.format(balance)}
      </p>
    </div>
  );
};

function HeroTrendChart({ data }: { data: HeroChartPoint[] }) {
  if (!data.length) return null;

  return (
    <div className="h-48 w-full rounded-2xl border border-white/10 bg-black/30 p-3 shadow-inner shadow-black/30">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="name"
            stroke="rgba(255,255,255,0.4)"
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            tickFormatter={(value) => `${Math.round(value)}€`}
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
          />
          <Tooltip content={<TooltipContent />} />
          <Bar
            dataKey="expenses"
            name="Gastos"
            fill="rgba(244,63,94,0.55)"
            barSize={14}
            radius={[10, 10, 10, 10]}
          />
          <Line
            type="monotone"
            dataKey="income"
            name="Ingresos"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Ahorro acumulado"
            stroke="#34d399"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardHeader({
  summary,
  goal,
  history,
}: DashboardHeaderProps) {
  const messaging = summary ? buildMessaging(summary, goal) : null;
  const defaultTips = [
    "Ahorrar primero te da paz mental",
    "Revisa suscripciones y ocio cada semana",
    "Un día low-cost = más colchón para ti",
  ];

  const chartData = useMemo(() => {
    if (!history.length) return [];

    const ordered = [...history].sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey),
    );
    const recent = ordered.slice(-6);

    return recent.reduce<HeroChartPoint[]>((acc, month) => {
      const previousBalance = acc.length ? acc[acc.length - 1]?.balance ?? 0 : 0;
      const nextBalance = previousBalance + month.savings;

      acc.push({
        name: capitalize(month.label),
        income: month.income,
        expenses: Math.abs(month.expenses),
        balance: nextBalance,
      });

      return acc;
    }, []);
  }, [history]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 text-white shadow-2xl shadow-black/30 ring-1 ring-white/10"
    >
      <div className="absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.25),transparent)]" />
      <div className="relative flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white/60 shadow-inner shadow-cyan-400/10">
              Dashboard financiero mensual
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {messaging ? messaging.title : "Organiza tus finanzas, Patri 🌟"}
            </h1>
            <p className="max-w-lg text-sm text-white/70">
              {messaging
                ? messaging.body
                : "Sube tu extracto para ver cómo va tu plan de ahorro y recibir consejos al instante."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {defaultTips.map((tip) => (
              <span
                key={tip}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 shadow-inner shadow-black/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                {tip}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <HeroTrendChart data={chartData} />
        </div>
      </div>
    </motion.header>
  );
}

