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

  const dashboard = await createDashboardData(transactions, 200);

  if (!dashboard.currentMonth) {
    return <EmptyState />;
  }

  return <DashboardClient data={dashboard} />;
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black px-5 pb-20 pt-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-2">
          <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
            <div className="flex flex-col gap-4 text-slate-100">
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.32em] text-slate-400">
                  Tu asistente financiero personal
                </span>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Vamos a ahorrar juntas, con claridad y foco.
                </h1>
                <p className="max-w-2xl text-sm text-slate-200">
                  Cada semana revisamos tus números, celebramos lo que funciona y ajustamos lo
                  necesario para alcanzar esos 200 € de colchón sin estrés.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    title: "Ahorra primero",
                    body: "Aparta 50 € nada más cobrar en tu cuenta cripto para blindar el objetivo.",
                  },
                  {
                    title: "Recorta suscripciones",
                    body: "Revisa Ocio y cancela lo que no usas. Dos ajustes = +40 € disponibles.",
                  },
                  {
                    title: "Día low-cost",
                    body: "Plan casero y gratuito esta semana para aliviar Supermercado y Ocio.",
                  },
                ].map((tip) => (
                  <div
                    key={tip.title}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">
                      {tip.title}
                    </p>
                    <p className="text-sm text-slate-200">{tip.body}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Estoy aquí para animarte, no para regañarte ✨
              </p>
            </div>
          </div>
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
