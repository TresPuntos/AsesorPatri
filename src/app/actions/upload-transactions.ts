"use server";

import { revalidatePath } from "next/cache";
import { ensureDatabase } from "@/lib/db";
import { parseWorkbookToTransactions } from "@/lib/excel";
import { upsertTransactions } from "@/lib/transactions";

interface UploadResponse {
  success: boolean;
  message: string;
  inserted?: number;
  monthKey?: string;
}

export async function uploadTransactionsAction(formData: FormData): Promise<UploadResponse> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      success: false,
      message: "Necesito un archivo .xlsx o .csv para empezar.",
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls", "csv"].includes(extension ?? "")) {
    return {
      success: false,
      message: "Formato no soportado. Sube un archivo Excel (.xlsx) o CSV.",
    };
  }

  const buffer = await file.arrayBuffer();

  await ensureDatabase();

  const transactions = parseWorkbookToTransactions(buffer, {
    filename: file.name,
  });

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
}


