"use client";

import { useMemo, useState } from "react";
import type { DashboardData, MonthSummary } from "@/lib/types";
import { DashboardHeader } from "./header";
import { StatCard } from "./stat-card";
import { HistoryChart } from "./history-chart";
import { AlertsCard } from "./alerts-card";
import { RecommendationsCard } from "./recommendations-card";
import { CategoryBreakdown } from "./category-breakdown";
import { TransactionsTable } from "./transactions-table";
import { UploadWidget } from "./upload-widget";

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

  const [manualMonthKey, setManualMonthKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] =
    useState<"overview" | "transactions">("overview");

  const selectedMonthKey = manualMonthKey ?? defaultMonthKey;

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

  const categories = useMemo(
    () =>
    (selectedSummary &&
      data.categoryBreakdownByMonth[selectedSummary.monthKey]) ??
      [],
    [data.categoryBreakdownByMonth, selectedSummary],
  );
  const transactions = useMemo(
    () =>
    (selectedSummary &&
      data.transactionsByMonth[selectedSummary.monthKey]) ??
      [],
    [data.transactionsByMonth, selectedSummary],
  );
  const pendingTransactions = useMemo(
    () => transactions.filter((tx) => tx.pendingCategory).length,
    [transactions],
  );
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
    <div className="relative flex flex-col gap-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[780px] w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),transparent_65%)] blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.16),transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.18),transparent_65%)] blur-3xl" />
      </div>

      <DashboardHeader summary={selectedSummary} goal={data.goal} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/30 p-5 text-white/80 shadow-xl shadow-black/25 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/60">
              Mes en análisis
            </span>
            {previousSummary ? (
              <span className="text-[11px] text-white/40">
                Comparando con {previousSummary.label}
              </span>
            ) : null}
            </div>
            <select
              value={selectedMonthKey}
              onChange={(event) => setManualMonthKey(event.target.value)}
            className="h-9 rounded-full border border-white/15 bg-slate-950/80 px-3 text-sm text-white shadow-inner shadow-black/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
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
          </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-xs text-white/70 shadow-inner shadow-black/30">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
            className={`rounded-full px-4 py-1.5 transition ${
                activeTab === "overview"
                ? "bg-cyan-500/25 text-white shadow-inner shadow-cyan-400/30"
                  : "hover:bg-white/10"
              }`}
            >
            Resumen general
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
            className={`rounded-full px-4 py-1.5 transition ${
                activeTab === "transactions"
                ? "bg-cyan-500/25 text-white shadow-inner shadow-cyan-400/30"
                  : "hover:bg-white/10"
              }`}
            >
            Ver partidas
            {pendingTransactions > 0 ? (
              <span className="ml-2 rounded-full bg-amber-500/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-black">
                {pendingTransactions}
              </span>
            ) : null}
            </button>
        </div>
      </div>

      {activeTab === "overview" ? (
        <>
          <section className="grid gap-7 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-6">
              <HistoryChart data={data.history} />
              <AlertsCard alerts={alerts} />
              {recommendations.length ? (
                <RecommendationsCard recommendations={recommendations} />
              ) : null}
              <section className="rounded-3xl border border-dashed border-cyan-500/30 bg-cyan-500/10 p-6 text-cyan-50 shadow-[0_24px_80px_-40px_rgba(6,182,212,0.55)] backdrop-blur">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="max-w-lg space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/70">
                      Actualiza tus datos
                    </p>
                    <h3 className="text-2xl font-semibold text-cyan-50">
                      Sube el extracto del último mes para refrescar tus métricas al instante.
                    </h3>
                    <p className="text-sm text-cyan-100/80">
                      Arrastra un archivo .xlsx o .csv o usa el recuadro para elegirlo manualmente.
                    </p>
                  </div>
                  <div className="w-full max-w-sm shrink-0">
                    <UploadWidget
                      showTitle={false}
                      hint="Tu dashboard se actualizará en segundos con las alertas y categorías nuevas."
                    />
                  </div>
                </div>
              </section>
            </div>
            <CategoryBreakdown categories={categories} />
          </section>
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


