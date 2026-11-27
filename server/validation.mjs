import { HttpError, parsePositiveInt } from "./http.mjs";

export const ACCOUNT_TYPES = ["card", "cash", "savings"];
export const TRANSACTION_TYPES = ["income", "expense"];
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_DIGITS_RE = /^998\d{9}$/;

function parseNonNegativeNumber(raw, fieldLabel) {
  if (raw === undefined || raw === null || raw === "") {
    return 0;
  }
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) {
    throw new HttpError(`${fieldLabel} 0 yoki musbat son bo'lishi kerak`, 400);
  }
  return Math.round(num * 100) / 100;
}

function parsePositiveNumber(raw, fieldLabel) {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) {
    throw new HttpError(`${fieldLabel} 0 dan katta son bo'lishi kerak`, 400);
  }
  return Math.round(num * 100) / 100;
}

function normalizeDate(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return new Date().toISOString().slice(0, 10);
  }
  if (typeof raw !== "string" || !ISO_DATE_RE.test(raw.trim())) {
    throw new HttpError("Sana YYYY-MM-DD formatida bo'lishi kerak", 400);
  }
  const parsed = new Date(`${raw.trim()}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError("Sana noto'g'ri ko'rsatilgan", 400);
  }
  return raw.trim();
}

export function normalizeUzPhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const normalized = digits.length === 9 ? `998${digits}` : digits;
  if (!PHONE_DIGITS_RE.test(normalized)) {
    throw new HttpError(
      "Telefon raqami to'g'ri formatda bo'lishi kerak (masalan: +998 90 123 45 67)",
      400
    );
  }
  return `+${normalized}`;
}

export function validateAuthInput(body) {
  const mode = body.mode === "login" ? "login" : "register";
  const phone = normalizeUzPhone(body.phone);
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";

  if (pin.length < 4 || pin.length > 32) {
    throw new HttpError(
      "Xavfsizlik PIN/paroli kamida 4 ta belgidan iborat bo'lishi kerak",
      400
    );
  }

  if (mode === "login") {
    return { mode, phone, pin };
  }

  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  if (fullName.length < 3 || fullName.length > 80) {
    throw new HttpError(
      "Ism va familiya kamida 3 ta belgidan iborat bo'lishi kerak",
      400
    );
  }

  if (body.accepted_terms !== true) {
    throw new HttpError(
      "Davom etish uchun xavfsizlik va maxfiylik shartlarini tasdiqlang",
      400
    );
  }

  return { mode, fullName, phone, pin, acceptedTerms: true };
}

export function validateAccountCreate(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 60) {
    throw new HttpError("Hamyon nomi 2 dan 60 tagacha belgidan iborat bo'lishi kerak", 400);
  }

  const type = typeof body.type === "string" ? body.type.trim() : "card";
  if (!ACCOUNT_TYPES.includes(type)) {
    throw new HttpError("Hamyon turi faqat card, cash yoki savings bo'lishi mumkin", 400);
  }

  const currency =
    typeof body.currency === "string" && body.currency.trim()
      ? body.currency.trim().toUpperCase().slice(0, 6)
      : "UZS";

  const balance = parseNonNegativeNumber(body.balance, "Boshlang'ich balans");
  const monthlyLimit = parseNonNegativeNumber(body.monthly_limit, "Oylik limit");

  const color =
    typeof body.color === "string" && HEX_COLOR_RE.test(body.color.trim())
      ? body.color.trim()
      : "#10b981";

  return { name, type, currency, balance, monthlyLimit, color };
}

export function validateAccountUpdate(body) {
  const updates = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 60) {
      throw new HttpError("Hamyon nomi 2 dan 60 tagacha belgidan iborat bo'lishi kerak", 400);
    }
    updates.name = name;
  }

  if (body.type !== undefined) {
    const type = typeof body.type === "string" ? body.type.trim() : "";
    if (!ACCOUNT_TYPES.includes(type)) {
      throw new HttpError("Hamyon turi faqat card, cash yoki savings bo'lishi mumkin", 400);
    }
    updates.type = type;
  }

  if (body.monthly_limit !== undefined) {
    updates.monthlyLimit = parseNonNegativeNumber(body.monthly_limit, "Oylik limit");
  }

  if (body.color !== undefined) {
    if (typeof body.color !== "string" || !HEX_COLOR_RE.test(body.color.trim())) {
      throw new HttpError("Rang #RRGGBB formatida bo'lishi kerak", 400);
    }
    updates.color = body.color.trim();
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpError("Yangilash uchun kamida bitta maydon yuboring", 400);
  }

  return updates;
}

export function validateTransactionCreate(body) {
  const accountId = parsePositiveInt(body.account_id, "Hamyon (account_id)");

  const type = typeof body.type === "string" ? body.type.trim() : "";
  if (!TRANSACTION_TYPES.includes(type)) {
    throw new HttpError("Tranzaksiya turi faqat income yoki expense bo'lishi kerak", 400);
  }

  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (category.length < 2 || category.length > 40) {
    throw new HttpError("Kategoriya 2 dan 40 tagacha belgidan iborat bo'lishi kerak", 400);
  }

  const amount = parsePositiveNumber(body.amount, "Summa");
  const description =
    typeof body.description === "string" ? body.description.trim().slice(0, 200) : "";
  const occurredAt = normalizeDate(body.occurred_at);

  return { accountId, type, category, amount, description, occurredAt };
}

export function validateTransactionUpdate(body, existing) {
  const accountId =
    body.account_id !== undefined
      ? parsePositiveInt(body.account_id, "Hamyon (account_id)")
      : existing.account_id;

  const type =
    body.type !== undefined
      ? typeof body.type === "string"
        ? body.type.trim()
        : ""
      : existing.type;
  if (!TRANSACTION_TYPES.includes(type)) {
    throw new HttpError("Tranzaksiya turi faqat income yoki expense bo'lishi kerak", 400);
  }

  const category =
    body.category !== undefined
      ? typeof body.category === "string"
        ? body.category.trim()
        : ""
      : existing.category;
  if (category.length < 2 || category.length > 40) {
    throw new HttpError("Kategoriya 2 dan 40 tagacha belgidan iborat bo'lishi kerak", 400);
  }

  const amount =
    body.amount !== undefined
      ? parsePositiveNumber(body.amount, "Summa")
      : Number(existing.amount);

  const description =
    body.description !== undefined
      ? typeof body.description === "string"
        ? body.description.trim().slice(0, 200)
        : ""
      : existing.description;

  const occurredAt =
    body.occurred_at !== undefined
      ? normalizeDate(body.occurred_at)
      : String(existing.occurred_at).slice(0, 10);

  return { accountId, type, category, amount, description, occurredAt };
}

export function validateTransferInput(body) {
  const fromAccountId = parsePositiveInt(body.from_account_id, "Manba hamyon");
  const toAccountId = parsePositiveInt(body.to_account_id, "Maqsad hamyon");

  if (fromAccountId === toAccountId) {
    throw new HttpError("Manba va maqsad hamyon bir xil bo'lishi mumkin emas", 400);
  }

  const amount = parsePositiveNumber(body.amount, "O'tkazma summasi");
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim().slice(0, 200)
      : "Hamyonlararo o'tkazma";
  const occurredAt = normalizeDate(body.occurred_at);

  return { fromAccountId, toAccountId, amount, description, occurredAt };
}
