import { Suspense } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/5 bg-white/5 p-6 text-sm text-slate-200 shadow-xl shadow-black/30 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Tu asistente financiero personal, Patri
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Vamos a ahorrar juntas, con calma y buena energía.
          </h1>
          <p className="max-w-2xl text-slate-200">
            Te ayudo a entender tus movimientos, a detectar dónde ajustar un poquito y a celebrar
            cada paso hacia ese colchón de 200 € al mes. Nada de agobios: solo claridad, cariño y un
            plan que puedes cumplir.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Guardar primero 50 € nada más cobrar y dejarlos fuera de la vista en tu cuenta cripto.",
              "Revisar suscripciones en Ocio y cancelar lo que no estés usando. Dos ajustes pequeños bastan.",
              "Practicar un día low-cost: comida casera + plan gratis. Aliviarás Supermercado y Ocio.",
            ].map((tip) => (
              <div
                key={tip}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm text-white/80 shadow-inner shadow-black/30"
              >
                <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full border border-cyan-400/70 bg-cyan-500/20 text-xs font-semibold text-cyan-200">
                  ✓
                </span>
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Estoy aquí para animarte, no para regañarte ✨
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
