"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";
import type { CategorySummary, MonthSummary } from "@/lib/types";

interface ExpenseAdvisorCardProps {
  summary: MonthSummary;
  goal: number;
  categories: CategorySummary[];
}

interface AdvisoryResult {
  tone: "critical" | "caution" | "positive";
  headline: string;
  detail: string;
  actions: string[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function analyzePlannedExpense({
  amount,
  goal,
  summary,
  categories,
  description,
}: {
  amount: number;
  goal: number;
  summary: MonthSummary;
  categories: CategorySummary[];
  description: string;
}): AdvisoryResult {
  const gap = goal - summary.savings;
  const balance = summary.balance;

  const topExpense = categories
    .filter((item) => item.type === "expense")
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))[0];

  if (gap > 0 && amount >= gap) {
    return {
      tone: "critical",
      headline: "Recomendación: aplazar el gasto.",
      detail: `Estás ${formatCurrency(gap)} por debajo del objetivo. Este gasto añadiría ${formatCurrency(
        amount,
      )} extra y te alejaría aún más.`,
      actions: [
        "Revisa alertas activas antes de comprometer este gasto.",
        topExpense
          ? `Recorta al menos ${formatCurrency(
              amount,
            )} en ${topExpense.category} para compensar.`
          : "Revisa tus categorías de gasto más altas para liberar margen.",
        "Considera fraccionar este gasto o posponerlo al siguiente mes.",
      ],
    };
  }

  if (balance < amount) {
    const liquidityGap = Math.max(0, amount - balance);
    const expenseCandidates = categories
      .filter((item) => item.type === "expense")
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

    const reductionActions: string[] = [];
    let remaining = liquidityGap;

    for (const candidate of expenseCandidates) {
      if (remaining <= 0) {
        break;
      }

      const currentSpend = Math.abs(candidate.total);
      if (currentSpend === 0) {
        continue;
      }

      const suggestedCut = Math.min(remaining, Math.round(currentSpend * 0.25));
      if (suggestedCut < 1) {
        continue;
      }

      reductionActions.push(
        `Reduce ${formatCurrency(suggestedCut)} en ${candidate.category} (≈25 % de su gasto actual).`,
      );
      remaining -= suggestedCut;
    }

    if (remaining > 0) {
      reductionActions.push(
        `Busca ${formatCurrency(remaining)} adicionales recortando gastos variables menores o retrasando compras no esenciales.`,
      );
    }

    if (gap > 0) {
      reductionActions.push(
        `Reserva ${formatCurrency(gap)} para tu meta de ahorro antes de ejecutar el gasto.`,
      );
    }

    reductionActions.push(
      "Programa la compra cuando el plan de recortes esté en marcha y el balance vuelva a terreno positivo.",
    );

    return {
      tone: "caution",
      headline: "Liquidez limitada: diseña un plan antes de comprar.",
      detail: `Tu balance del mes es ${formatCurrency(
        balance,
      )}. Para afrontar ${formatCurrency(amount)} sin endeudarte, libera al menos ${formatCurrency(
        liquidityGap,
      )} ajustando otras partidas.`,
      actions: reductionActions,
    };
  }

  if (gap > 0 && amount > gap * 0.4) {
    return {
      tone: "caution",
      headline: "Puedes hacerlo, pero necesitarás compensar el impacto.",
      detail: `El gasto cubriría el ${((amount / gap) * 100).toFixed(
        0,
      )}% del camino que queda para la meta. Ajusta otras partidas si lo mantienes.`,
      actions: [
        topExpense
          ? `Marca un límite diario en ${topExpense.category} hasta final de mes.`
          : "Activa un límite diario de gasto para equilibrar la salida.",
        "Reserva el mismo importe en tu presupuesto de la siguiente semana.",
        `Revisa el gasto de "${description || "este capricho"}" tras 48 h para confirmar que sigue siendo prioritario.`,
      ],
    };
  }

  return {
    tone: "positive",
    headline: "Tienes margen para hacerlo.",
    detail: `Tu objetivo mensual sigue cubierto tras asumir ${formatCurrency(
      amount,
    )}. Mantén la vigilancia para no generar nuevas alertas.`,
    actions: [
      "Registra el gasto inmediatamente tras ejecutarlo.",
      "Reserva un recordatorio a mitad de mes para validar que sigues dentro del plan.",
      "Si puedes, compensa un 20 % del importe ahorrando en otra partida.",
    ],
  };
}

export function ExpenseAdvisorCard({ summary, goal, categories }: ExpenseAdvisorCardProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<AdvisoryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gap = useMemo(() => Math.max(0, goal - summary.savings), [goal, summary.savings]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-4 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6 text-cyan-50 shadow-2xl shadow-cyan-900/20 backdrop-blur"
    >
      <header className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.26em] text-cyan-200">
          <BrainCircuit className="size-5" />
          Asesor de decisiones
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-white">
          ¿Comprarlo ahora o esperar?
        </h3>
        <p className="text-sm text-cyan-100/80">
          Tu meta mensual está {gap > 0 ? `a ${formatCurrency(gap)} de cumplirse.` : "cumplida."} Analiza
          un gasto antes de comprometerlo: la IA evalúa su impacto frente al objetivo.
        </p>
      </header>

      <form
        className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = Number.parseFloat(amount.replace(",", "."));
          if (Number.isNaN(parsed) || parsed <= 0) {
            setError("Introduce un importe válido mayor que cero.");
            setResult(null);
            return;
          }
          setError(null);
          const advisory = analyzePlannedExpense({
            amount: parsed,
            goal,
            summary,
            categories,
            description,
          });
          setResult(advisory);
        }}
      >
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.28em] text-white/60">
            Describe el gasto
          </span>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ej. Cena especial, nuevo dispositivo, viaje..."
            className="h-11 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.28em] text-white/60">
            Importe estimado
          </span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="€"
            inputMode="decimal"
            className="h-11 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
          />
        </label>
        <button
          type="submit"
          className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-400/40 bg-cyan-500/20 px-4 text-sm font-semibold text-white transition hover:bg-cyan-500/30"
        >
          Evaluar impacto
        </button>
      </form>
      {error ? <p className="text-xs text-rose-200">{error}</p> : null}

      {result ? (
        <div
          className={`rounded-2xl border px-4 py-4 text-sm ${
            result.tone === "critical"
              ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
              : result.tone === "caution"
                ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-50"
          }`}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4" />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em]">
                {result.headline}
              </p>
              <p className="text-sm">{result.detail}</p>
              <ul className="space-y-1 text-xs text-white/80">
                {result.actions.map((action) => (
                  <li key={action} className="leading-relaxed">
                    • {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}


