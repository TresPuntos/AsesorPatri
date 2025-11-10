import { randomUUID } from "node:crypto";
import { sql } from "./db";
import type {
  CategoryRule,
  Transaction,
  TransactionType,
} from "./types";

interface RuleMatchInput {
  description: string;
  rawConcept: string;
  observations: string;
}

export const UNCATEGORIZED_LABEL = "Pendiente de categorizar";

export async function getCategoryRules(userId: string): Promise<CategoryRule[]> {
  const result = await sql<CategoryRule>`
    SELECT
      id,
      user_id as "userId",
      pattern,
      match_description as "matchDescription",
      match_observations as "matchObservations",
      category,
      subcategory,
      type,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM category_rules
    WHERE user_id = ${userId}
    ORDER BY created_at DESC;
  `;

  return result.rows.map((row) => ({
    ...row,
    createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
  }));
}

export function applyCategoryRules(
  transactions: Transaction[],
  rules: CategoryRule[],
) {
  if (!rules.length || !transactions.length) {
    return;
  }

  const normalizedRules = rules.map((rule) => ({
    ...rule,
    pattern: rule.pattern.trim().toLowerCase(),
  }));

  transactions.forEach((transaction) => {
    const haystack: RuleMatchInput = {
      description: (transaction.description ?? "").toLowerCase(),
      rawConcept: (transaction.rawConcept ?? "").toLowerCase(),
      observations: (transaction.observations ?? "").toLowerCase(),
    };

    for (const rule of normalizedRules) {
      if (!rule.pattern) continue;

      const matchesDescription =
        rule.matchDescription &&
        (haystack.description.includes(rule.pattern) ||
          haystack.rawConcept.includes(rule.pattern));

      const matchesObservations =
        rule.matchObservations &&
        haystack.observations.includes(rule.pattern);

      if (matchesDescription || matchesObservations) {
        transaction.category = rule.category;
        transaction.subcategory = rule.subcategory ?? transaction.subcategory;
        if (rule.type) {
          transaction.type = rule.type;
        }
        transaction.pendingCategory = false;
        transaction.categorizationSource = "rule";
        transaction.aiConfidence = null;
        transaction.aiReason = null;
        break;
      }
    }
  });
}

interface CreateRuleInput {
  userId: string;
  pattern: string;
  category: string;
  subcategory?: string | null;
  type?: TransactionType | null;
  matchDescription?: boolean;
  matchObservations?: boolean;
}

export async function upsertCategoryRule({
  userId,
  pattern,
  category,
  subcategory,
  type,
  matchDescription = true,
  matchObservations = true,
}: CreateRuleInput): Promise<CategoryRule> {
  const trimmedPattern = pattern.trim();
  if (!trimmedPattern) {
    throw new Error("El patrón para la regla no puede estar vacío.");
  }

  const id = randomUUID();

  const result = await sql<CategoryRule>`
    INSERT INTO category_rules (
      id,
      user_id,
      pattern,
      match_description,
      match_observations,
      category,
      subcategory,
      type,
      created_at,
      updated_at
    )
    VALUES (
      ${id},
      ${userId},
      ${trimmedPattern.toLowerCase()},
      ${matchDescription},
      ${matchObservations},
      ${category},
      ${subcategory ?? null},
      ${type ?? null},
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, pattern)
    DO UPDATE SET
      match_description = EXCLUDED.match_description,
      match_observations = EXCLUDED.match_observations,
      category = EXCLUDED.category,
      subcategory = EXCLUDED.subcategory,
      type = EXCLUDED.type,
      updated_at = NOW()
    RETURNING
      id,
      user_id as "userId",
      pattern,
      match_description as "matchDescription",
      match_observations as "matchObservations",
      category,
      subcategory,
      type,
      created_at as "createdAt",
      updated_at as "updatedAt";
  `;

  const [rule] = result.rows;
  return {
    ...rule,
    createdAt: rule.createdAt ? new Date(rule.createdAt) : undefined,
    updatedAt: rule.updatedAt ? new Date(rule.updatedAt) : undefined,
  };
}

export async function applyRuleToHistory({
  userId,
  pattern,
  category,
  subcategory,
  type,
  matchDescription = true,
  matchObservations = true,
}: CreateRuleInput) {
  const likePattern = `%${pattern.trim().toLowerCase()}%`;

  await sql`
    UPDATE transactions
    SET
      category = ${category},
      subcategory = ${subcategory ?? null},
      type = ${type ?? null},
      pending_category = FALSE,
      categorization_source = 'rule',
      ai_confidence = NULL,
      ai_reason = NULL
    WHERE user_id = ${userId}
      AND (
        (
          ${matchDescription}
          AND (
            LOWER(COALESCE(description, '')) LIKE ${likePattern}
            OR LOWER(COALESCE(raw_concept, '')) LIKE ${likePattern}
          )
        )
        OR
        (
          ${matchObservations}
          AND LOWER(COALESCE(observations, '')) LIKE ${likePattern}
        )
      );
  `;
}


