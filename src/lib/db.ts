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
      pending_category BOOLEAN DEFAULT FALSE,
      categorization_source TEXT DEFAULT 'heuristic',
      ai_confidence NUMERIC,
      ai_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_month
      ON transactions (user_id, month_key);
  `;

  await sql`
    ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS pending_category BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS categorization_source TEXT DEFAULT 'heuristic',
      ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC,
      ADD COLUMN IF NOT EXISTS ai_reason TEXT;
  `;

  await sql`
    UPDATE transactions
    SET
      pending_category = COALESCE(pending_category, FALSE),
      categorization_source = COALESCE(categorization_source, 'heuristic')
    WHERE pending_category IS NULL
      OR categorization_source IS NULL;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS category_rules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pattern TEXT NOT NULL,
      match_description BOOLEAN DEFAULT TRUE,
      match_observations BOOLEAN DEFAULT TRUE,
      category TEXT NOT NULL,
      subcategory TEXT,
      type TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_category_rules_user_pattern
      ON category_rules (user_id, pattern);
  `;
}


