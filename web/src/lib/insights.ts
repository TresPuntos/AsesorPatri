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

export async function generateAIInsights(
  facts: InsightFacts,
): Promise<InsightMessages> {
  // Integración con OpenAI temporalmente desactivada hasta que confirmemos
  // contrato y modelo con el equipo de Patri. Devolvemos la información base
  // calculada en el servidor sin modificaciones.
  return {
    alerts: [...facts.baseline.alerts],
    recommendations: [...facts.baseline.recommendations],
  };
}


