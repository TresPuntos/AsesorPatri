"use client";

import { useMemo, useState } from "react";
import type { CategorySummary, DashboardData, MonthSummary } from "@/lib/types";
import {
  DashboardHeader,
  type DashboardTask,
  type HeaderNarrativeContext,
} from "./header";
import { StatCard } from "./stat-card";
import { HistoryChart } from "./history-chart";
import { AlertsCard } from "./alerts-card";
import { RecommendationsCard } from "./recommendations-card";
import { CategoryBreakdown } from "./category-breakdown";
import { TransactionsTable } from "./transactions-table";
import { UploadWidget } from "./upload-widget";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1,
});

interface DashboardClientProps {
  data: DashboardData;
}

function getPreviousSummary(
  history: MonthSummary[],
  monthKey: string,
): MonthSummary | undefined {
  const index = history.findIndex((month) => month.monthKey === monthKey);
  if (index <= 0) return undefined;
  return history[index - 1];
}

function aggregateSummary(
  months: MonthSummary[],
  year: number,
): MonthSummary | null {
  if (!months.length) {
    return null;
  }

  const totals = months.reduce(
    (acc, month) => {
      acc.income += month.income;
      acc.expenses += month.expenses;
      acc.balance += month.balance;
      acc.savings += month.savings;
      acc.daysTracked += month.daysTracked;
      acc.expenseAccumulator += month.expenses;
      return acc;
    },
    {
      income: 0,
      expenses: 0,
      balance: 0,
      savings: 0,
      daysTracked: 0,
      expenseAccumulator: 0,
    },
  );

  const averageDailySpend =
    totals.daysTracked === 0
      ? 0
      : Math.abs(totals.expenseAccumulator) / totals.daysTracked;

  return {
    monthKey: `year-${year}`,
    label: `Año ${year}`,
    month: 0,
    year,
    income: totals.income,
    expenses: totals.expenses,
    balance: totals.balance,
    savings: totals.savings,
    averageDailySpend,
    daysTracked: totals.daysTracked,
  };
}

function aggregateCategories(
  months: MonthSummary[],
  breakdownByMonth: Record<string, CategorySummary[]>,
): CategorySummary[] {
  if (!months.length) return [];

  const aggregated = new Map<string, CategorySummary>();

  months.forEach((month) => {
    const monthlyCategories = breakdownByMonth[month.monthKey] ?? [];
    monthlyCategories.forEach((category) => {
      const key = `${category.category}|${category.type}`;
      const existing = aggregated.get(key);
      if (existing) {
        aggregated.set(key, {
          ...existing,
          total: existing.total + category.total,
        });
      } else {
        aggregated.set(key, { ...category });
      }
    });
  });

  const aggregatedList = Array.from(aggregated.values());

  const totalIncome = aggregatedList
    .filter((category) => category.type === "income")
    .reduce((sum, category) => sum + category.total, 0);

  const totalExpenses = aggregatedList
    .filter((category) => category.type === "expense")
    .reduce((sum, category) => sum + Math.abs(category.total), 0);

  return aggregatedList.map((category) => ({
    ...category,
    percentage:
      category.type === "income"
        ? totalIncome === 0
          ? 0
          : (category.total / totalIncome) * 100
        : totalExpenses === 0
          ? 0
          : (Math.abs(category.total) / totalExpenses) * 100,
  }));
}

function mergeStringCollections(
  months: MonthSummary[],
  collectionByMonth: Record<string, string[]>,
): string[] {
  if (!months.length) return [];
  const set = new Set<string>();
  months.forEach((month) => {
    const items = collectionByMonth[month.monthKey] ?? [];
    items.forEach((item) => set.add(item));
  });
  return Array.from(set);
}

function findTopCategory(
  categories: CategorySummary[],
  type: "income" | "expense",
): CategorySummary | null {
  const filtered = categories.filter((category) => category.type === type);
  if (!filtered.length) return null;
  return filtered.reduce((acc, category) => {
    const candidateValue =
      type === "expense" ? Math.abs(category.total) : category.total;
    const currentValue =
      type === "expense" ? Math.abs(acc.total) : acc.total;
    return candidateValue > currentValue ? category : acc;
  }, filtered[0]);
}

function getCategoryShare(
  category: CategorySummary | null,
  categories: CategorySummary[],
): number {
  if (!category) return 0;
  if (typeof category.percentage === "number" && Number.isFinite(category.percentage)) {
    return category.percentage;
  }
  const pool = categories
    .filter((item) => item.type === category.type)
    .reduce((sum, item) => {
      const value = item.type === "expense" ? Math.abs(item.total) : item.total;
      return sum + value;
    }, 0);
  if (pool === 0) {
    return 0;
  }
  const value = category.type === "expense" ? Math.abs(category.total) : category.total;
  return (value / pool) * 100;
}

function calculateCategoryVariation(
  category: CategorySummary | null,
  previousCategories: CategorySummary[],
): number | null {
  if (!category) return null;
  const previous = previousCategories.find(
    (item) => item.category === category.category && item.type === category.type,
  );
  if (!previous) return null;
  const currentValue =
    category.type === "expense" ? Math.abs(category.total) : category.total;
  const previousValue =
    previous.type === "expense" ? Math.abs(previous.total) : previous.total;
  if (previousValue === 0) {
    return null;
  }
  return (currentValue - previousValue) / previousValue;
}

function buildTaskPlan(input: {
  summary: MonthSummary | null;
  goal: number;
  period: "monthly" | "yearly";
  pendingTransactions: number;
  pendingAmount: number;
  topExpenseCategory: CategorySummary | null;
  topExpenseShare: number;
  topExpenseVariation: number | null;
  topIncomeCategory: CategorySummary | null;
  goalGap: number;
}): DashboardTask[] {
  const {
    summary,
    goal,
    period,
    pendingTransactions,
    pendingAmount,
    topExpenseCategory,
    topExpenseShare,
    topExpenseVariation,
    topIncomeCategory,
    goalGap,
  } = input;

  if (!summary) return [];

  const tasks: DashboardTask[] = [];
  const positiveGap = Math.max(0, goalGap);
  const periodLabel = period === "yearly" ? "este año" : "este mes";

  if (positiveGap > 0) {
    const immediateAmount = Math.min(
      positiveGap,
      Math.max(20, Math.round(positiveGap / 3 / 5) * 5),
    );
    tasks.push({
      id: "savings-top-up",
      title: `Reserva ${currency.format(immediateAmount)} esta semana`,
      description: `Mueve hoy mismo esa cantidad a tu hucha cripto para asegurar el objetivo de ${periodLabel}.`,
      success: `¡Listo! ${currency.format(immediateAmount)} ya trabajan para ti.`,
      impact: `+${currency.format(immediateAmount)}`,
    });
  } else {
    tasks.push({
      id: "allocate-surplus",
      title: "Decide qué haces con el excedente",
      description:
        "Define cuánto va a cripto, colchón o caprichos planificados para que el superávit no se diluya.",
      success: "Excedente asignado con intención. Seguimos con foco.",
      impact: "Plan listo",
    });
  }

  if (topExpenseCategory) {
    const focusAmountRaw = Math.abs(topExpenseCategory.total) * 0.12;
    const focusAmount = Math.max(15, Math.min(250, Math.round(focusAmountRaw / 5) * 5));
    const variationLabel =
      typeof topExpenseVariation === "number"
        ? topExpenseVariation > 0
          ? `subió ${percent.format(topExpenseVariation)}`
          : topExpenseVariation < 0
            ? `bajó ${percent.format(Math.abs(topExpenseVariation))}`
            : "se mantuvo estable"
        : "es relevante";
    tasks.push({
      id: `tune-${topExpenseCategory.category.toLowerCase().replace(/\s+/g, "-")}`,
      title: `Recorta ${topExpenseCategory.category}`,
      description: `${topExpenseCategory.category} concentra el ${Math.round(
        topExpenseShare,
      )}% del gasto: si lo acotas en ${currency.format(
        focusAmount,
      )}, notarás el cambio porque ${variationLabel}.`,
      success: `¡${topExpenseCategory.category} optimizado! ${currency.format(
        focusAmount,
      )} liberados.`,
      impact: `+${currency.format(focusAmount)}`,
    });
  }

  if (pendingTransactions > 0) {
    tasks.push({
      id: "categorize-pending",
      title: `Clasifica ${pendingTransactions} movimientos pendientes`,
      description: `Suman ${currency.format(
        pendingAmount,
      )}. Añadir categoría activa reglas y afinamos los avisos.`,
      success: "Movimientos etiquetados. Las alertas ya se recalcularon.",
      impact: "Visión limpia",
    });
  } else if (topIncomeCategory) {
    tasks.push({
      id: `boost-${topIncomeCategory.category.toLowerCase().replace(/\s+/g, "-")}`,
      title: `Potencia ${topIncomeCategory.category}`,
      description: `Piensa un micro plan de 15 minutos para reforzar ${topIncomeCategory.category} ${periodLabel}. Lo que funciona merece más foco.`,
      success: "Acción definida para subir tus ingresos recurrentes.",
      impact: "+Ingresos",
    });
  }

  return tasks.slice(0, 3);
}

function buildAlertsFeed(input: {
  baseAlerts: string[];
  summary: MonthSummary | null;
  comparisonSummary: MonthSummary | null;
  pendingTransactions: number;
  pendingAmount: number;
  topExpenseCategory: CategorySummary | null;
  expenseDelta: number | null;
  goalGap: number;
}): string[] {
  const {
    baseAlerts,
    summary,
    comparisonSummary,
    pendingTransactions,
    pendingAmount,
    topExpenseCategory,
    expenseDelta,
    goalGap,
  } = input;
  const alerts = [...baseAlerts];
  const comparisonLabel = comparisonSummary?.label ?? "el periodo anterior";

  if (pendingTransactions > 0) {
    alerts.unshift(
      `Tienes ${pendingTransactions} movimientos sin clasificar por ${currency.format(
        pendingAmount,
      )}. Resuélvelos para cerrar el análisis y activar reglas.`,
    );
  }

  if (summary && summary.balance < 0) {
    alerts.unshift(
      `El balance está en ${currency.format(summary.balance)}. Revisa gastos discrecionales para remontar cuanto antes.`,
    );
  } else if (goalGap > 0 && summary) {
    alerts.unshift(
      `Faltan ${currency.format(goalGap)} para llegar al objetivo de ahorro. Mantén a raya los extras esta semana.`,
    );
  }

  if (expenseDelta && expenseDelta > 0 && topExpenseCategory) {
    alerts.push(
      `${topExpenseCategory.category} subió ${percent.format(
        expenseDelta,
      )} respecto a ${comparisonLabel}. Controle esta partida específicamente.`,
    );
  }

  return Array.from(new Set(alerts));
}

function buildRecommendationFeed(input: {
  baseRecommendations: string[];
  summary: MonthSummary | null;
  comparisonSummary: MonthSummary | null;
  topExpenseCategory: CategorySummary | null;
  topExpenseVariation: number | null;
  topIncomeCategory: CategorySummary | null;
  goalGap: number;
  period: "monthly" | "yearly";
  pendingTransactions: number;
}): string[] {
  const {
    baseRecommendations,
    summary,
    comparisonSummary,
    topExpenseCategory,
    topExpenseVariation,
    topIncomeCategory,
    goalGap,
    period,
    pendingTransactions,
  } = input;

  if (!summary) {
    return baseRecommendations;
  }

  const recommendations: string[] = [];
  const comparisonLabel = comparisonSummary?.label ?? "el periodo anterior";
  const periodLabel = period === "yearly" ? "este trimestre" : "esta semana";

  if (goalGap > 0) {
    recommendations.push(
      `Divide los ${currency.format(goalGap)} que faltan en tres mini transferencias y agenda recordatorios recurrentes.`,
    );
  } else {
    recommendations.push(
      "Reparte el excedente: 60 % a objetivos, 30 % a libertad financiera y 10 % a disfrutar sin culpa.",
    );
  }

  if (topExpenseCategory) {
    const variationLabel =
      typeof topExpenseVariation === "number"
        ? topExpenseVariation > 0
          ? `(+${percent.format(topExpenseVariation)} vs ${comparisonLabel})`
          : `(−${percent.format(Math.abs(topExpenseVariation))} vs ${comparisonLabel})`
        : "";
    recommendations.push(
      `Negocia o limita ${topExpenseCategory.category} ${variationLabel}: busca una acción concreta que libere al menos ${currency.format(
        Math.max(20, Math.round(Math.abs(topExpenseCategory.total) * 0.1)),
      )}.`,
    );
  }

  if (pendingTransactions > 0) {
    recommendations.push(
      `Reserva 5 minutos ${periodLabel} para clasificar los movimientos pendientes y activar reglas automáticas.`,
    );
  } else if (topIncomeCategory) {
    recommendations.push(
      `Replica lo que impulsa tus ingresos (${topIncomeCategory.category}) con una acción pequeña antes de ${periodLabel}.`,
    );
  }

  return Array.from(new Set([...recommendations, ...baseRecommendations])).slice(0, 5);
}

function buildHistoryInsight(input: {
  summary: MonthSummary | null;
  comparisonSummary: MonthSummary | null;
  incomeDelta: number | null;
  expenseDelta: number | null;
  period: "monthly" | "yearly";
}): string | null {
  const { summary, comparisonSummary, incomeDelta, expenseDelta, period } = input;
  if (!summary) {
    return null;
  }
  const fragments: string[] = [];
  if (incomeDelta !== null) {
    fragments.push(
      `Ingresos ${incomeDelta >= 0 ? "↑" : "↓"} ${percent.format(Math.abs(incomeDelta))} vs ${comparisonSummary?.label ?? "periodo previo"}`,
    );
  }
  if (expenseDelta !== null) {
    fragments.push(
      `Gastos ${expenseDelta >= 0 ? "↑" : "↓"} ${percent.format(Math.abs(expenseDelta))}`,
    );
  }
  fragments.push(
    `Ahorro acumulado ${period === "yearly" ? "del año" : "del mes"}: ${currency.format(
      summary.savings,
    )}.`,
  );
  return fragments.join(" • ");
}

function buildCategoryInsight(input: {
  topExpenseCategory: CategorySummary | null;
  topExpenseShare: number;
  topIncomeCategory: CategorySummary | null;
  period: "mes" | "año";
}): string | null {
  const { topExpenseCategory, topExpenseShare, topIncomeCategory, period } = input;
  if (!topExpenseCategory && !topIncomeCategory) {
    return null;
  }
  const parts: string[] = [];
  if (topExpenseCategory) {
    parts.push(
      `${topExpenseCategory.category} concentra ${Math.round(
        topExpenseShare,
      )}% del gasto ${period === "año" ? "anual" : "mensual"} (${currency.format(
        Math.abs(topExpenseCategory.total),
      )}).`,
    );
  }
  if (topIncomeCategory) {
    parts.push(
      `${topIncomeCategory.category} lidera ingresos con ${currency.format(
        topIncomeCategory.total,
      )}.`,
    );
  }
  return parts.join(" ");
}

export function DashboardClient({ data }: DashboardClientProps) {
  const defaultMonthKey =
    data.currentMonth?.monthKey ?? data.history.at(-1)?.monthKey ?? "";

  const [manualMonthKey, setManualMonthKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] =
    useState<"overview" | "transactions" | "yearly">("overview");

  const selectedMonthKey = manualMonthKey ?? defaultMonthKey;

  const selectedSummary = useMemo(
    () => data.history.find((month) => month.monthKey === selectedMonthKey),
    [data.history, selectedMonthKey],
  );

  const previousSummary = useMemo(
    () =>
      selectedSummary
        ? getPreviousSummary(data.history, selectedSummary.monthKey)
        : undefined,
    [data.history, selectedSummary],
  );

  const categories = useMemo(
    () =>
    (selectedSummary &&
      data.categoryBreakdownByMonth[selectedSummary.monthKey]) ??
      [],
    [data.categoryBreakdownByMonth, selectedSummary],
  );
  const transactions = useMemo(
    () =>
    (selectedSummary &&
      data.transactionsByMonth[selectedSummary.monthKey]) ??
      [],
    [data.transactionsByMonth, selectedSummary],
  );
  const pendingTransactions = useMemo(
    () => transactions.filter((tx) => tx.pendingCategory).length,
    [transactions],
  );
  const pendingAmount = useMemo(
    () =>
      transactions.reduce((sum, tx) => {
        if (!tx.pendingCategory) return sum;
        return sum + Math.abs(tx.amount);
      }, 0),
    [transactions],
  );
  const baseAlerts =
    (selectedSummary && data.alertsByMonth[selectedSummary.monthKey]) ?? [];
  const baseRecommendations =
    (selectedSummary &&
              data.recommendationsByMonth[selectedSummary.monthKey]) ??
    [];
  const categoryOptions = data.categoryOptions;

  const currentYear =
    selectedSummary?.year ?? data.history.at(-1)?.year ?? null;

  const currentYearMonths = useMemo(() => {
    if (currentYear === null) {
      return [];
    }
    return data.history.filter((month) => month.year === currentYear);
  }, [data.history, currentYear]);

  const previousYearMonths = useMemo(() => {
    if (currentYear === null) {
      return [];
    }
    return data.history.filter((month) => month.year === currentYear - 1);
  }, [data.history, currentYear]);

  const yearlySummary = useMemo(() => {
    if (currentYear === null) {
      return null;
    }
    return aggregateSummary(currentYearMonths, currentYear);
  }, [currentYearMonths, currentYear]);

  const previousYearSummary = useMemo(() => {
    if (currentYear === null) {
      return null;
    }
    return aggregateSummary(previousYearMonths, currentYear - 1);
  }, [previousYearMonths, currentYear]);

  const yearlyCategories = useMemo(() => {
    if (!currentYearMonths.length) {
      return [];
    }
    return aggregateCategories(currentYearMonths, data.categoryBreakdownByMonth);
  }, [currentYearMonths, data.categoryBreakdownByMonth]);

  const yearlyAlerts = useMemo(() => {
    if (!currentYearMonths.length) {
      return [];
    }
    return mergeStringCollections(currentYearMonths, data.alertsByMonth);
  }, [currentYearMonths, data.alertsByMonth]);

  const yearlyRecommendations = useMemo(() => {
    if (!currentYearMonths.length) {
      return [];
    }
    return mergeStringCollections(currentYearMonths, data.recommendationsByMonth);
  }, [currentYearMonths, data.recommendationsByMonth]);

  const yearlyTransactions = useMemo(() => {
    if (!currentYearMonths.length) {
      return [];
    }
    return currentYearMonths.flatMap(
      (month) => data.transactionsByMonth[month.monthKey] ?? [],
    );
  }, [currentYearMonths, data.transactionsByMonth]);

  if (!selectedSummary) {
    return null;
  }

  const isYearlyView = activeTab === "yearly";
  const yearlyGoal =
    data.goal * (currentYearMonths.length || 12);
  const displaySummary: MonthSummary | null = isYearlyView
    ? yearlySummary
    : selectedSummary ?? null;
  const comparisonSummary: MonthSummary | null = isYearlyView
    ? previousYearSummary
    : previousSummary ?? null;
  const goalForView = isYearlyView ? yearlyGoal : data.goal;
  const goalGap = displaySummary ? goalForView - displaySummary.savings : goalForView;
  const activeCategories = isYearlyView ? yearlyCategories : categories;
  const previousCategories = isYearlyView
    ? previousYearMonths.length
      ? aggregateCategories(previousYearMonths, data.categoryBreakdownByMonth)
      : []
    : comparisonSummary
      ? data.categoryBreakdownByMonth[comparisonSummary.monthKey] ?? []
      : [];
  const topExpenseCategory = findTopCategory(activeCategories, "expense");
  const topIncomeCategory = findTopCategory(activeCategories, "income");
  const topExpenseShare = getCategoryShare(topExpenseCategory, activeCategories);
  const topIncomeShare = getCategoryShare(topIncomeCategory, activeCategories);
  const topExpenseVariation = calculateCategoryVariation(
    topExpenseCategory,
    previousCategories,
  );
  const topIncomeVariation = calculateCategoryVariation(
    topIncomeCategory,
    previousCategories,
  );

  const incomeDelta =
    displaySummary &&
    comparisonSummary &&
    comparisonSummary.income !== 0
      ? (displaySummary.income - comparisonSummary.income) /
        comparisonSummary.income
      : null;
  const expenseDelta =
    displaySummary &&
    comparisonSummary &&
    comparisonSummary.expenses !== 0
      ? (displaySummary.expenses - comparisonSummary.expenses) /
        comparisonSummary.expenses
      : null;
  const balanceDelta =
    displaySummary &&
    comparisonSummary &&
    comparisonSummary.balance !== 0
      ? (displaySummary.balance - comparisonSummary.balance) /
        comparisonSummary.balance
      : null;

  const periodComparisonLabel = isYearlyView ? "vs año anterior" : "vs mes anterior";
  const balanceLabel = isYearlyView ? "Balance del año" : "Balance del mes";
  const incomeFooter = (() => {
    const parts: string[] = [];
    if (incomeDelta !== null && comparisonSummary) {
      parts.push(
        `${incomeDelta >= 0 ? "Subiste" : "Bajaste"} ${percent.format(
          Math.abs(incomeDelta),
        )} frente a ${comparisonSummary.label}.`,
      );
    }
    if (topIncomeCategory) {
      parts.push(
        `${topIncomeCategory.category} aporta ${currency.format(
          topIncomeCategory.total,
        )} (${Math.round(topIncomeShare)} %).`,
      );
    } else {
      parts.push("Incluye nómina y otras entradas de dinero.");
    }
    return parts.join(" ");
  })();
  const expenseFooter = (() => {
    const parts: string[] = [
      isYearlyView
        ? `Promedio diario: ${currency.format(displaySummary?.averageDailySpend ?? 0)}.`
        : `Ritmo diario: ${currency.format(selectedSummary.averageDailySpend)}.`,
    ];
    if (topExpenseCategory) {
      parts.push(
        `${topExpenseCategory.category} supone ${Math.round(
          topExpenseShare,
        )}% del gasto (${currency.format(Math.abs(topExpenseCategory.total))}).`,
      );
    } else {
      parts.push("Revisa gastos variables para mantenerlos a raya.");
    }
    if (expenseDelta !== null && comparisonSummary) {
      parts.push(
        `Variación ${expenseDelta >= 0 ? "alza" : "a la baja"} de ${percent.format(
          Math.abs(expenseDelta),
        )} vs ${comparisonSummary.label}.`,
      );
    }
    return parts.join(" ");
  })();
  const balanceFooter = (() => {
    const parts: string[] = [];
    if (displaySummary) {
      if (goalGap > 0) {
        parts.push(
          `Faltan ${currency.format(goalGap)} para el objetivo ${
            isYearlyView ? "anual" : "mensual"
          }.`,
        );
      } else {
        parts.push(
          `Excedente de ${currency.format(Math.abs(goalGap))} sobre el objetivo ${
            isYearlyView ? "anual" : "mensual"
          }.`,
        );
      }
    }
    if (balanceDelta !== null && comparisonSummary) {
      parts.push(
        `Balance ${balanceDelta >= 0 ? "↑" : "↓"} ${percent.format(
          Math.abs(balanceDelta),
        )} vs ${comparisonSummary.label}.`,
      );
    }
    parts.push(
      isYearlyView
        ? `Meta anual: ${currency.format(yearlyGoal)}.`
        : `Meta mensual: ${currency.format(data.goal)}.`,
    );
    return parts.join(" ");
  })();

  const headerContext: HeaderNarrativeContext = {
    comparisonLabel: comparisonSummary?.label,
    incomeDelta,
    expenseDelta,
    balanceDelta,
    topExpenseCategory: topExpenseCategory
      ? {
          name: topExpenseCategory.category,
          amount: Math.abs(topExpenseCategory.total),
          share: topExpenseShare,
          variation: topExpenseVariation,
        }
      : undefined,
    topIncomeCategory: topIncomeCategory
      ? {
          name: topIncomeCategory.category,
          amount: topIncomeCategory.total,
          share: topIncomeShare,
          variation: topIncomeVariation,
        }
      : undefined,
    goalGap,
    pendingTransactions,
  };

  const headerTasks = buildTaskPlan({
    summary: displaySummary ?? null,
    goal: goalForView,
    period: isYearlyView ? "yearly" : "monthly",
    pendingTransactions,
    pendingAmount,
    topExpenseCategory,
    topExpenseShare,
    topExpenseVariation,
    topIncomeCategory,
    goalGap,
  });

  const activeAlerts = buildAlertsFeed({
    baseAlerts: isYearlyView ? yearlyAlerts : baseAlerts,
    summary: displaySummary ?? null,
    comparisonSummary,
    pendingTransactions,
    pendingAmount,
    topExpenseCategory,
    expenseDelta,
    goalGap: Math.max(0, goalGap),
  });

  const activeRecommendations = buildRecommendationFeed({
    baseRecommendations: isYearlyView ? yearlyRecommendations : baseRecommendations,
    summary: displaySummary ?? null,
    comparisonSummary,
    topExpenseCategory,
    topExpenseVariation,
    topIncomeCategory,
    goalGap: Math.max(0, goalGap),
    period: isYearlyView ? "yearly" : "monthly",
    pendingTransactions,
  });

  const historyInsight = buildHistoryInsight({
    summary: displaySummary ?? null,
    comparisonSummary,
    incomeDelta,
    expenseDelta,
    period: isYearlyView ? "yearly" : "monthly",
  });

  const categoryInsight = buildCategoryInsight({
    topExpenseCategory,
    topExpenseShare,
    topIncomeCategory,
    period: isYearlyView ? "año" : "mes",
  });

  const statCards = displaySummary
    ? [
        {
          label: "Ingresos",
          value: currency.format(displaySummary.income),
          delta:
            incomeDelta !== null
              ? `${incomeDelta >= 0 ? "▲" : "▼"} ${percent.format(incomeDelta)} ${periodComparisonLabel}`
              : undefined,
          tone: "positive" as const,
          footer: incomeFooter,
        },
        {
          label: "Gastos",
          value: currency.format(Math.abs(displaySummary.expenses)),
          delta:
            expenseDelta !== null
              ? `${expenseDelta >= 0 ? "▲" : "▼"} ${percent.format(expenseDelta)} ${periodComparisonLabel}`
              : undefined,
          tone: "negative" as const,
          footer: expenseFooter,
        },
        {
          label: balanceLabel,
          value: currency.format(displaySummary.balance),
          delta:
            balanceDelta !== null
              ? `${balanceDelta >= 0 ? "▲" : "▼"} ${percent.format(balanceDelta)} ${periodComparisonLabel}`
              : undefined,
          tone: displaySummary.balance >= 0 ? ("positive" as const) : ("negative" as const),
          footer: balanceFooter,
        },
      ]
    : [];

  return (
    <div className="relative flex flex-col gap-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[780px] w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),transparent_65%)] blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.16),transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.18),transparent_65%)] blur-3xl" />
      </div>

      <DashboardHeader
        summary={displaySummary ?? undefined}
        goal={goalForView}
        period={isYearlyView ? "yearly" : "monthly"}
        tasks={headerTasks}
        context={headerContext}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/30 p-5 text-white/80 shadow-xl shadow-black/25 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/60">
              Periodo en análisis
            </span>
            {comparisonSummary ? (
              <span className="text-[11px] text-white/40">
                Comparando con {comparisonSummary.label}
              </span>
            ) : null}
            </div>
            <select
              value={selectedMonthKey}
              onChange={(event) => setManualMonthKey(event.target.value)}
            className="h-9 rounded-full border border-white/15 bg-slate-950/80 px-3 text-sm text-white shadow-inner shadow-black/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            >
              {[...data.history]
                .map((month) => ({ value: month.monthKey, label: month.label }))
                .reverse()
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-xs text-white/70 shadow-inner shadow-black/30">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
            className={`rounded-full px-4 py-1.5 transition ${
                activeTab === "overview"
                ? "bg-cyan-500/25 text-white shadow-inner shadow-cyan-400/30"
                  : "hover:bg-white/10"
              }`}
            >
            Resumen general
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("yearly")}
            className={`rounded-full px-4 py-1.5 transition ${
                activeTab === "yearly"
                ? "bg-cyan-500/25 text-white shadow-inner shadow-cyan-400/30"
                  : "hover:bg-white/10"
              }`}
            >
              Total anual
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
            className={`rounded-full px-4 py-1.5 transition ${
                activeTab === "transactions"
                ? "bg-cyan-500/25 text-white shadow-inner shadow-cyan-400/30"
                  : "hover:bg-white/10"
              }`}
            >
            Ver partidas
            {pendingTransactions > 0 ? (
              <span className="ml-2 rounded-full bg-amber-500/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-black">
                {pendingTransactions}
              </span>
            ) : null}
            </button>
        </div>
      </div>

      {activeTab === "transactions" ? (
        <TransactionsTable
          transactions={transactions}
          yearTransactions={yearlyTransactions}
          categories={categoryOptions}
          monthLabel={selectedSummary.label}
          yearLabel={yearlySummary?.label ?? (currentYear ? `Año ${currentYear}` : undefined)}
        />
      ) : (
        <>
          <section className="grid gap-7 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-6">
              <HistoryChart
                data={isYearlyView ? currentYearMonths : data.history}
                mode={isYearlyView ? "yearly" : "monthly"}
                insight={historyInsight ?? undefined}
              />
              <AlertsCard alerts={activeAlerts} />
              {activeRecommendations.length ? (
                <RecommendationsCard
                  recommendations={activeRecommendations}
                />
              ) : null}
              <section
                id="actualiza-datos"
                className="rounded-3xl border border-dashed border-cyan-500/30 bg-cyan-500/10 p-6 text-cyan-50 shadow-[0_24px_80px_-40px_rgba(6,182,212,0.55)] backdrop-blur"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="max-w-lg space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/70">
                      Actualiza tus datos
                    </p>
                    <h3 className="text-2xl font-semibold text-cyan-50">
                      Sube el extracto del último mes para refrescar tus métricas al instante.
                    </h3>
                    <p className="text-sm text-cyan-100/80">
                      Arrastra un archivo .xlsx o .csv o usa el recuadro para elegirlo manualmente.
                    </p>
                  </div>
                  <div className="w-full max-w-sm shrink-0">
                    <UploadWidget
                      showTitle={false}
                      hint="Tu dashboard se actualizará en segundos con las alertas y categorías nuevas."
                    />
                  </div>
                </div>
              </section>
            </div>
            <CategoryBreakdown
              categories={activeCategories}
              period={isYearlyView ? "año" : "mes"}
              insight={categoryInsight ?? undefined}
            />
          </section>
        </>
      )}

    </div>
  );
}


