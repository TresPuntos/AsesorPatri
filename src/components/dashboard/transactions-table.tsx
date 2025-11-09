"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { updateTransactionCategoryAction } from "@/app/actions/update-transaction-category";

interface TransactionsTableProps {
  transactions: Transaction[];
  categories: string[];
  monthLabel: string;
}

interface DraftState {
  category: string;
  subcategory: string;
  isDirty: boolean;
}

const monthNames = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sept",
  "oct",
  "nov",
  "dic",
] as const;

function formatDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha desconocida";
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = monthNames[date.getMonth()] ?? "";
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

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
}: TransactionsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((option) => {
      if (option?.trim()) set.add(option.trim());
    });
    transactions.forEach((tx) => {
      if (tx.category?.trim()) set.add(tx.category.trim());
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [categories, transactions]);

  const filteredTransactions = useMemo(() => {
    const tokens = search
      .toLowerCase()
      .split(" ")
      .map((token) => token.trim())
      .filter(Boolean);

    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (!tokens.length) return true;

      const haystack = [
        tx.description,
        tx.rawConcept,
        tx.category,
        tx.subcategory,
        tx.observations,
      ]
        .map((value) => value?.toString().toLowerCase() ?? "")
        .join(" ");

      return tokens.every((token) => haystack.includes(token));
    });
  }, [transactions, search, typeFilter]);

  const sortedTransactions = useMemo(
    () =>
      [...filteredTransactions].sort(
        (a, b) =>
          new Date(b.bankDate).getTime() - new Date(a.bankDate).getTime(),
      ),
    [filteredTransactions],
  );

  const setDraftValue = (
    tx: Transaction,
    field: "category" | "subcategory",
    value: string,
  ) => {
    setDrafts((prev) => {
      const base = prev[tx.id] ?? {
        category: tx.category ?? "",
        subcategory: tx.subcategory ?? "",
        isDirty: false,
      };

      const next: DraftState = { ...base, [field]: value };

      next.isDirty =
        next.category.trim() !== (tx.category ?? "").trim() ||
        next.subcategory.trim() !== (tx.subcategory ?? "").trim();

      return { ...prev, [tx.id]: next };
    });
  };

  const persistDraft = (tx: Transaction) => {
    const draft = drafts[tx.id] ?? {
      category: tx.category ?? "",
      subcategory: tx.subcategory ?? "",
      isDirty: false,
    };
    const category = draft.category.trim();
    const subcategory = draft.subcategory.trim();

    if (!category) {
      setFeedback((prev) => ({
        ...prev,
        [tx.id]: "Introduce una categoría antes de guardar.",
      }));
      return;
    }

    setSavingId(tx.id);
    setFeedback((prev) => ({ ...prev, [tx.id]: "" }));

    startTransition(async () => {
      const result = await updateTransactionCategoryAction({
        id: tx.id,
        category,
        subcategory: subcategory.length ? subcategory : undefined,
      });

      if (!result.success) {
        setFeedback((prev) => ({ ...prev, [tx.id]: result.message }));
        setSavingId(null);
        return;
      }

      setDrafts((prev) => ({
        ...prev,
        [tx.id]: { category, subcategory, isDirty: false },
      }));
      setFeedback((prev) => ({ ...prev, [tx.id]: "Cambios guardados." }));
      setSavingId(null);
      router.refresh();
    });
  };

  const handleCategorySelect = (tx: Transaction, value: string) => {
    if (value === "__new__") {
      const custom = window
        .prompt("Nombre de la nueva categoría:")
        ?.trim();
      if (!custom) return;
      setDraftValue(tx, "category", custom);
      return;
    }

    setDraftValue(tx, "category", value);
  };

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 text-white shadow-2xl shadow-black/40 backdrop-blur">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Partidas de {monthLabel}
          </h2>
          {isPending ? (
            <span className="flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando…
            </span>
          ) : null}
        </div>
        <p className="text-sm text-white/60">
          Ajusta las categorías de cada movimiento. Puedes crear nuevas
          categorías con la opción “Nueva categoría…”.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por concepto, categoría o notas…"
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
          {sortedTransactions.length} movimientos
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20">
        <table className="min-w-full divide-y divide-white/5 text-left text-sm text-white/80">
          <thead className="text-xs uppercase tracking-[0.25em] text-white/40">
            <tr>
              <th className="px-4 py-3 font-normal">Fecha</th>
              <th className="px-4 py-3 font-normal">Concepto</th>
              <th className="px-4 py-3 font-normal">Importe</th>
              <th className="px-4 py-3 font-normal">Categoría</th>
              <th className="px-4 py-3 font-normal">Subcategoría</th>
              <th className="px-4 py-3 font-normal text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sortedTransactions.map((tx) => {
              const draft = drafts[tx.id] ?? {
                category: tx.category ?? "",
                subcategory: tx.subcategory ?? "",
                isDirty: false,
              };

              const amount = currencyFormatter.format(Math.abs(tx.amount));
              const isIncome = tx.type === "income";
              const status = feedback[tx.id];

              return (
                <tr key={tx.id} className="transition hover:bg-white/5">
                  <td className="whitespace-nowrap px-4 py-3 align-top text-white/60">
                    {formatDate(tx.bankDate)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-white">
                      {tx.description || tx.rawConcept || "Sin descripción"}
                    </div>
                    {tx.rawConcept &&
                    tx.rawConcept.trim().toLowerCase() !==
                      (tx.description ?? "").trim().toLowerCase() ? (
                      <p className="text-xs text-white/40">{tx.rawConcept}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`font-semibold ${
                        isIncome ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {amount}
                    </span>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                      {isIncome ? "Ingreso" : "Gasto"}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <select
                      value={draft.category}
                      onChange={(event) =>
                        handleCategorySelect(tx, event.target.value)
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
                  <td className="px-4 py-3 align-top">
                    <input
                      value={draft.subcategory}
                      onChange={(event) =>
                        setDraftValue(tx, "subcategory", event.target.value)
                      }
                      placeholder="Añade subcategoría…"
                      className="w-full rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                    />
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <button
                      type="button"
                      onClick={() => persistDraft(tx)}
                      disabled={!draft.isDirty || savingId === tx.id}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                        draft.isDirty && savingId !== tx.id
                          ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
                          : "border-white/10 bg-white/5 text-white/50"
                      } ${savingId === tx.id ? "opacity-70" : ""}`}
                    >
                      {savingId === tx.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Guardar
                    </button>
                    {status ? (
                      <p className="mt-1 text-[11px] text-white/60">{status}</p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {sortedTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-white/40"
                >
                  No hay movimientos que coincidan con el filtro actual.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}


