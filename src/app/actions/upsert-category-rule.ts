"use server";

import { revalidatePath } from "next/cache";
import { ensureDatabase, sql } from "@/lib/db";
import {
  applyRuleToHistory,
  upsertCategoryRule,
} from "@/lib/category-rules";
import type { TransactionType } from "@/lib/types";

interface UpsertCategoryRuleInput {
  transactionId: string;
  applyToFuture: boolean;
  applyToHistory?: boolean;
}

interface UpsertCategoryRuleResponse {
  success: boolean;
  message: string;
}

export async function upsertCategoryRuleAction(
  input: UpsertCategoryRuleInput,
): Promise<UpsertCategoryRuleResponse> {
  const transactionId = input.transactionId?.trim();
  const applyToFuture = Boolean(input.applyToFuture);
  const applyToHistory = Boolean(input.applyToHistory);

  if (!transactionId) {
    return { success: false, message: "Movimiento no encontrado." };
  }

  if (!applyToFuture && !applyToHistory) {
    return { success: true, message: "No se necesitaban reglas nuevas." };
  }

  await ensureDatabase();

  const result = await sql<{
    id: string;
    userId: string;
    description: string | null;
    rawConcept: string | null;
    observations: string | null;
    category: string | null;
    subcategory: string | null;
    type: string | null;
    amount: number;
  }>`
    SELECT
      id,
      user_id as "userId",
      description,
      raw_concept as "rawConcept",
      observations,
      category,
      subcategory,
      type,
      amount::float as "amount"
    FROM transactions
    WHERE id = ${transactionId}
    LIMIT 1;
  `;

  const transaction = result.rows[0];

  if (!transaction) {
    return { success: false, message: "Movimiento no encontrado." };
  }

  const pattern =
    transaction.rawConcept?.trim() ||
    transaction.description?.trim() ||
    transaction.observations?.trim() ||
    "";

  if (!pattern) {
    return {
      success: false,
      message:
        "No pude generar una regla sin un texto de referencia. Ajusta manualmente otras partidas similares.",
    };
  }

  const matchDescription = Boolean(
    transaction.rawConcept?.trim() || transaction.description?.trim(),
  );
  const matchObservations = Boolean(transaction.observations?.trim());

  const category = transaction.category?.trim();
  if (!category) {
    return {
      success: false,
      message:
        "Aún no hay una categoría guardada. Vuelve a intentarlo después de actualizar el movimiento.",
    };
  }

  const subcategory =
    transaction.subcategory?.trim().length
      ? transaction.subcategory.trim()
      : null;

  const type =
    transaction.type === "income" || transaction.type === "expense"
      ? (transaction.type as TransactionType)
      : (transaction.amount ?? 0) >= 0
        ? "income"
        : "expense";

  if (applyToFuture) {
    await upsertCategoryRule({
      userId: transaction.userId,
      pattern,
      category,
      subcategory,
      type,
      matchDescription,
      matchObservations,
    });
  }

  if (applyToHistory) {
    await applyRuleToHistory({
      userId: transaction.userId,
      pattern,
      category,
      subcategory,
      type,
      matchDescription,
      matchObservations,
    });
  }

  revalidatePath("/");

  return {
    success: true,
    message: "Reglas de categorización actualizadas.",
  };
}


