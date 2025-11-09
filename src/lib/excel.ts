import { randomUUID } from "node:crypto";
import { read, utils } from "xlsx";
import { parse } from "date-fns";
import { categorizeTransaction } from "./categorize";
import type { Transaction } from "./types";

function parseDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    // Excel serial date number
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const result = new Date(epoch.getTime() + value * 24 * 60 * 60 * 1000);
    return Number.isNaN(result.getTime()) ? null : result;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = parse(trimmed, "dd/MM/yyyy", new Date());
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    const iso = new Date(trimmed);
    if (!Number.isNaN(iso.getTime())) {
      return iso;
    }
  }

  return null;
}

function monthKeyFromDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function normalizeCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return value.toString().trim();
}

export function parseWorkbookToTransactions(
  arrayBuffer: ArrayBuffer,
  {
    filename,
    userId = "patri",
  }: {
    filename?: string;
    userId?: string;
  } = {},
): Transaction[] {
  const workbook = read(arrayBuffer, { type: "array" });
  const sheetName =
    workbook.SheetNames.find((name) =>
      name.toLowerCase().includes("informe"),
    ) ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  return rows
    .map((row) => {
      const valueDate = parseDate(row["F.Valor"]) ?? parseDate(row["Fecha"]);
      if (!valueDate) {
        return null;
      }

      const postedDate = parseDate(row["Fecha"]);
      const rawAmount = Number(row["Importe"]) || 0;
      const amount = Number.isNaN(rawAmount) ? 0 : rawAmount;
      const concept = row["Concepto"]?.toString() ?? "";
      const observations = row["Observaciones"]?.toString() ?? "";
      const movimiento = row["Movimiento"]?.toString() ?? "";
      const fileSubcategory =
        normalizeCell(row["Subcatergoria"]) ||
        normalizeCell(row["Subcategoría"]);
      const fileCategory =
        normalizeCell(row["Categoria"]) ||
        normalizeCell(row["Categoría"]);

      const inferred = categorizeTransaction({
        concept: `${concept} ${movimiento}`.trim(),
        observations,
        amount,
      });

      const category = fileCategory || inferred.category;
      const type = amount >= 0 ? "income" : inferred.type;

      const monthKey = monthKeyFromDate(valueDate);

      const transaction: Transaction = {
        id: randomUUID(),
        userId,
        bankDate: valueDate,
        postedDate,
        description: concept || movimiento || observations || "Movimiento",
        rawConcept: concept,
        observations,
        amount,
        category,
        subcategory: fileSubcategory || movimiento || null,
        type,
        monthKey,
        source: filename ?? sheetName,
      };

      return transaction;
    })
    .filter((item): item is Transaction => Boolean(item));
}


