export type TransactionType = "income" | "expense";

export type CategorizationSource = "file" | "rule" | "ai" | "heuristic" | "manual";

export interface Transaction {
  id: string;
  userId: string;
  bankDate: Date;
  postedDate: Date | null;
  description: string;
  rawConcept: string;
  observations: string | null;
  amount: number;
  category: string;
  subcategory: string | null;
  type: TransactionType;
  monthKey: string;
  source: string | null;
  pendingCategory: boolean;
  categorizationSource: CategorizationSource;
  aiConfidence?: number | null;
  aiReason?: string | null;
  createdAt?: Date;
}

export interface CategoryRule {
  id: string;
  userId: string;
  pattern: string;
  matchDescription: boolean;
  matchObservations: boolean;
  category: string;
  subcategory: string | null;
  type: TransactionType | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  trend?: number;
  type: TransactionType;
}

export interface MonthSummary {
  monthKey: string;
  label: string;
  month: number;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  savings: number;
  averageDailySpend: number;
  daysTracked: number;
}

export interface DashboardData {
  goal: number;
  currentMonth?: MonthSummary;
  previousMonth?: MonthSummary;
  history: MonthSummary[];
  categoryBreakdown: CategorySummary[];
  alerts: string[];
  recommendations: string[];
  categoryBreakdownByMonth: Record<string, CategorySummary[]>;
  alertsByMonth: Record<string, string[]>;
  recommendationsByMonth: Record<string, string[]>;
  transactionsByMonth: Record<string, Transaction[]>;
  categoryOptions: string[];
}


