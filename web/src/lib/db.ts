import { sql } from "@vercel/postgres";

export { sql };

export async function ensureDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bank_date DATE NOT NULL,
      posted_date DATE,
      description TEXT,
      raw_concept TEXT,
      observations TEXT,
      amount NUMERIC NOT NULL,
      category TEXT,
      subcategory TEXT,
      type TEXT NOT NULL,
      month_key TEXT NOT NULL,
      source TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_month
      ON transactions (user_id, month_key);
  `;
}


