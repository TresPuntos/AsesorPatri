import type { TransactionType } from "./types";
import { PRESET_CATEGORIES } from "./category-constants";
import { getOpenAIClient } from "./openai-client";

interface CategorizationCandidate {
  id: string;
  description: string;
  rawConcept: string;
  observations: string;
  amount: number;
  currency: string;
}

export interface AICategorization {
  id: string;
  category: string | null;
  subcategory: string | null;
  type: TransactionType | null;
  confidence: number | null;
  reason: string | null;
}

const MODEL =
  process.env.OPENAI_CATEGORIZATION_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-4o-mini";

const SYSTEM_PROMPT = [
  "Eres una asistente financiera especializada en movimientos bancarios españoles.",
  "Tu tarea es clasificar cada transacción en una categoría y subcategoría coherente con un control de gastos personal.",
  "Debes responder exclusivamente en JSON válido.",
  "Si no puedes determinar la categoría, deja el campo category en blanco.",
].join(" ");

function buildUserPrompt(candidates: CategorizationCandidate[]): string {
  return [
    "Clasifica las siguientes transacciones. Devuelve un JSON con la forma {\"results\": Array<Resultado>}.",
    "Cada Resultado debe tener: id, category, subcategory, type (\"income\" | \"expense\"), confidence (0-1) y reason (explica brevemente la decisión).",
    "Utiliza las siguientes categorías propuestas y escoge la que más se aproxime. Puedes proponer otra similar si ninguna encaja:",
    PRESET_CATEGORIES.join(", "),
    "Si no sabes la categoría deja category como cadena vacía y reason explica la duda. Subcategory puede estar vacía.",
    "Los datos vienen en JSON:",
    JSON.stringify(
      candidates.map((candidate) => ({
        id: candidate.id,
        description: candidate.description,
        rawConcept: candidate.rawConcept,
        observations: candidate.observations,
        amount: candidate.amount,
        currency: candidate.currency,
      })),
      null,
      2,
    ),
  ].join("\n\n");
}

function safeParseResponse(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractResults(payload: Record<string, unknown>): AICategorization[] {
  const results = payload.results;
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : null;
      if (!id) return null;

      const confidence =
        typeof record.confidence === "number"
          ? Math.max(0, Math.min(1, record.confidence))
          : null;

      const type =
        record.type === "income" || record.type === "expense"
          ? (record.type as TransactionType)
          : null;

      const category =
        typeof record.category === "string" && record.category.trim().length > 0
          ? record.category.trim()
          : null;

      const subcategory =
        typeof record.subcategory === "string" &&
        record.subcategory.trim().length > 0
          ? record.subcategory.trim()
          : null;

      const reason =
        typeof record.reason === "string" && record.reason.trim().length > 0
          ? record.reason.trim()
          : null;

      return {
        id,
        category,
        subcategory,
        type,
        confidence,
        reason,
      };
    })
    .filter((item): item is AICategorization => Boolean(item));
}

async function requestCategorizationBatch(
  candidates: CategorizationCandidate[],
): Promise<AICategorization[]> {
  const client = getOpenAIClient();
  if (!client) {
    return [];
  }

  if (!candidates.length) {
    return [];
  }

  try {
    const response = await client.responses.create({
      model: MODEL,
      temperature: 0.2,
      max_output_tokens: 800,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: SYSTEM_PROMPT }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: buildUserPrompt(candidates) }],
        },
      ],
    });

    const rawOutput =
      (response as unknown as { output_text?: string | null }).output_text ??
      null;

    const rawText = rawOutput?.trim();
    if (!rawText) {
      return [];
    }

    const parsed = safeParseResponse(rawText);
    if (!parsed) {
      return [];
    }

    return extractResults(parsed);
  } catch (error) {
    console.error("Fallo categorizando con IA:", error);
  }

  return [];
}

export async function categorizeTransactionsWithAI(
  candidates: CategorizationCandidate[],
): Promise<Map<string, AICategorization>> {
  const results = new Map<string, AICategorization>();

  if (!candidates.length) {
    return results;
  }

  const chunkSize = Number(process.env.OPENAI_CATEGORIZATION_BATCH_SIZE ?? 20);
  for (let index = 0; index < candidates.length; index += chunkSize) {
    const batch = candidates.slice(index, index + chunkSize);
    const batchResults = await requestCategorizationBatch(batch);
    batchResults.forEach((item) => {
      results.set(item.id, item);
    });
  }

  return results;
}


