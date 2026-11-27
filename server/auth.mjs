import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { HttpError } from "./http.mjs";

let cachedEnvSecret = null;

function readAuthSecretFromDotEnv() {
  if (cachedEnvSecret) return cachedEnvSecret;
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return null;
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (key === "AUTH_SECRET") {
        const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
        if (val) {
          cachedEnvSecret = val;
          return val;
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function getAuthSecret() {
  const secret =
    (typeof Netlify !== "undefined" ? Netlify.env.get("AUTH_SECRET") : undefined) ||
    process.env.AUTH_SECRET ||
    readAuthSecretFromDotEnv();
  if (!secret) {
    throw new HttpError("AUTH_SECRET muhit o'zgaruvchisi sozlanmagan", 500);
  }
  return secret;
}

export function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function verifyPassword(password, salt, expectedHash) {
  const candidate = hashPassword(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(candidate, "hex"),
    Buffer.from(expectedHash, "hex")
  );
}

export function createSessionToken(user) {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      phone: user.phone,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expectedSig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed?.id || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function resolveRequestUserId(req) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return 1;
  }
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const claims = verifySessionToken(token);
  if (!claims) {
    throw new HttpError("Sessiya yaroqsiz yoki muddati tugagan. Qayta kiring", 401);
  }
  return Number(claims.id);
}
