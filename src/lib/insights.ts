import OpenAI from "openai";
import { getOpenAIClient } from "./openai-client";

export interface InsightFacts {
  monthLabel: string;
  goal: number;
  savings: number;
  gapToGoal: number;
  savingsProgress: number | null;
  income: number;
  expenses: number;
  balance: number;
  averageDailySpend: number;
  daysTracked: number;
  deltas: {
    incomeChangePercent?: number;
    expenseChangePercent?: number;
    balanceChangePercent?: number;
  };
  previous?: {
    income: number;
    expenses: number;
    balance: number;
    savings: number;
  };
  categoryInsights: Array<{
    category: string;
    type: "income" | "expense";
    total: number;
    percentage: number;
    changePercent?: number;
  }>;
  notableFacts: string[];
  baseline: {
    alerts: string[];
    recommendations: string[];
  };
}

export interface InsightMessages {
  alerts: string[];
  recommendations: string[];
}

const MODEL =
  process.env.OPENAI_FINANCIAL_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-4o-mini";

const SYSTEM_PROMPT = [
  "Eres Patri, una asesora financiera española que habla con cercanía y sin dramatizar.",
  "Tu objetivo es transformar los datos en alertas y próximos pasos accionables, concretos y realistas.",
  "Nunca inventes cifras: usa exclusivamente la información proporcionada o cálculos directos y sencillos.",
  "Entrega como máximo 3 alertas y 3 recomendaciones. Si no ves riesgo, puedes devolver menos.",
  "No recomiendes recortes ni ajustes en categorías marcadas como no flexibles. Busca alternativas pequeñas y asumibles.",
  "Celebra los progresos, señala riesgos con calma y enfócate en hábitos prácticos fáciles de ejecutar.",
].join("\n");

const NON_FLEXIBLE_CATEGORY_NAMES = new Set(
  [
    "vivienda y préstamos",
    "hipoteca",
    "alquiler",
    "suministros",
    "suministros esenciales",
    "impuestos",
    "seguros",
  ].map((item) => item.toLowerCase()),
);

const NON_FLEXIBLE_KEYWORDS = ["vivienda", "hipoteca", "alquiler"];
const REDUCTION_KEYWORDS = ["reduce", "recorta", "recortar", "disminu", "baja", "ajusta"];

function isCategoryFlexible(category: string): boolean {
  const normalized = category.trim().toLowerCase();
  if (!normalized) return true;
  if (NON_FLEXIBLE_CATEGORY_NAMES.has(normalized)) return false;
  return !NON_FLEXIBLE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function buildPrompt(facts: InsightFacts): string {
  const categories = facts.categoryInsights.map((category) => ({
    name: category.category,
    type: category.type,
    total: category.total,
    sharePercent: category.percentage,
    changePercent: category.changePercent ?? null,
    flexible: isCategoryFlexible(category.category),
  }));

  const payload = {
    monthLabel: facts.monthLabel,
    goal: facts.goal,
    savings: facts.savings,
    gapToGoal: facts.gapToGoal,
    savingsProgress: facts.savingsProgress,
    income: facts.income,
    expenses: facts.expenses,
    balance: facts.balance,
    averageDailySpend: facts.averageDailySpend,
    daysTracked: facts.daysTracked,
    deltas: facts.deltas,
    previous: facts.previous ?? null,
    categoryInsights: categories,
    notableFacts: facts.notableFacts,
    baseline: facts.baseline,
  };

  return [
    "Datos del mes (usa solo este contenido, está en JSON válido):",
    JSON.stringify(payload, null, 2),
    [
      "Genera un JSON con la estructura {\"alerts\":[],\"recommendations\":[]}.",
      "Cada elemento debe ser una frase breve en español peninsular, tono empático.",
      "Máximo 3 elementos por lista. Si no hay riesgo, deja la lista vacía.",
      "Respeta las banderas flexible=false: no sugieras recortes directos en esas categorías; busca alternativas.",
      "Incluye siempre observaciones accionables (por ejemplo, porcentajes, hábitos concretos, revisiones puntuales).",
    ].join(" "),
  ].join("\n\n");
}

function parseModelOutput(raw: string): InsightMessages | null {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") {
      return null;
    }
    const alerts = Array.isArray((data as Record<string, unknown>).alerts)
      ? (data as Record<string, unknown>).alerts
      : [];
    const recommendations = Array.isArray(
      (data as Record<string, unknown>).recommendations,
    )
      ? (data as Record<string, unknown>).recommendations
      : [];
    return {
      alerts: alerts as string[],
      recommendations: recommendations as string[],
    };
  } catch {
    return null;
  }
}

function containsRestrictedReduction(text: string): boolean {
  const normalized = text.toLowerCase();
  const referencesRestricted = NON_FLEXIBLE_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );
  const mentionsReduction = REDUCTION_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );
  return referencesRestricted && mentionsReduction;
}

function sanitizeMessages(messages: unknown, fallback: string[]): string[] {
  if (!Array.isArray(messages)) {
    return [...fallback];
  }

  const seen = new Set<string>();
  const sanitized: string[] = [];

  messages.forEach((entry) => {
    if (typeof entry !== "string") return;
    const trimmed = entry.trim();
    if (!trimmed) return;
    if (containsRestrictedReduction(trimmed)) return;
    if (seen.has(trimmed)) return;
    seen.add(trimmed);
    sanitized.push(trimmed);
  });

  if (sanitized.length === 0) {
    return [...fallback];
  }

  return sanitized.slice(0, 3);
}

function extractResponseText(response: OpenAI.Responses.Response): string | null {
  const outputText = (response as unknown as { output_text?: string | null }).output_text;
  if (outputText) {
    return outputText;
  }

  const output = (response as unknown as { output?: Array<{ content?: Array<{ text?: string }> }> })
    .output;

  if (Array.isArray(output)) {
    for (const block of output) {
      if (!Array.isArray(block?.content)) continue;
      for (const item of block.content) {
        if (item?.text) {
          return item.text;
        }
      }
    }
  }

  return null;
}

export async function generateAIInsights(
  facts: InsightFacts,
): Promise<InsightMessages> {
  const openaiClient = getOpenAIClient();
  if (!openaiClient) {
    return {
      alerts: [...facts.baseline.alerts],
      recommendations: [...facts.baseline.recommendations],
    };
  }

  try {
    const response = await openaiClient.responses.create({
      model: MODEL,
      temperature: 0.4,
      max_output_tokens: 600,
      input: [
        {
          role: "system",
      content: [{ type: "input_text", text: SYSTEM_PROMPT }],
        },
        {
          role: "user",
      content: [{ type: "input_text", text: buildPrompt(facts) }],
        },
      ],
    });

    const rawText = extractResponseText(response)?.trim();

    if (!rawText) {
      throw new Error("La respuesta del modelo está vacía.");
    }

    const parsed = parseModelOutput(rawText);

    if (!parsed) {
      throw new Error("El modelo devolvió un JSON no válido.");
    }

    return {
      alerts: sanitizeMessages(parsed.alerts, facts.baseline.alerts),
      recommendations: sanitizeMessages(
        parsed.recommendations,
        facts.baseline.recommendations,
      ),
    };
  } catch (error) {
    console.error("No se pudieron generar insights con IA:", error);
  }

  return {
    alerts: [...facts.baseline.alerts],
    recommendations: [...facts.baseline.recommendations],
  };
}
