"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { updateTransactionCategoryAction } from "@/app/actions/update-transaction-category";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

interface TransactionsTableProps {
  transactions: Transaction[];
  categories: string[];
  monthLabel: string;
}

interface TableRowState {
  category: string;
  subcategory: string;
  isDirty: boolean;
}

export function TransactionsTable({
  transactions,
  categories,
  monthLabel,
}: TransactionsTableProps) {
  const router = useRouter();
  const datalistId = useId();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [rowState, setRowState] = useState<Record<string, TableRowState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const normalizedCategories = useMemo(() => {
    return Array.from(new Set(categories.concat("Otros Gastos Generales")))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [categories]);

  const filtered = useMemo(() => {
    const needles = search
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 0);

    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (!needles.length) return true;
      const haystack = [
        tx.description,
        tx.subcategory,
        tx.category,
        tx.observations,
      ]
        .join(" ")
        .toLowerCase();
      return needles.every((needle) => haystack.includes(needle));
    });
  }, [transactions, search, typeFilter]);

  const handleChange = (
    id: string,
    field: "category" | "subcategory",
    value: string,
  ) => {
    setRowState((prev) => {
      const base = prev[id] ?? {
        category: transactions.find((tx) => tx.id === id)?.category ?? "",
        subcategory:
          transactions.find((tx) => tx.id === id)?.subcategory ?? "",
        isDirty: false,
      };

      const next: TableRowState = {
        ...base,
        [field]: value,
      } as TableRowState;

      const tx = transactions.find((item) => item.id === id);
      next.isDirty =
        (next.category ?? "").trim() !== (tx?.category ?? "") ||
        (next.subcategory ?? "").trim() !== (tx?.subcategory ?? "");

      return { ...prev, [id]: next };
    });
  };

  const handleSave = (id: string) => {
    const tx = transactions.find((item) => item.id === id);
    if (!tx) return;

    const state = rowState[id] ?? {
      category: tx.category ?? "",
      subcategory: tx.subcategory ?? "",
      isDirty: false,
    };

    const payload = {
      id,
      category: (state.category ?? tx.category ?? "").trim(),
      subcategory: (state.subcategory ?? tx.subcategory ?? "")?.trim() ?? "",
    };

    setSavingId(id);
    setFeedback((prev) => ({ ...prev, [id]: "" }));
    startTransition(async () => {
      const result = await updateTransactionCategoryAction(payload);
      if (result.success) {
        setFeedback((prev) => ({ ...prev, [id]: "guardado" }));
        router.refresh();
        setRowState((prev) => ({ ...prev, [id]: { ...state, isDirty: false } }));
      } else {
        setFeedback((prev) => ({ ...prev, [id]: "error" }));
      }
      setSavingId(null);
    });
  };

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-white/5 bg-black/40 p-6 shadow-2xl shadow-black/40 backdrop-blur">
      <header className="flex flex-col gap-2 text-white">
        <h2 className="text-2xl font-semibold tracking-tight">
          Partidas de {monthLabel}
        </h2>
        <p className="text-sm text-white/60">
          Actualiza la categoría o subcategoría de cada movimiento. Los cambios
          se guardan al pulsar “Guardar”.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por descripción, subcategoría o categoría..."
            className="h-10 w-full rounded-full border border-white/10 bg-black/30 px-4 text-sm text-white shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 sm:max-w-md"
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
          {filtered.length} movimientos
        </span>
      </div>

  ...

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { updateTransactionCategoryAction } from "@/app/actions/update-transaction-category";

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

type FeedbackState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

interface TransactionsTableProps {
  transactions: Transaction[];
  categories: string[];
  monthLabel: string;
}

export function TransactionsTable({
  transactions,
  categories,
  monthLabel,
}: TransactionsTableProps) {
  const [localTransactions, setLocalTransactions] = useState(() =>
    transactions.map((tx) => ({
      ...tx,
      bankDate: new Date(tx.bankDate),
      postedDate: tx.postedDate ? new Date(tx.postedDate) : null,
    })),
  );
  const [localCategories, setLocalCategories] = useState(() => [...categories]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalTransactions(
      transactions.map((tx) => ({
        ...tx,
        bankDate: new Date(tx.bankDate),
        postedDate: tx.postedDate ? new Date(tx.postedDate) : null,
      })),
    );
  }, [transactions]);

  useEffect(() => {
    setLocalCategories((prev) => {
      const merged = new Set([...prev, ...categories]);
      return Array.from(merged).sort((a, b) =>
        a.localeCompare(b, "es", { sensitivity: "base" }),
      );
    });
  }, [categories]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return localTransactions.filter((tx) => {
      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      if (!matchesType) return false;

      if (!term) return true;

      const haystack = [
        tx.description,
        tx.rawConcept,
        tx.category,
        tx.subcategory ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [localTransactions, searchTerm, typeFilter]);

  const sortedTransactions = useMemo(
    () =>
      [...filteredTransactions].sort(
        (a, b) => b.bankDate.getTime() - a.bankDate.getTime(),
      ),
    [filteredTransactions],
  );

  const handleCategoryChange = (
    transactionId: string,
    nextCategory: string,
    previousCategory: string,
  ) => {
    const normalized = nextCategory.trim();

    if (!normalized) {
      setFeedback({
        type: "error",
        message: "La categoría no puede quedar vacía.",
      });
      return;
    }

    setLocalTransactions((prev) =>
      prev.map((tx) =>
        tx.id === transactionId ? { ...tx, category: normalized } : tx,
      ),
    );

    startTransition(() => {
      updateTransactionCategoryAction({
        transactionId,
        category: normalized,
      })
        .then((result) => {
          if (!result.success) {
            setLocalTransactions((prev) =>
              prev.map((tx) =>
                tx.id === transactionId
                  ? { ...tx, category: previousCategory }
                  : tx,
              ),
            );
            setFeedback({ type: "error", message: result.message });
            return;
          }

          setFeedback({ type: "success", message: result.message });

          setLocalCategories((prev) => {
            if (prev.includes(normalized)) {
              return prev;
            }
            const updated = [...prev, normalized];
            updated.sort((a, b) =>
              a.localeCompare(b, "es", { sensitivity: "base" }),
            );
            return updated;
          });
        })
        .catch((error) => {
          console.error("Fallo al actualizar la categoría:", error);
          setLocalTransactions((prev) =>
            prev.map((tx) =>
              tx.id === transactionId
                ? { ...tx, category: previousCategory }
                : tx,
            ),
          );
          setFeedback({
            type: "error",
            message: "No pude actualizar la categoría. Inténtalo más tarde.",
          });
        });
    });
  };

  const handleCategorySelection = (
    transactionId: string,
    previousCategory: string,
    value: string,
  ) => {
    if (value === "__new__") {
      const custom = window
        .prompt("Nombre de la nueva categoría:")
        ?.trim();

      if (!custom) {
        setLocalTransactions((prev) =>
          prev.map((tx) =>
            tx.id === transactionId
              ? { ...tx, category: previousCategory }
              : tx,
          ),
        );
        return;
      }

      handleCategoryChange(transactionId, custom, previousCategory);
      return;
    }

    handleCategoryChange(transactionId, value, previousCategory);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 text-white shadow-2xl shadow-black/40"
    >
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Control detallado
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Partidas de {monthLabel}
          </h2>
          {isPending ? (
            <span className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Guardando cambios…
            </span>
          ) : null}
        </div>
        <p className="text-sm text-white/60">
          Revisa cada movimiento del mes y ajusta la categoría en el acto. Si
          necesitas una nueva categoría, créala desde aquí mismo.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por concepto, categoría o nota…"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="hidden text-xs uppercase tracking-[0.3em] text-white/50 md:inline">
            Tipo
          </span>
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as "all" | "income" | "expense")
            }
            className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          >
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
        </div>
      </div>

      {feedback ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
        <table className="min-w-full divide-y divide-white/5 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.25em] text-white/40">
              <th className="px-4 py-3 font-normal">Fecha</th>
              <th className="px-4 py-3 font-normal">Concepto</th>
              <th className="px-4 py-3 font-normal">Importe</th>
              <th className="px-4 py-3 font-normal">Categoría</th>
              <th className="px-4 py-3 font-normal">Subcategoría</th>
              <th className="px-4 py-3 font-normal">Origen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-white/80">
            {sortedTransactions.map((tx) => {
              const amount = currencyFormatter.format(Math.abs(tx.amount));
              const isIncome = tx.type === "income";

              return (
                <tr
                  key={tx.id}
                  className="bg-white/0 transition hover:bg-white/5"
                >
                  <td className="whitespace-nowrap px-4 py-3 align-top text-white/70">
                    {dateFormatter.format(tx.bankDate)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-white">
                      {tx.description || tx.rawConcept || "Sin concepto"}
                    </div>
                    {tx.rawConcept &&
                    tx.rawConcept.trim().toLowerCase() !==
                      (tx.description ?? "").trim().toLowerCase() ? (
                      <p className="text-xs text-white/40">{tx.rawConcept}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div
                      className={`font-semibold ${
                        isIncome ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {amount}
                    </div>
                    <span className="text-xs uppercase tracking-[0.3em] text-white/40">
                      {isIncome ? "Ingreso" : "Gasto"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <select
                        value={tx.category}
                        onChange={(event) =>
                          handleCategorySelection(
                            tx.id,
                            tx.category,
                            event.target.value,
                          )
                        }
                        className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                      >
                        {localCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                        <option value="__new__">Nueva categoría…</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-white/60">
                    {tx.subcategory ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-white/60">
                    {tx.source ?? "Sin especificar"}
                  </td>
                </tr>
              );
            })}
            {sortedTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-white/40"
                >
                  No encuentro movimientos que coincidan con el filtro
                  seleccionado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}


