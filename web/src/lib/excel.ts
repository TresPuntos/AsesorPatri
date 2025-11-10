import { randomUUID } from "node:crypto";
import { read, utils } from "xlsx";
import { parse } from "date-fns";
import { categorizeTransaction } from "./categorize";
import type { Transaction } from "./types";

type CellValue = string | number | boolean | Date | null;

const HEADER_ALIASES: Record<string, string> = {
  "f valor": "valueDate",
  fvalor: "valueDate",
  "fecha valor": "valueDate",
  fecha: "postedDate",
  concepto: "concept",
  descripcion: "concept",
  movimiento: "movement",
  importe: "amount",
  "importe operacion": "amount",
  importeoperacion: "amount",
  observaciones: "observations",
  "detalle notas": "observations",
  detallenotas: "observations",
  categoria: "category",
  "categoria 1": "category",
  categoria1: "category",
  subcategoria: "subcategory",
  "subcategoria 1": "subcategory",
  subcategoria1: "subcategory",
  subcatergoria: "subcategory",
};

function normalizeText(value: unknown): string {
  if (value == null) return "";
  return value
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

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

function parseAmount(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const compact = value.replace(/\s+/g, "");
    let normalized = compact;

    if (compact.includes(",") && compact.includes(".")) {
      normalized = compact.replace(/\./g, "").replace(/,/g, ".");
    } else if (compact.includes(",")) {
      normalized = compact.replace(/,/g, ".");
    }

    const result = Number(normalized);
    return Number.isNaN(result) ? null : result;
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

function isRowEmpty(row: CellValue[]): boolean {
  return row.every((cell) => normalizeCell(cell) === "");
}

function detectHeaderRow(matrix: CellValue[][]): {
  index: number;
  header: CellValue[];
} | null {
  for (let index = 0; index < matrix.length; index += 1) {
    const row = matrix[index] ?? [];
    const normalizedCells = row.map((cell) => normalizeText(cell));
    if (
      normalizedCells.includes("concepto") &&
      normalizedCells.includes("importe")
    ) {
      return { index, header: row };
    }
  }
  return null;
}

type ColumnIndex = Record<
  "valueDate" | "postedDate" | "concept" | "movement" | "amount" | "observations" | "category" | "subcategory",
  number[]
>;

function buildColumnIndex(header: CellValue[]): ColumnIndex {
  const base: ColumnIndex = {
    valueDate: [],
    postedDate: [],
    concept: [],
    movement: [],
    amount: [],
    observations: [],
    category: [],
    subcategory: [],
  };

  header.forEach((cell, idx) => {
    const key = HEADER_ALIASES[normalizeText(cell)];
    if (!key || !(key in base)) return;
    base[key as keyof ColumnIndex].push(idx);
  });

  return base;
}

function getFirstValue(row: CellValue[], indexes: number[]): unknown {
  for (const index of indexes) {
    if (index < 0 || index >= row.length) continue;
    const value = row[index];
    if (normalizeCell(value) !== "") {
      return value;
    }
  }
  return null;
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

  const matrix = utils.sheet_to_json<CellValue[]>(sheet, {
    defval: null,
    header: 1,
    raw: false,
  });

  const headerInfo = detectHeaderRow(matrix);
  if (!headerInfo) {
    return [];
  }

  const columnIndex = buildColumnIndex(headerInfo.header);
  const dataRows = matrix
    .slice(headerInfo.index + 1)
    .filter((row) => !isRowEmpty(row));

  const seenKeys = new Set<string>();

  const transactions = dataRows
    .map((row) => {
      const valueDateRaw = getFirstValue(row, columnIndex.valueDate);
      const valueDate = parseDate(valueDateRaw);
      if (!valueDate) return null;

      const postedDateRaw = getFirstValue(row, columnIndex.postedDate);
      const postedDate = parseDate(postedDateRaw);

      const amountRaw = getFirstValue(row, columnIndex.amount);
      const amountParsed = parseAmount(amountRaw);
      if (amountParsed == null) return null;
      const amount = amountParsed;

      const concept = normalizeCell(
        getFirstValue(row, columnIndex.concept),
      );
      const movement = normalizeCell(
        getFirstValue(row, columnIndex.movement),
      );
      const observations = normalizeCell(
        getFirstValue(row, columnIndex.observations),
      );
      const fileCategory = normalizeCell(
        getFirstValue(row, columnIndex.category),
      );
      const fileSubcategory = normalizeCell(
        getFirstValue(row, columnIndex.subcategory),
      );

      if (
        concept === "" &&
        movement === "" &&
        observations === "" &&
        amount === 0
      ) {
        return null;
      }

      const dedupeKey = [
        valueDate.toISOString().slice(0, 10),
        postedDate ? postedDate.toISOString().slice(0, 10) : "",
        amount.toFixed(2),
        concept,
        movement,
        observations,
      ].join("|");

      if (seenKeys.has(dedupeKey)) {
        return null;
      }
      seenKeys.add(dedupeKey);

      const inferred = categorizeTransaction({
        concept: `${concept} ${movement}`.trim(),
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
        description: concept || movement || observations || "Movimiento",
        rawConcept: concept,
        observations,
        amount,
        category,
        subcategory: fileSubcategory || movement || null,
        type,
        monthKey,
        source: filename ?? sheetName,
      };

      return transaction;
    })
    .filter((item): item is Transaction => Boolean(item));

  return transactions;
}


