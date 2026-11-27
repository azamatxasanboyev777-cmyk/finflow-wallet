import { getDb } from "../../server/db.mjs";
import { handleRouteError, json } from "../../server/http.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return json({ error: "Faqat GET metodi ruxsat etilgan" }, 405);
  }
  try {
    const db = getDb();
    await db.sql`SELECT 1 AS ok`;
    return json({ ok: true, service: "FinFlow API", database: "connected" });
  } catch (err) {
    return handleRouteError(err);
  }
};

export const config = {
  path: "/api/health",
};
