import { Suspense } from "react";
import { ensureDatabase } from "@/lib/db";
import { getTransactions } from "@/lib/transactions";
import { createDashboardData } from "@/lib/analytics";
import type { Transaction } from "@/lib/types";
import { DashboardHeader } from "@/components/dashboard/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { AlertsCard } from "@/components/dashboard/alerts-card";
import { RecommendationsCard } from "@/components/dashboard/recommendations-card";
import { HistoryChart } from "@/components/dashboard/history-chart";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import { ThemeToggle } from "@/components/theme-toggle";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { EmptyState } from "@/components/dashboard/empty-state";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1,
});

async function Dashboard() {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  let transactions: Transaction[] = [];

  if (connectionString) {
    try {
      await ensureDatabase();
      transactions = await getTransactions("patri");
    } catch (error) {
      console.error("No fue posible conectar con la base de datos:", error);
    }
  }

  const dashboard = createDashboardData(transactions, 200);

  if (!dashboard.currentMonth) {
    return <EmptyState />;
  }

  const { currentMonth, previousMonth } = dashboard;
  const incomeDelta =
    previousMonth && previousMonth.income !== 0
      ? (currentMonth.income - previousMonth.income) / previousMonth.income
      : null;
  const expenseDelta =
    previousMonth && previousMonth.expenses !== 0
      ? (currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses
      : null;
  const balanceDelta =
    previousMonth && previousMonth.balance !== 0
      ? (currentMonth.balance - previousMonth.balance) / previousMonth.balance
      : null;

  const statCards = [
    {
      label: "Ingresos",
      value: currency.format(currentMonth.income),
      delta:
        incomeDelta !== null
          ? `${incomeDelta >= 0 ? "▲" : "▼"} ${percent.format(incomeDelta)} vs mes anterior`
          : undefined,
      tone: "positive" as const,
      footer: "Incluye nómina y otras entradas de dinero.",
    },
    {
      label: "Gastos",
      value: currency.format(Math.abs(currentMonth.expenses)),
      delta:
        expenseDelta !== null
          ? `${expenseDelta >= 0 ? "▲" : "▼"} ${percent.format(expenseDelta)} vs mes anterior`
          : undefined,
      tone: "negative" as const,
      footer: `A un ritmo de ${currency.format(currentMonth.averageDailySpend)} al día.`,
    },
    {
      label: "Balance del mes",
      value: currency.format(currentMonth.balance),
      delta:
        balanceDelta !== null
          ? `${balanceDelta >= 0 ? "▲" : "▼"} ${percent.format(balanceDelta)} vs mes anterior`
          : undefined,
      tone: currentMonth.balance >= 0 ? ("positive" as const) : ("negative" as const),
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

      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
          Patri • bienestar financiero
        </span>
        <ThemeToggle />
      </div>

      <DashboardHeader
        currentSavings={currentMonth.savings}
        monthLabel={currentMonth.label}
      />

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProgressCard goal={dashboard.goal} current={currentMonth.savings} />
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
          <HistoryChart data={dashboard.history} />
        </div>
        <div className="flex flex-col gap-6">
          <AlertsCard alerts={dashboard.alerts} />
          <RecommendationsCard recommendations={dashboard.recommendations} />
        </div>
      </section>

      <CategoryBreakdown categories={dashboard.categoryBreakdown} />
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black px-5 pb-20 pt-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Dashboard financiero mensual de Patri
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Controla tus finanzas con claridad y emoción cripto.
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Analiza tus movimientos bancarios, visualiza el progreso hacia los 200 € de ahorro
            mensual y recibe recomendaciones accionables para cuidar tu bienestar económico.
          </p>
        </header>

        <Suspense
          fallback={
            <div className="grid gap-6">
              <div className="h-48 animate-pulse rounded-3xl bg-white/5" />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
                <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
                <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
              </div>
            </div>
          }
        >
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}
