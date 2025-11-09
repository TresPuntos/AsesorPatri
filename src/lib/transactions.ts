import { sql } from "./db";
import type { Transaction } from "./types";

export async function upsertTransactions(transactions: Transaction[]) {
  if (!transactions.length) return { inserted: 0 };

  const monthKey = transactions[0]!.monthKey;
  const userId = transactions[0]!.userId;

  await sql`
    DELETE FROM transactions
    WHERE user_id = ${userId} AND month_key = ${monthKey};
  `;

  for (const tx of transactions) {
    const bankDate = tx.bankDate.toISOString().slice(0, 10);
    const postedDate = tx.postedDate ? tx.postedDate.toISOString().slice(0, 10) : null;

    await sql`
      INSERT INTO transactions (
        id, user_id, bank_date, posted_date, description, raw_concept, observations,
        amount, category, subcategory, type, month_key, source
      )
      VALUES (
        ${tx.id}, ${tx.userId}, ${bankDate}, ${postedDate}, ${tx.description}, ${tx.rawConcept},
        ${tx.observations}, ${tx.amount}, ${tx.category}, ${tx.subcategory}, ${tx.type},
        ${tx.monthKey}, ${tx.source}
      );
    `;
  }

  return { inserted: transactions.length };
}

interface TransactionRow {
  id: string;
  userId: string;
  bankDate: string;
  postedDate: string | null;
  description: string | null;
  rawConcept: string | null;
  observations: string | null;
  amount: number;
  category: string | null;
  subcategory: string | null;
  type: string;
  monthKey: string;
  source: string | null;
  createdAt: string | null;
}

export async function getTransactions(userId: string) {
  const result = await sql<TransactionRow>`
    SELECT
      id,
      user_id as "userId",
      bank_date::text as "bankDate",
      posted_date::text as "postedDate",
      description,
      raw_concept as "rawConcept",
      observations,
      amount::float as "amount",
      category,
      subcategory,
      type,
      month_key as "monthKey",
      source,
      created_at::text as "createdAt"
    FROM transactions
    WHERE user_id = ${userId}
    ORDER BY bank_date ASC;
  `;

  return result.rows.map((row) => ({
    ...row,
    bankDate: new Date(row.bankDate),
    postedDate: row.postedDate ? new Date(row.postedDate) : null,
    createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
  }));
}


