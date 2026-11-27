import { getDatabase } from "@netlify/database";

export function getDb() {
  return getDatabase();
}

export function formatAccount(row) {
  const balance = Number(row.balance ?? 0);
  const monthlyLimit = Number(row.monthly_limit ?? 0);
  const monthlySpent = Number(row.monthly_spent ?? 0);
  const limitUsagePct =
    monthlyLimit > 0 ? Math.round((monthlySpent / monthlyLimit) * 1000) / 10 : 0;

  return {
    id: Number(row.id),
    name: row.name,
    type: row.type,
    currency: row.currency,
    balance,
    monthly_limit: monthlyLimit,
    monthly_spent: monthlySpent,
    limit_usage_pct: limitUsagePct,
    limit_exceeded: monthlyLimit > 0 && monthlySpent > monthlyLimit,
    transaction_count: Number(row.transaction_count ?? 0),
    color: row.color,
    created_at: row.created_at,
  };
}

export function formatTransaction(row) {
  return {
    id: Number(row.id),
    account_id: Number(row.account_id),
    account_name: row.account_name ?? undefined,
    account_type: row.account_type ?? undefined,
    type: row.type,
    category: row.category,
    amount: Number(row.amount),
    description: row.description ?? "",
    occurred_at: String(row.occurred_at).slice(0, 10),
    created_at: row.created_at,
  };
}
