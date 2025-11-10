"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { updateTransactionCategoryAction } from "@/app/actions/update-transaction-category";

interface TransactionsTableProps {
  transactions: Transaction[];
  categories: string[];
  monthLabel: string;
  goal: number;
  savings: number;
  alertsCount: number;
}

interface RowDraft {
  category: string;
  subcategory: string;
  isDirty: boolean;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function TransactionsTable({
  transactions,
  categories,
  monthLabel,
  goal,
  savings,
  alertsCount,
}: TransactionsTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [rowDrafts, setRowDrafts] = useState<Record<string, RowDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedbackById, setFeedbackById] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const categoryOptions = useMemo(() => {
    const collected = new Set<string>();
    categories.forEach((item) => {
      if (item?.trim()) collected.add(item.trim());
    });
    transactions.forEach((tx) => {
      if (tx.category?.trim()) collected.add(tx.category.trim());
    });

    return Array.from(collected).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [categories, transactions]);

  const filtered = useMemo(() => {
    const needles = search
      .toLowerCase()
      .split(" ")
      .map((word) => word.trim())
      .filter(Boolean);

    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) {
        return false;
      }

      if (!needles.length) {
        return true;
      }

      const haystack = [
        tx.description,
        tx.category,
        tx.subcategory,
        tx.rawConcept,
        tx.observations,
      ]
        .map((field) => field?.toString().toLowerCase() ?? "")
        .join(" ");

      return needles.every((needle) => haystack.includes(needle));
    });
  }, [transactions, search, typeFilter]);

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(b.bankDate).getTime() - new Date(a.bankDate).getTime(),
      ),
    [filtered],
  );

  const remainingToGoal = Math.max(0, goal - savings);

  const handleDraftChange = (
    tx: Transaction,
    field: "category" | "subcategory",
    value: string,
  ) => {
    setRowDrafts((prev) => {
      const base = prev[tx.id] ?? {
        category: tx.category ?? "",
        subcategory: tx.subcategory ?? "",
        isDirty: false,
      };

      const next: RowDraft = {
        ...base,
        [field]: value,
      };

      next.isDirty =
        next.category.trim() !== (tx.category ?? "").trim() ||
        next.subcategory.trim() !== (tx.subcategory ?? "").trim();

      return { ...prev, [tx.id]: next };
    });
  };

  const handleSave = (tx: Transaction) => {
    const draft = rowDrafts[tx.id] ?? {
      category: tx.category ?? "",
      subcategory: tx.subcategory ?? "",
      isDirty: false,
    };
    const category = draft.category.trim();
    const subcategory = draft.subcategory.trim();

    if (!category) {
      setFeedbackById((prev) => ({
        ...prev,
        [tx.id]: "Introduce una categoría para guardar.",
      }));
      return;
    }

    setSavingId(tx.id);
    setFeedbackById((prev) => ({ ...prev, [tx.id]: "" }));

    startTransition(async () => {
      const result = await updateTransactionCategoryAction({
        id: tx.id,
        category,
        subcategory: subcategory.length ? subcategory : undefined,
      });

      if (!result.success) {
        setFeedbackById((prev) => ({ ...prev, [tx.id]: result.message }));
        setSavingId(null);
        return;
      }

      setRowDrafts((prev) => ({
        ...prev,
        [tx.id]: {
          category,
          subcategory,
          isDirty: false,
        },
      }));
      setFeedbackById((prev) => ({
        ...prev,
        [tx.id]: "Cambios guardados.",
      }));
      setSavingId(null);
    });
  };

  const handleCategorySelection = (tx: Transaction, value: string) => {
    if (value === "__new__") {
      const custom = window
        .prompt("Nombre de la nueva categoría:")
        ?.trim();
      if (!custom) return;
      handleDraftChange(tx, "category", custom);
      return;
    }

    handleDraftChange(tx, "category", value);
  };

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-white/5 bg-black/40 p-6 shadow-2xl shadow-black/40 backdrop-blur">
      <header className="flex flex-col gap-2 text-white">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Partidas de {monthLabel}
          </h2>
          {isPending ? (
            <span className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando…
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
          <p>
            Ajusta categorías para alinear el análisis y cerrar el objetivo del mes.
          </p>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
              remainingToGoal > 0
                ? "border border-amber-300/30 bg-amber-400/10 text-amber-200"
                : "border border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
            }`}
          >
            {remainingToGoal > 0
              ? `Faltan ${currencyFormatter.format(remainingToGoal)}`
              : "Meta alcanzada"}
          </span>
          {alertsCount > 0 ? (
            <span className="rounded-full border border-rose-300/50 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-100">
              {alertsCount} alerta{alertsCount === 1 ? "" : "s"} pendientes
            </span>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por descripción, categoría, notas…"
            className="h-10 w-full rounded-full border border-white/10 bg-black/30 px-4 text-sm text-white shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 sm:max-w-xl"
          />
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 p-1 text-xs text-white/70 shadow-inner shadow-black/40">
            {[
              { label: "Todos", value: "all" },
              { label: "Ingresos", value: "income" },
              { label: "Gastos", value: "expense" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setTypeFilter(option.value as "all" | "income" | "expense")
                }
                className={`rounded-full px-3 py-1 transition ${
                  typeFilter === option.value
                    ? "bg-cyan-500/20 text-white"
                    : "hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-white/50">
          {sorted.length} movimientos
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
        <table className="min-w-full divide-y divide-white/5 text-left text-sm text-white/80">
          <thead>
            <tr className="text-xs uppercase tracking-[0.25em] text-white/40">
              <th className="px-4 py-3 font-normal">Fecha</th>
              <th className="px-4 py-3 font-normal">Concepto</th>
              <th className="px-4 py-3 font-normal">Subcategoría</th>
              <th className="px-4 py-3 font-normal">Categoría</th>
              <th className="px-4 py-3 font-normal text-right">Importe</th>
              <th className="px-4 py-3 font-normal text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sorted.map((tx) => {
              const draft = rowDrafts[tx.id] ?? {
                category: tx.category ?? "",
                subcategory: tx.subcategory ?? "",
                isDirty: false,
              };
              const amount = currencyFormatter.format(Math.abs(tx.amount));
              const isIncome = tx.type === "income";
              const rowFeedback = feedbackById[tx.id];
              const isSaving = savingId === tx.id && isPending;

              return (
                <tr key={tx.id} className="transition hover:bg-white/10">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-white/60">
                    {dateFormatter.format(new Date(tx.bankDate))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">
                      {tx.description || tx.rawConcept || "Sin descripción"}
                    </div>
                    {tx.rawConcept &&
                    tx.rawConcept.trim().toLowerCase() !==
                      (tx.description ?? "").trim().toLowerCase() ? (
                      <p className="text-xs text-white/40">{tx.rawConcept}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={draft.subcategory}
                      onChange={(event) =>
                        handleDraftChange(tx, "subcategory", event.target.value)
                      }
                      placeholder="Añade subcategoría…"
                      className="w-full rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={draft.category}
                      onChange={(event) =>
                        handleCategorySelection(tx, event.target.value)
                      }
                      className="w-full rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value="__new__">Nueva categoría…</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold">
                    <span
                      className={
                        isIncome ? "text-emerald-300" : "text-rose-300"
                      }
                    >
                      {isIncome ? "+" : "-"}
                      {amount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <button
                      type="button"
                      onClick={() => handleSave(tx)}
                      disabled={!draft.isDirty || isSaving}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-semibold transition ${
                        draft.isDirty && !isSaving
                          ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                          : "border-white/10 bg-white/5 text-white/50"
                      } ${isSaving ? "opacity-70" : ""}`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Guardando…
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" />
                          Guardar
                        </>
                      )}
                    </button>
                    {rowFeedback ? (
                      <span className="mt-2 block text-[11px] text-white/60">
                        {rowFeedback}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-white/50"
                >
                  No hay movimientos que coincidan con el filtro seleccionado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}


