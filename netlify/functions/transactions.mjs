import { resolveRequestUserId } from "../../server/auth.mjs";
import { formatTransaction, getDb } from "../../server/db.mjs";
import {
  HttpError,
  handleRouteError,
  json,
  parsePositiveInt,
  readJsonBody,
} from "../../server/http.mjs";
import {
  TRANSACTION_TYPES,
  validateTransactionCreate,
  validateTransactionUpdate,
} from "../../server/validation.mjs";

const TX_SELECT = `
  SELECT
    t.id,
    t.account_id,
    a.name AS account_name,
    a.type AS account_type,
    t.type,
    t.category,
    t.amount,
    t.description,
    t.occurred_at,
    t.created_at
  FROM transactions t
  JOIN accounts a ON a.id = t.account_id
`;

function signedDelta(type, amount) {
  return type === "income" ? Number(amount) : -Number(amount);
}

function roundMoney(val) {
  return Math.round(val * 100) / 100;
}

async function fetchTransactionById(queryable, id, userId) {
  const { rows } = await queryable.query(
    `${TX_SELECT} WHERE t.id = $1 AND a.user_id = $2`,
    [id, userId]
  );
  return rows[0] ? formatTransaction(rows[0]) : null;
}

export default async (req, context) => {
  try {
    const userId = resolveRequestUserId(req);
    const db = getDb();
    const pool = db.pool;
    const rawId = context.params?.id;

    if (req.method === "GET") {
      if (rawId !== undefined) {
        const id = parsePositiveInt(rawId, "Tranzaksiya ID");
        const tx = await fetchTransactionById(pool, id, userId);
        if (!tx) {
          throw new HttpError("Tranzaksiya topilmadi", 404);
        }
        return json({ transaction: tx });
      }

      const url = new URL(req.url);
      const search = (url.searchParams.get("search") || "").trim();
      const type = (url.searchParams.get("type") || "").trim();
      const category = (url.searchParams.get("category") || "").trim();
      const accountIdParam = (url.searchParams.get("accountId") || "").trim();
      const from = (url.searchParams.get("from") || "").trim();
      const to = (url.searchParams.get("to") || "").trim();

      const params = [userId];
      const conditions = [`a.user_id = $1`];

      if (search) {
        params.push(`%${search}%`);
        conditions.push(
          `(t.category ILIKE $${params.length} OR t.description ILIKE $${params.length} OR a.name ILIKE $${params.length})`
        );
      }
      if (type) {
        if (!TRANSACTION_TYPES.includes(type)) {
          throw new HttpError("Tur faqat income yoki expense bo'lishi mumkin", 400);
        }
        params.push(type);
        conditions.push(`t.type = $${params.length}`);
      }
      if (category) {
        params.push(category);
        conditions.push(`t.category = $${params.length}`);
      }
      if (accountIdParam) {
        const accountId = parsePositiveInt(accountIdParam, "Hamyon (accountId)");
        params.push(accountId);
        conditions.push(`t.account_id = $${params.length}`);
      }
      if (from) {
        params.push(from);
        conditions.push(`t.occurred_at >= $${params.length}::date`);
      }
      if (to) {
        params.push(to);
        conditions.push(`t.occurred_at <= $${params.length}::date`);
      }

      const { rows } = await pool.query(
        `${TX_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY t.occurred_at DESC, t.id DESC`,
        params
      );

      const transactions = rows.map(formatTransaction);
      let totalIncome = 0;
      let totalExpense = 0;
      for (const tx of transactions) {
        if (tx.type === "income") totalIncome += tx.amount;
        else totalExpense += tx.amount;
      }

      return json({
        transactions,
        summary: {
          count: transactions.length,
          total_income: roundMoney(totalIncome),
          total_expense: roundMoney(totalExpense),
          net_flow: roundMoney(totalIncome - totalExpense),
        },
      });
    }

    if (req.method === "POST") {
      if (rawId !== undefined) {
        throw new HttpError("Yangi tranzaksiya uchun /api/transactions manziliga yuboring", 405);
      }
      const body = await readJsonBody(req);
      const data = validateTransactionCreate(body);

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const accRes = await client.query(
          `SELECT id, balance FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE`,
          [data.accountId, userId]
        );
        if (accRes.rowCount === 0) {
          throw new HttpError("Tanlangan hamyon topilmadi", 404);
        }

        const currentBalance = Number(accRes.rows[0].balance);
        const nextBalance = roundMoney(currentBalance + signedDelta(data.type, data.amount));
        if (nextBalance < 0) {
          throw new HttpError(
            `Hamyon balansi yetarli emas. Mavjud balans: ${currentBalance.toLocaleString("uz-UZ")} so'm`,
            409
          );
        }

        await client.query(`UPDATE accounts SET balance = $1 WHERE id = $2`, [
          nextBalance,
          data.accountId,
        ]);

        const insertRes = await client.query(
          `INSERT INTO transactions (account_id, type, category, amount, description, occurred_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [data.accountId, data.type, data.category, data.amount, data.description, data.occurredAt]
        );

        const created = await fetchTransactionById(client, insertRes.rows[0].id, userId);
        await client.query("COMMIT");
        return json({ transaction: created, account_balance: nextBalance }, 201);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    if (req.method === "PATCH" || req.method === "PUT") {
      if (rawId === undefined) {
        throw new HttpError("Tahrirlash uchun tranzaksiya ID ko'rsatilishi shart", 400);
      }
      const id = parsePositiveInt(rawId, "Tranzaksiya ID");
      const body = await readJsonBody(req);

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const existingRes = await client.query(
          `SELECT t.* FROM transactions t
           JOIN accounts a ON a.id = t.account_id
           WHERE t.id = $1 AND a.user_id = $2
           FOR UPDATE OF t`,
          [id, userId]
        );
        if (existingRes.rowCount === 0) {
          throw new HttpError("Tranzaksiya topilmadi", 404);
        }
        const existing = existingRes.rows[0];
        const next = validateTransactionUpdate(body, existing);

        const accountIds = Array.from(new Set([Number(existing.account_id), next.accountId])).sort(
          (a, b) => a - b
        );
        const accRes = await client.query(
          `SELECT id, balance FROM accounts WHERE id = ANY($1::int[]) AND user_id = $2 ORDER BY id ASC FOR UPDATE`,
          [accountIds, userId]
        );
        const balances = new Map(accRes.rows.map((r) => [Number(r.id), Number(r.balance)]));
        if (!balances.has(next.accountId)) {
          throw new HttpError("Tanlangan hamyon topilmadi", 404);
        }

        const oldAccId = Number(existing.account_id);
        balances.set(
          oldAccId,
          roundMoney(balances.get(oldAccId) - signedDelta(existing.type, existing.amount))
        );
        balances.set(
          next.accountId,
          roundMoney(balances.get(next.accountId) + signedDelta(next.type, next.amount))
        );

        for (const bal of balances.values()) {
          if (bal < 0) {
            throw new HttpError(
              "Ushbu tahrirlash natijasida hamyon balansi manfiyga tushib qoladi",
              409
            );
          }
        }

        for (const [accId, bal] of balances.entries()) {
          await client.query(`UPDATE accounts SET balance = $1 WHERE id = $2`, [bal, accId]);
        }

        await client.query(
          `UPDATE transactions
           SET account_id = $1, type = $2, category = $3, amount = $4, description = $5, occurred_at = $6
           WHERE id = $7`,
          [next.accountId, next.type, next.category, next.amount, next.description, next.occurredAt, id]
        );

        const updated = await fetchTransactionById(client, id, userId);
        await client.query("COMMIT");
        return json({ transaction: updated });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    if (req.method === "DELETE") {
      if (rawId === undefined) {
        throw new HttpError("O'chirish uchun tranzaksiya ID ko'rsatilishi shart", 400);
      }
      const id = parsePositiveInt(rawId, "Tranzaksiya ID");

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const existingRes = await client.query(
          `SELECT t.* FROM transactions t
           JOIN accounts a ON a.id = t.account_id
           WHERE t.id = $1 AND a.user_id = $2
           FOR UPDATE OF t`,
          [id, userId]
        );
        if (existingRes.rowCount === 0) {
          throw new HttpError("Tranzaksiya topilmadi", 404);
        }
        const existing = existingRes.rows[0];

        const accRes = await client.query(
          `SELECT id, balance FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE`,
          [existing.account_id, userId]
        );
        const currentBalance = Number(accRes.rows[0].balance);
        const nextBalance = roundMoney(
          currentBalance - signedDelta(existing.type, existing.amount)
        );
        if (nextBalance < 0) {
          throw new HttpError(
            "Bu kirimni o'chirib bo'lmaydi, chunki hamyon balansi manfiyga tushib qoladi",
            409
          );
        }

        await client.query(`UPDATE accounts SET balance = $1 WHERE id = $2`, [
          nextBalance,
          existing.account_id,
        ]);
        await client.query(`DELETE FROM transactions WHERE id = $1`, [id]);

        await client.query("COMMIT");
        return json({ deleted: true, id, account_balance: nextBalance });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    return json({ error: "Metod qo'llab-quvvatlanmaydi" }, 405);
  } catch (err) {
    return handleRouteError(err);
  }
};

export const config = {
  path: ["/api/transactions", "/api/transactions/:id"],
};
