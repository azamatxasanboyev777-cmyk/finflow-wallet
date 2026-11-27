import { resolveRequestUserId } from "../../server/auth.mjs";
import { formatTransaction, getDb } from "../../server/db.mjs";
import { HttpError, handleRouteError, json, readJsonBody } from "../../server/http.mjs";
import { validateTransferInput } from "../../server/validation.mjs";

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Faqat POST metodi ruxsat etilgan" }, 405);
  }

  try {
    const userId = resolveRequestUserId(req);
    const body = await readJsonBody(req);
    const data = validateTransferInput(body);
    const db = getDb();
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");
      const orderedIds = [data.fromAccountId, data.toAccountId].sort((a, b) => a - b);
      const accRes = await client.query(
        `SELECT id, name, balance FROM accounts WHERE id = ANY($1::int[]) AND user_id = $2 ORDER BY id ASC FOR UPDATE`,
        [orderedIds, userId]
      );
      const accountsById = new Map(accRes.rows.map((r) => [Number(r.id), r]));

      const fromAcc = accountsById.get(data.fromAccountId);
      const toAcc = accountsById.get(data.toAccountId);
      if (!fromAcc || !toAcc) {
        throw new HttpError("Manba yoki maqsad hamyon topilmadi", 404);
      }

      const fromBalance = Number(fromAcc.balance);
      if (fromBalance < data.amount) {
        throw new HttpError(
          `Manba hamyonda mablag' yetarli emas. Mavjud balans: ${fromBalance.toLocaleString("uz-UZ")} so'm`,
          409
        );
      }

      const nextFromBalance = Math.round((fromBalance - data.amount) * 100) / 100;
      const nextToBalance = Math.round((Number(toAcc.balance) + data.amount) * 100) / 100;

      await client.query(`UPDATE accounts SET balance = $1 WHERE id = $2`, [
        nextFromBalance,
        data.fromAccountId,
      ]);
      await client.query(`UPDATE accounts SET balance = $1 WHERE id = $2`, [
        nextToBalance,
        data.toAccountId,
      ]);

      const outRes = await client.query(
        `INSERT INTO transactions (account_id, type, category, amount, description, occurred_at)
         VALUES ($1, 'expense', 'O''tkazma', $2, $3, $4)
         RETURNING *`,
        [data.fromAccountId, data.amount, `${toAcc.name} ga: ${data.description}`, data.occurredAt]
      );

      const inRes = await client.query(
        `INSERT INTO transactions (account_id, type, category, amount, description, occurred_at)
         VALUES ($1, 'income', 'O''tkazma', $2, $3, $4)
         RETURNING *`,
        [data.toAccountId, data.amount, `${fromAcc.name} dan: ${data.description}`, data.occurredAt]
      );

      await client.query("COMMIT");
      return json(
        {
          transfer: {
            from_account_id: data.fromAccountId,
            to_account_id: data.toAccountId,
            amount: data.amount,
            from_balance: nextFromBalance,
            to_balance: nextToBalance,
            outgoing: formatTransaction({ ...outRes.rows[0], account_name: fromAcc.name }),
            incoming: formatTransaction({ ...inRes.rows[0], account_name: toAcc.name }),
          },
        },
        201
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    return handleRouteError(err);
  }
};

export const config = {
  path: "/api/transfers",
};
