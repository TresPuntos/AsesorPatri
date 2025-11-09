import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type {
  CategorySummary,
  DashboardData,
  MonthSummary,
  Transaction,
} from "./types";
import { generateAIInsights, type InsightFacts } from "./insights";

const PRESET_CATEGORIES = [
  "Suministros",
  "Ocio y Entretenimiento",
  "Vivienda y Préstamos",
  "Transferencias y Efectivo",
  "BBVA",
  "Otros Gastos Generales",
  "Salud y Cuidado",
  "Moto",
  "Supermercado",
  "Otros Ingresos",
  "Ahorro",
  "Educación",
  "Viajes",
  "Impuestos",
  "Mascotas",
];

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const iso = `${monthKey}-01`;
  return {
    label: format(parseISO(iso), "LLLL yyyy", { locale: es }),
    month,
    year,
  };
}

function aggregateMonth(transactions: Transaction[]): MonthSummary {
  const [example] = transactions;
  const { label, month, year } = monthLabel(example.monthKey);

  const expenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const income = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const uniqueDays = new Set(
    transactions.map((tx) => tx.bankDate.toISOString().slice(0, 10)),
  ).size;

  const balance = income + expenses;
  const averageDailySpend =
    uniqueDays > 0 ? Math.abs(expenses) / uniqueDays : 0;

  return {
    monthKey: example.monthKey,
    label,
    month,
    year,
    income,
    expenses,
    balance,
    savings: balance,
    averageDailySpend,
    daysTracked: uniqueDays,
  };
}

function buildCategorySummary(transactions: Transaction[]): CategorySummary[] {
  const totalExpenses = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const groups = new Map<string, { total: number; type: "income" | "expense" }>();

  transactions.forEach((tx) => {
    const existing = groups.get(tx.category) ?? { total: 0, type: tx.type };
    existing.total += tx.type === "expense" ? Math.abs(tx.amount) : tx.amount;
    existing.type = tx.type;
    groups.set(tx.category, existing);
  });

  return Array.from(groups.entries())
    .map(([category, { total, type }]) => ({
      category,
      total,
      type,
      percentage:
        totalExpenses === 0 || type === "income"
          ? 0
          : (total / totalExpenses) * 100,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
}

function buildAlerts(
  current: MonthSummary | undefined,
  previous: MonthSummary | undefined,
  currentCategories: CategorySummary[],
  previousCategories: CategorySummary[],
  goal: number,
): string[] {
  const alerts: string[] = [];

  if (!current) return alerts;

  if (current.savings < goal) {
    const gap = goal - current.savings;
    alerts.push(
      `Nos quedamos a ${gap.toFixed(
        0,
      )} € del objetivo. Ajustemos un poco el gasto este mes.`,
    );
  } else if (current.savings < goal * 1.2) {
    alerts.push(
      `¡Objetivo superado! Vamos ${(
        current.savings - goal
      ).toFixed(0)} € por encima del reto de ahorro.`,
    );
  }

  if (previous) {
    const spendingDelta = current.expenses - previous.expenses;
    if (spendingDelta < 0) {
      alerts.push("Reduciste tus gastos totales respecto al mes anterior. 👏");
    }

    currentCategories.forEach((category) => {
      if (category.type === "income") return;
      const prev = previousCategories.find((item) => item.category === category.category);
      if (!prev || prev.total === 0) return;
      const change = (category.total - prev.total) / prev.total;
      if (change > 0.25) {
        alerts.push(
          `Has gastado un ${(change * 100).toFixed(0)} % más en ${category.category} que el mes pasado.`,
        );
      }
    });
  }

  return alerts;
}

function buildRecommendations(
  current: MonthSummary | undefined,
  categories: CategorySummary[],
  goal: number,
): string[] {
  if (!current) {
    return [
      "Sube tu histórico financiero para empezar a ver recomendaciones personalizadas.",
    ];
  }

  const recs: string[] = [];
  const savingsGap = goal - current.savings;

  if (savingsGap > 0) {
    const topExpense = categories.find((cat) => cat.type === "expense");
    if (topExpense) {
      recs.push(
        `Prueba a recortar un 10 % en ${topExpense.category}. Eso te acercaría ${(
          topExpense.total * 0.1
        ).toFixed(0)} € a tu objetivo. 💡`,
      );
    }
  } else {
    recs.push("Reserva parte del ahorro extra en un fondo para imprevistos.");
  }

  const leisure = categories.find((cat) => cat.category === "ocio");
  if (leisure) {
    recs.push(
      "Planifica una actividad de ocio low-cost esta semana para disfrutar sin descontrolar el presupuesto.",
    );
  }

  recs.push("Revisa tus suscripciones activas y cancela las que no uses.");

  return recs.slice(0, 3);
}

function mergeWithFallback(
  primary: string[] | null | undefined,
  fallback: string[],
  limit = 3,
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const append = (items: string[] | null | undefined) => {
    if (!items) return;
    items.forEach((item) => {
      const trimmed = item.trim();
      if (!trimmed || seen.has(trimmed)) return;
      seen.add(trimmed);
      result.push(trimmed);
    });
  };

  append(primary);

  if (result.length < limit) {
    append(fallback);
  }

  return result.slice(0, limit);
}

function buildInsightFacts(
  current: MonthSummary,
  previous: MonthSummary | undefined,
  categories: CategorySummary[],
  previousCategories: CategorySummary[],
  baselineAlerts: string[],
  baselineRecommendations: string[],
  goal: number,
): InsightFacts {
  const absoluteExpenses = Math.abs(current.expenses);
  const absolutePreviousExpenses = previous
    ? Math.abs(previous.expenses)
    : undefined;

  const incomeChangePercent =
    previous && previous.income !== 0
      ? (current.income - previous.income) / Math.abs(previous.income)
      : undefined;

  const expenseChangePercent =
    previous && absolutePreviousExpenses
      ? (absoluteExpenses - absolutePreviousExpenses) / absolutePreviousExpenses
      : undefined;

  const balanceChangePercent =
    previous && previous.balance !== 0
      ? (current.balance - previous.balance) / Math.abs(previous.balance)
      : undefined;

  const previousCategoryMap = new Map(
    previousCategories.map((item) => [item.category, item]),
  );

  const categoryInsights = categories.map((category) => {
    const previousCategory = previousCategoryMap.get(category.category);
    const changePercent =
      previousCategory && previousCategory.total !== 0
        ? (category.total - previousCategory.total) / previousCategory.total
        : undefined;

    return {
      category: category.category,
      type: category.type,
      total: Number(category.total.toFixed(2)),
      percentage: Number(category.percentage.toFixed(2)),
      changePercent:
        changePercent !== undefined
          ? Number(changePercent.toFixed(4))
          : undefined,
    };
  });

  const notableFacts: string[] = [];
  const gapToGoal = goal - current.savings;

  if (goal > 0) {
    if (gapToGoal > 0) {
      notableFacts.push(
        `Faltan ${gapToGoal.toFixed(0)} € para el objetivo de ahorro.`,
      );
    } else {
      notableFacts.push(
        `Superamos el objetivo de ahorro en ${Math.abs(gapToGoal).toFixed(
          0,
        )} €.`,
      );
    }
  }

  if (expenseChangePercent !== undefined) {
    notableFacts.push(
      `${expenseChangePercent >= 0 ? "Aumentaron" : "Reducimos"} los gastos un ${Math.abs(
        expenseChangePercent * 100,
      ).toFixed(1)} % frente al mes anterior.`,
    );
  }

  const topExpense = categoryInsights.find((item) => item.type === "expense");
  if (topExpense) {
    notableFacts.push(
      `Categoría con mayor peso: ${topExpense.category} (${topExpense.total.toFixed(
        0,
      )} €).`,
    );
  }

  const biggestJump = categoryInsights
    .filter(
      (item) =>
        item.type === "expense" &&
        item.changePercent !== undefined &&
        item.changePercent > 0,
    )
    .sort(
      (a, b) =>
        (b.changePercent ?? 0) - (a.changePercent ?? 0),
    )[0];

  if (biggestJump && biggestJump.changePercent) {
    notableFacts.push(
      `Mayor incremento: ${biggestJump.category} (+${(
        biggestJump.changePercent * 100
      ).toFixed(0)} % vs mes anterior).`,
    );
  }

  return {
    monthLabel: current.label,
    goal,
    savings: Number(current.savings.toFixed(2)),
    gapToGoal: Number((goal - current.savings).toFixed(2)),
    savingsProgress: goal !== 0 ? Number((current.savings / goal).toFixed(4)) : null,
    income: Number(current.income.toFixed(2)),
    expenses: Number(absoluteExpenses.toFixed(2)),
    balance: Number(current.balance.toFixed(2)),
    averageDailySpend: Number(current.averageDailySpend.toFixed(2)),
    daysTracked: current.daysTracked,
    deltas: {
      incomeChangePercent:
        incomeChangePercent !== undefined
          ? Number(incomeChangePercent.toFixed(4))
          : undefined,
      expenseChangePercent:
        expenseChangePercent !== undefined
          ? Number(expenseChangePercent.toFixed(4))
          : undefined,
      balanceChangePercent:
        balanceChangePercent !== undefined
          ? Number(balanceChangePercent.toFixed(4))
          : undefined,
    },
    previous: previous
      ? {
          income: Number(previous.income.toFixed(2)),
          expenses: Number(Math.abs(previous.expenses).toFixed(2)),
          balance: Number(previous.balance.toFixed(2)),
          savings: Number(previous.balance.toFixed(2)),
        }
      : undefined,
    categoryInsights,
    notableFacts,
    baseline: {
      alerts: baselineAlerts,
      recommendations: baselineRecommendations,
    },
  };
}

export async function createDashboardData(
  transactions: Transaction[],
  goal = 200,
): Promise<DashboardData> {
  if (!transactions.length) {
    return {
      goal,
      history: [],
      categoryBreakdown: [],
      alerts: [],
      recommendations: [
        "Sube tu primer extracto para empezar el seguimiento y detectar oportunidades de ahorro.",
      ],
      categoryBreakdownByMonth: {},
      alertsByMonth: {},
      recommendationsByMonth: {},
      transactionsByMonth: {},
      categoryOptions: PRESET_CATEGORIES,
    };
  }

  const grouped = new Map<string, Transaction[]>();
  transactions.forEach((tx) => {
    const existing = grouped.get(tx.monthKey) ?? [];
    existing.push(tx);
    grouped.set(tx.monthKey, existing);
  });

  const transactionsByMonth: Record<string, Transaction[]> = {};
  grouped.forEach((list, key) => {
    transactionsByMonth[key] = [...list].sort(
      (a, b) => a.bankDate.getTime() - b.bankDate.getTime(),
    );
  });

  const categoryOptions = Array.from(
    new Set([
      ...PRESET_CATEGORIES,
      ...transactions
        .map((tx) => tx.category?.trim() ?? "")
        .filter((category) => category.length > 0),
    ]),
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  const history = Array.from(grouped.entries())
    .map(([, list]) => aggregateMonth(list))
    .sort((a, b) => (a.monthKey > b.monthKey ? 1 : -1));

  const categoryBreakdownByMonth: Record<string, CategorySummary[]> = {};
  const alertsByMonth: Record<string, string[]> = {};
  const recommendationsByMonth: Record<string, string[]> = {};

  for (let index = 0; index < history.length; index += 1) {
    const summary = history[index];
    const monthTransactions = grouped.get(summary.monthKey) ?? [];
    const previousSummary = index > 0 ? history[index - 1] : undefined;
    const previousMonthTransactions = previousSummary
      ? grouped.get(previousSummary.monthKey) ?? []
      : [];

    const categories = buildCategorySummary(monthTransactions);
    const previousCategories = buildCategorySummary(previousMonthTransactions);

    const baselineAlerts = buildAlerts(
      summary,
      previousSummary,
      categories,
      previousCategories,
      goal,
    );
    const baselineRecommendations = buildRecommendations(
      summary,
      categories,
      goal,
    );

    const facts = buildInsightFacts(
      summary,
      previousSummary,
      categories,
      previousCategories,
      baselineAlerts,
      baselineRecommendations,
      goal,
    );

    const aiMessages = await generateAIInsights(facts);

    categoryBreakdownByMonth[summary.monthKey] = categories;
    alertsByMonth[summary.monthKey] = mergeWithFallback(
      aiMessages?.alerts,
      baselineAlerts,
      4,
    );
    recommendationsByMonth[summary.monthKey] = mergeWithFallback(
      aiMessages?.recommendations,
      baselineRecommendations,
      3,
    );
  }

  const current = history.at(-1);
  const previous = history.length > 1 ? history.at(-2) : undefined;

  const currentCategories = current
    ? categoryBreakdownByMonth[current.monthKey] ?? []
    : [];

  return {
    goal,
    currentMonth: current,
    previousMonth: previous,
    history,
    categoryBreakdown: currentCategories,
    alerts: current ? alertsByMonth[current.monthKey] ?? [] : [],
    recommendations: current
      ? recommendationsByMonth[current.monthKey] ?? []
      : [],
    categoryBreakdownByMonth,
    alertsByMonth,
    recommendationsByMonth,
    transactionsByMonth,
    categoryOptions,
  };
}


