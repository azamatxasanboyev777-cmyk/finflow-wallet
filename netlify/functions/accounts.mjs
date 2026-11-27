import { resolveRequestUserId } from "../../server/auth.mjs";
import { formatAccount, getDb } from "../../server/db.mjs";
import {
  HttpError,
  handleRouteError,
  json,
  parsePositiveInt,
  readJsonBody,
} from "../../server/http.mjs";
import {
  ACCOUNT_TYPES,
  validateAccountCreate,
  validateAccountUpdate,
} from "../../server/validation.mjs";

const ACCOUNT_SELECT = `
  SELECT
    a.id,
    a.user_id,
    a.name,
    a.type,
    a.currency,
    a.balance,
    a.monthly_limit,
    a.color,
    a.created_at,
    COALESCE(COUNT(t.id), 0) AS transaction_count,
    COALESCE(
      SUM(
        CASE
          WHEN t.type = 'expense'
           AND t.occurred_at >= date_trunc('month', CURRENT_DATE)::date
          THEN t.amount
          ELSE 0
        END
      ),
      0
    ) AS monthly_spent
  FROM accounts a
  LEFT JOIN transactions t ON t.account_id = a.id
`;

async function fetchAccountById(pool, id, userId) {
  const { rows } = await pool.query(
    `${ACCOUNT_SELECT} WHERE a.id = $1 AND a.user_id = $2 GROUP BY a.id`,
    [id, userId]
  );
  return rows[0] ? formatAccount(rows[0]) : null;
}

export default async (req, context) => {
  try {
    const userId = resolveRequestUserId(req);
    const db = getDb();
    const pool = db.pool;
    const rawId = context.params?.id;

    if (req.method === "GET") {
      if (rawId !== undefined) {
        const id = parsePositiveInt(rawId, "Hamyon ID");
        const account = await fetchAccountById(pool, id, userId);
        if (!account) {
          throw new HttpError("Hamyon topilmadi", 404);
        }
        return json({ account });
      }

      const url = new URL(req.url);
      const search = (url.searchParams.get("search") || "").trim();
      const type = (url.searchParams.get("type") || "").trim();

      const params = [userId];
      const conditions = [`a.user_id = $1`];

      if (search) {
        params.push(`%${search}%`);
        conditions.push(`a.name ILIKE $${params.length}`);
      }
      if (type) {
        if (!ACCOUNT_TYPES.includes(type)) {
          throw new HttpError("Filtr turi faqat card, cash yoki savings bo'lishi mumkin", 400);
        }
        params.push(type);
        conditions.push(`a.type = $${params.length}`);
      }

      const { rows } = await pool.query(
        `${ACCOUNT_SELECT} WHERE ${conditions.join(" AND ")} GROUP BY a.id ORDER BY a.id ASC`,
        params
      );

      const accounts = rows.map(formatAccount);
      const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      return json({ accounts, total_balance: Math.round(totalBalance * 100) / 100 });
    }

    if (req.method === "POST") {
      if (rawId !== undefined) {
        throw new HttpError("Yangi hamyon yaratish uchun /api/accounts manziliga yuboring", 405);
      }
      const body = await readJsonBody(req);
      const data = validateAccountCreate(body);

      const { rows } = await pool.query(
        `INSERT INTO accounts (user_id, name, type, currency, balance, monthly_limit, color)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [userId, data.name, data.type, data.currency, data.balance, data.monthlyLimit, data.color]
      );
      const created = await fetchAccountById(pool, rows[0].id, userId);
      return json({ account: created }, 201);
    }

    if (req.method === "PATCH" || req.method === "PUT") {
      if (rawId === undefined) {
        throw new HttpError("Tahrirlash uchun hamyon ID ko'rsatilishi shart", 400);
      }
      const id = parsePositiveInt(rawId, "Hamyon ID");
      const body = await readJsonBody(req);
      const updates = validateAccountUpdate(body);

      const setClauses = [];
      const params = [];
      if (updates.name !== undefined) {
        params.push(updates.name);
        setClauses.push(`name = $${params.length}`);
      }
      if (updates.type !== undefined) {
        params.push(updates.type);
        setClauses.push(`type = $${params.length}`);
      }
      if (updates.monthlyLimit !== undefined) {
        params.push(updates.monthlyLimit);
        setClauses.push(`monthly_limit = $${params.length}`);
      }
      if (updates.color !== undefined) {
        params.push(updates.color);
        setClauses.push(`color = $${params.length}`);
      }

      params.push(id, userId);
      const { rowCount } = await pool.query(
        `UPDATE accounts SET ${setClauses.join(", ")} WHERE id = $${params.length - 1} AND user_id = $${params.length}`,
        params
      );
      if (rowCount === 0) {
        throw new HttpError("Hamyon topilmadi", 404);
      }
      const updated = await fetchAccountById(pool, id, userId);
      return json({ account: updated });
    }

    if (req.method === "DELETE") {
      if (rawId === undefined) {
        throw new HttpError("O'chirish uchun hamyon ID ko'rsatilishi shart", 400);
      }
      const id = parsePositiveInt(rawId, "Hamyon ID");
      const { rowCount } = await pool.query(
        `DELETE FROM accounts WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
      if (rowCount === 0) {
        throw new HttpError("Hamyon topilmadi", 404);
      }
      return json({ deleted: true, id });
    }

    return json({ error: "Metod qo'llab-quvvatlanmaydi" }, 405);
  } catch (err) {
    return handleRouteError(err);
  }
};

export const config = {
  path: ["/api/accounts", "/api/accounts/:id"],
};
