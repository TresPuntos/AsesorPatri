import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type {
  CategorySummary,
  DashboardData,
  MonthSummary,
  Transaction,
} from "./types";

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

export function createDashboardData(
  transactions: Transaction[],
  goal = 200,
): DashboardData {
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

  history.forEach((summary, index) => {
    const monthTransactions = grouped.get(summary.monthKey) ?? [];
    const previousSummary = index > 0 ? history[index - 1] : undefined;
    const previousMonthTransactions = previousSummary
      ? grouped.get(previousSummary.monthKey) ?? []
      : [];

    const categories = buildCategorySummary(monthTransactions);
    const previousCategories = buildCategorySummary(previousMonthTransactions);

    categoryBreakdownByMonth[summary.monthKey] = categories;
    alertsByMonth[summary.monthKey] = buildAlerts(
      summary,
      previousSummary,
      categories,
      previousCategories,
      goal,
    );
    recommendationsByMonth[summary.monthKey] = buildRecommendations(
      summary,
      categories,
      goal,
    );
  });

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


