import { Suspense } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { getTransactions } from "@/lib/transactions";
import { createDashboardData } from "@/lib/analytics";
import type { Transaction } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

const introActions = [
  {
    title: "Reserva tus primeros 50 € nada más cobrar",
    description:
      "Aparta esa cantidad en tu cuenta cripto para no verla en el día a día y ganar tranquilidad desde el minuto uno.",
    impact: "+50 €",
  },
  {
    title: "Ajusta las suscripciones de ocio",
    description:
      "Cancela lo que no estés usando y revisa si puedes bajar de plan. Con dos pequeños cambios recuperas margen para este mes.",
    impact: "+35 €",
  },
  {
    title: "Programa un día low-cost",
    description:
      "Comida casera, plan gratuito y cero compras impulsivas. Alivia Ocio y Supermercado sin renunciar a disfrutar.",
    impact: "Respira",
  },
];

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
        <header className="flex flex-col gap-8 rounded-3xl border border-white/5 bg-white/5 p-7 text-slate-200 shadow-xl shadow-black/30 backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">
                Tu asistente financiero personal, Patri
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Vamos a por esos 200&nbsp;€ con calma y buena energía.
              </h1>
              <p className="max-w-3xl text-base text-slate-200/90">
                Te propongo un plan claro para entender tus números, ajustar solo lo imprescindible
                y celebrar cada avance. Nada de agobios: foco, cariño y pasos pequeños que sostienen
                el ahorro.
              </p>
            </div>
            <a
              href="#dashboard-resumen"
              className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/15 px-5 py-2.5 text-sm font-semibold text-cyan-100 shadow-inner shadow-cyan-400/20 transition hover:border-cyan-300/70 hover:bg-cyan-500/25 hover:text-white"
            >
              Ver plan mensual
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {introActions.map((action, index) => (
              <div
                key={action.title}
                className="rounded-2xl border border-white/10 bg-black/40 p-5 text-left text-sm text-white/80 shadow-inner shadow-black/30 transition hover:border-cyan-300/50 hover:bg-black/55"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                      Paso {index + 1}
                    </p>
                    <h2 className="text-base font-semibold text-white">{action.title}</h2>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100">
                    {action.impact}
                  </span>
                </div>
                <p className="mt-3 leading-relaxed text-white/70">{action.description}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end">
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">
              Estoy aquí para animarte, no para regañarte ✨
            </p>
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
