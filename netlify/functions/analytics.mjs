import { resolveRequestUserId } from "../../server/auth.mjs";
import { getDb } from "../../server/db.mjs";
import { handleRouteError, json } from "../../server/http.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return json({ error: "Faqat GET metodi ruxsat etilgan" }, 405);
  }

  try {
    const userId = resolveRequestUserId(req);
    const db = getDb();
    const pool = db.pool;

    const [totalsRes, categoriesRes, dailyRes] = await Promise.all([
      pool.query(
        `
        SELECT
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
          COALESCE(
            SUM(CASE WHEN t.type = 'income' AND t.occurred_at >= date_trunc('month', CURRENT_DATE)::date THEN t.amount ELSE 0 END),
            0
          ) AS month_income,
          COALESCE(
            SUM(CASE WHEN t.type = 'expense' AND t.occurred_at >= date_trunc('month', CURRENT_DATE)::date THEN t.amount ELSE 0 END),
            0
          ) AS month_expense
        FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        WHERE a.user_id = $1
      `,
        [userId]
      ),
      pool.query(
        `
        SELECT
          t.category,
          t.type,
          COUNT(*)::int AS count,
          COALESCE(SUM(t.amount), 0) AS total
        FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        WHERE a.user_id = $1
        GROUP BY t.category, t.type
        ORDER BY total DESC
      `,
        [userId]
      ),
      pool.query(
        `
        SELECT
          t.occurred_at::text AS date,
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense
        FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        WHERE a.user_id = $1
          AND t.occurred_at >= CURRENT_DATE - INTERVAL '14 days'
        GROUP BY t.occurred_at
        ORDER BY t.occurred_at ASC
      `,
        [userId]
      ),
    ]);

    const t = totalsRes.rows[0];
    return json({
      totals: {
        total_income: Number(t.total_income),
        total_expense: Number(t.total_expense),
        month_income: Number(t.month_income),
        month_expense: Number(t.month_expense),
      },
      by_category: categoriesRes.rows.map((r) => ({
        category: r.category,
        type: r.type,
        count: Number(r.count),
        total: Number(r.total),
      })),
      daily_flow: dailyRes.rows.map((r) => ({
        date: String(r.date).slice(0, 10),
        income: Number(r.income),
        expense: Number(r.expense),
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
};

export const config = {
  path: "/api/analytics",
};
