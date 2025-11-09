import { Suspense } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { ensureDatabase } from "@/lib/db";
import { getTransactions } from "@/lib/transactions";
import { createDashboardData } from "@/lib/analytics";
import type { Transaction } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

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

  return <DashboardClient data={dashboard} />;
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
