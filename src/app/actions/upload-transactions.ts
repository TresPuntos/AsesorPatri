"use server";

import { revalidatePath } from "next/cache";
import { ensureDatabase } from "@/lib/db";
import { parseWorkbookToTransactions } from "@/lib/excel";
import { upsertTransactions } from "@/lib/transactions";
import {
  applyCategoryRules,
  getCategoryRules,
  UNCATEGORIZED_LABEL,
} from "@/lib/category-rules";
import { categorizeTransactionsWithAI } from "@/lib/ai-categorize";

interface UploadResponse {
  success: boolean;
  message: string;
  inserted?: number;
  monthKey?: string;
}

function hasConnectionString() {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING,
  );
}

export async function uploadTransactionsAction(
  formData: FormData,
): Promise<UploadResponse> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      success: false,
      message: "Necesito que adjuntes un archivo .xlsx o .csv para continuar.",
    };
  }

  if (!hasConnectionString()) {
    return {
      success: false,
      message:
        "No encuentro la base de datos. Verifica que POSTGRES_URL está configurado en Vercel.",
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls", "csv"].includes(extension ?? "")) {
    return {
      success: false,
      message: "Formato no soportado. Sube un archivo Excel (.xlsx) o CSV.",
    };
  }

  try {
    const buffer = await file.arrayBuffer();

    await ensureDatabase();

    const transactions = parseWorkbookToTransactions(buffer, {
      filename: file.name,
    });

    const userId = transactions[0]?.userId ?? "patri";

    if (transactions.length) {
      const rules = await getCategoryRules(userId);
      applyCategoryRules(transactions, rules);

      const candidates = transactions
        .filter(
          (tx) =>
            tx.categorizationSource === "heuristic" ||
            tx.category === UNCATEGORIZED_LABEL,
        )
        .map((tx) => ({
          id: tx.id,
          description: tx.description ?? "",
          rawConcept: tx.rawConcept ?? "",
          observations: tx.observations ?? "",
          amount: tx.amount,
          currency: "EUR",
        }));

      if (candidates.length) {
        const aiResults = await categorizeTransactionsWithAI(candidates);
        transactions.forEach((tx) => {
          if (
            tx.categorizationSource !== "heuristic" &&
            tx.category !== UNCATEGORIZED_LABEL
          ) {
            return;
          }

          const match = aiResults.get(tx.id);
          if (match && match.category) {
            tx.category = match.category;
            tx.subcategory = match.subcategory ?? tx.subcategory;
            tx.type =
              match.type ??
              (tx.amount >= 0 ? "income" : ("expense" as const));
            tx.pendingCategory = false;
            tx.categorizationSource = "ai";
            tx.aiConfidence = match.confidence ?? null;
            tx.aiReason = match.reason ?? null;
            return;
          }

          tx.category = UNCATEGORIZED_LABEL;
          tx.pendingCategory = true;
          tx.categorizationSource = "ai";
          tx.aiConfidence = match?.confidence ?? null;
          tx.aiReason = match?.reason ?? null;
        });
      }
    }

    if (!transactions.length) {
      return {
        success: false,
        message: "No pude leer movimientos en el archivo. Revisa el formato.",
      };
    }

    await upsertTransactions(transactions);

    revalidatePath("/");

    return {
      success: true,
      message: `Datos de ${transactions[0]!.monthKey} actualizados con éxito.`,
      inserted: transactions.length,
      monthKey: transactions[0]!.monthKey,
    };
  } catch (error) {
    console.error("Error al importar movimientos:", error);
    return {
      success: false,
      message:
        "Hubo un problema al procesar el extracto. Inténtalo de nuevo o revisa el formato del archivo.",
    };
  }
}


