"use client";

import { useMemo, useState } from "react";
import type { DashboardData, MonthSummary } from "@/lib/types";
import { DashboardHeader } from "./header";
import { ProgressCard } from "./progress-card";
import { UploadWidget } from "./upload-widget";
import { StatCard } from "./stat-card";
import { HistoryChart } from "./history-chart";
import { AlertsCard } from "./alerts-card";
import { RecommendationsCard } from "./recommendations-card";
import { CategoryBreakdown } from "./category-breakdown";
import { TransactionsTable } from "./transactions-table";
import { ThemeToggle } from "../theme-toggle";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1,
});

interface DashboardClientProps {
  data: DashboardData;
}

function getPreviousSummary(
  history: MonthSummary[],
  monthKey: string,
): MonthSummary | undefined {
  const index = history.findIndex((month) => month.monthKey === monthKey);
  if (index <= 0) return undefined;
  return history[index - 1];
}

export function DashboardClient({ data }: DashboardClientProps) {
  const defaultMonthKey =
    data.currentMonth?.monthKey ?? data.history.at(-1)?.monthKey ?? "";

  const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">("overview");

  const selectedSummary = useMemo(
    () => data.history.find((month) => month.monthKey === selectedMonthKey),
    [data.history, selectedMonthKey],
  );

  const previousSummary = useMemo(
    () =>
      selectedSummary
        ? getPreviousSummary(data.history, selectedSummary.monthKey)
        : undefined,
    [data.history, selectedSummary],
  );

  const categories =
    (selectedSummary &&
      data.categoryBreakdownByMonth[selectedSummary.monthKey]) ??
    [];
  const transactions =
    (selectedSummary &&
      data.transactionsByMonth[selectedSummary.monthKey]) ??
    [];
  const alerts =
    (selectedSummary && data.alertsByMonth[selectedSummary.monthKey]) ?? [];
  const recommendations =
    (selectedSummary &&
      data.recommendationsByMonth[selectedSummary.monthKey]) ??
    [];
  const categoryOptions = data.categoryOptions;

  if (!selectedSummary) {
    return null;
  }

  const incomeDelta =
    previousSummary && previousSummary.income !== 0
      ? (selectedSummary.income - previousSummary.income) /
        previousSummary.income
      : null;
  const expenseDelta =
    previousSummary && previousSummary.expenses !== 0
      ? (selectedSummary.expenses - previousSummary.expenses) /
        previousSummary.expenses
      : null;
  const balanceDelta =
    previousSummary && previousSummary.balance !== 0
      ? (selectedSummary.balance - previousSummary.balance) /
        previousSummary.balance
      : null;

  const statCards = [
    {
      label: "Ingresos",
      value: currency.format(selectedSummary.income),
      delta:
        incomeDelta !== null
          ? `${incomeDelta >= 0 ? "▲" : "▼"} ${percent.format(incomeDelta)} vs mes anterior`
          : undefined,
      tone: "positive" as const,
      footer: "Incluye nómina y otras entradas de dinero.",
    },
    {
      label: "Gastos",
      value: currency.format(Math.abs(selectedSummary.expenses)),
      delta:
        expenseDelta !== null
          ? `${expenseDelta >= 0 ? "▲" : "▼"} ${percent.format(expenseDelta)} vs mes anterior`
          : undefined,
      tone: "negative" as const,
      footer: `A un ritmo de ${currency.format(selectedSummary.averageDailySpend)} al día.`,
    },
    {
      label: "Balance del mes",
      value: currency.format(selectedSummary.balance),
      delta:
        balanceDelta !== null
          ? `${balanceDelta >= 0 ? "▲" : "▼"} ${percent.format(balanceDelta)} vs mes anterior`
          : undefined,
      tone: selectedSummary.balance >= 0 ? ("positive" as const) : ("negative" as const),
      footer: "Objetivo de ahorro: 200 € mensuales.",
    },
  ];

  return (
    <div className="relative flex flex-col gap-10">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[780px] w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),transparent_65%)] blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.16),transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.18),transparent_65%)] blur-3xl" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
            Patri • bienestar financiero
          </span>
          <DashboardHeader summary={selectedSummary} goal={data.goal} />
        </div>
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs text-white/70 shadow-lg backdrop-blur">
              Mes en análisis
            </div>
            <select
              value={selectedMonthKey}
              onChange={(event) => setSelectedMonthKey(event.target.value)}
              className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white shadow-lg shadow-black/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:bg-slate-900/70"
            >
              {[...data.history]
                .map((month) => ({ value: month.monthKey, label: month.label }))
                .reverse()
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 p-1 text-sm text-white/70 shadow-lg shadow-black/20">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`rounded-full px-4 py-2 transition ${
                activeTab === "overview"
                  ? "bg-cyan-500/20 text-white shadow-inner shadow-cyan-400/30"
                  : "hover:bg-white/10"
              }`}
            >
              Resumen
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
              className={`rounded-full px-4 py-2 transition ${
                activeTab === "transactions"
                  ? "bg-cyan-500/20 text-white shadow-inner shadow-cyan-400/30"
                  : "hover:bg-white/10"
              }`}
            >
              Partidas
            </button>
          </div>
        </div>
      </div>

      {activeTab === "overview" ? (
        <>
          <section className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ProgressCard goal={data.goal} current={selectedSummary.savings} />
            </div>
            <div className="lg:col-span-2">
              <UploadWidget />
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <HistoryChart data={data.history} />
            </div>
            <div className="flex flex-col gap-6">
              <AlertsCard alerts={alerts} />
              <RecommendationsCard recommendations={recommendations} />
            </div>
          </section>

          <CategoryBreakdown categories={categories} />
        </>
      ) : (
        <TransactionsTable
          transactions={transactions}
          categories={categoryOptions}
          monthLabel={selectedSummary.label}
        />
      )}
    </div>
  );
}


