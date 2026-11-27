import crypto from "node:crypto";
import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from "../../server/auth.mjs";
import { getDb } from "../../server/db.mjs";
import { HttpError, handleRouteError, json, readJsonBody } from "../../server/http.mjs";
import { validateAuthInput } from "../../server/validation.mjs";

function sanitizeUser(row) {
  return {
    id: Number(row.id),
    full_name: row.full_name,
    phone: row.phone,
    accepted_terms: Boolean(row.accepted_terms),
    created_at: row.created_at,
  };
}

export default async (req) => {
  try {
    const db = getDb();
    const pool = db.pool;

    if (req.method === "GET") {
      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      const claims = verifySessionToken(token);
      if (!claims) {
        throw new HttpError("Sessiya yaroqsiz yoki muddati tugagan", 401);
      }

      const { rows } = await pool.query(
        `SELECT id, full_name, phone, accepted_terms, created_at FROM users WHERE id = $1`,
        [claims.id]
      );
      if (!rows[0]) {
        throw new HttpError("Foydalanuvchi topilmadi", 404);
      }
      return json({ user: sanitizeUser(rows[0]), verified: true });
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const data = validateAuthInput(body);

      if (data.mode === "login") {
        const { rows } = await pool.query(`SELECT * FROM users WHERE phone = $1`, [data.phone]);
        const user = rows[0];
        if (!user) {
          throw new HttpError("Bu telefon raqami ro'yxatdan o'tmagan", 404);
        }

        if (!verifyPassword(data.pin, user.pin_salt, user.pin_hash)) {
          throw new HttpError("Parol noto'g'ri", 401);
        }

        const safeUser = sanitizeUser(user);
        return json({ user: safeUser, token: createSessionToken(safeUser) });
      }

      const existingRes = await pool.query(`SELECT id FROM users WHERE phone = $1`, [data.phone]);
      if (existingRes.rowCount > 0) {
        throw new HttpError(
          "Bu telefon raqami bilan allaqachon hisob ochilgan. Hisobga kirish bo'limidan foydalaning",
          409
        );
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const pinHash = hashPassword(data.pin, salt);

      const { rows } = await pool.query(
        `INSERT INTO users (full_name, phone, pin_hash, pin_salt, accepted_terms)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, full_name, phone, accepted_terms, created_at`,
        [data.fullName, data.phone, pinHash, salt, true]
      );
      const safeUser = sanitizeUser(rows[0]);
      return json({ user: safeUser, token: createSessionToken(safeUser) }, 201);
    }

    return json({ error: "Metod qo'llab-quvvatlanmaydi" }, 405);
  } catch (err) {
    return handleRouteError(err);
  }
};

export const config = {
  path: "/api/auth",
};
