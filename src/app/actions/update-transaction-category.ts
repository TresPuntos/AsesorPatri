"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";

interface UpdateTransactionCategoryInput {
  id: string;
  category: string;
  subcategory?: string | null;
}

interface UpdateTransactionCategoryResponse {
  success: boolean;
  message: string;
}

export async function updateTransactionCategoryAction(
  input: UpdateTransactionCategoryInput,
): Promise<UpdateTransactionCategoryResponse> {
  try {
    const id = input.id?.trim();
    const category = input.category?.trim();
    const subcategory =
      input.subcategory && input.subcategory.trim().length > 0
        ? input.subcategory.trim()
        : null;

    if (!id) {
      return { success: false, message: "Movimiento no encontrado." };
    }

    if (!category) {
      return {
        success: false,
        message: "Introduce una categoría para guardar los cambios.",
      };
    }

    await sql`
      UPDATE transactions
      SET category = ${category}, subcategory = ${subcategory}
      WHERE id = ${id};
    `;

    revalidatePath("/");

    return { success: true, message: "Categoría actualizada." };
  } catch (error) {
    console.error("Error actualizando categoría:", error);
    return {
      success: false,
      message:
        "No pude guardar la categoría. Inténtalo de nuevo en unos segundos.",
    };
  }
}


