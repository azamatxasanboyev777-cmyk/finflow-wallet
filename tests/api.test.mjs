import assert from "node:assert/strict";
import test from "node:test";
import { HttpError, parsePositiveInt } from "../server/http.mjs";
import {
  normalizeUzPhone,
  validateAccountCreate,
  validateAccountUpdate,
  validateAuthInput,
  validateTransactionCreate,
  validateTransferInput,
} from "../server/validation.mjs";

test("parsePositiveInt rejects invalid IDs", () => {
  assert.equal(parsePositiveInt("12"), 12);
  assert.throws(() => parsePositiveInt("0"), HttpError);
  assert.throws(() => parsePositiveInt("-5"), HttpError);
  assert.throws(() => parsePositiveInt("abc"), HttpError);
});

test("normalizeUzPhone formats 9-digit and +998 numbers and rejects invalid ones", () => {
  assert.equal(normalizeUzPhone("90 123 45 67"), "+998901234567");
  assert.equal(normalizeUzPhone("+998 (91) 555-44-33"), "+998915554433");
  assert.throws(() => normalizeUzPhone("12345"), HttpError);
});

test("validateAuthInput validates full name, phone, PIN, and security consent", () => {
  const reg = validateAuthInput({
    mode: "register",
    full_name: "Azamat Hasanboyev",
    phone: "+998 90 123 45 67",
    pin: "1234",
    accepted_terms: true,
  });
  assert.equal(reg.phone, "+998901234567");
  assert.equal(reg.fullName, "Azamat Hasanboyev");

  assert.throws(
    () =>
      validateAuthInput({
        mode: "register",
        full_name: "Az",
        phone: "+998901234567",
        pin: "1234",
        accepted_terms: true,
      }),
    HttpError
  );
  assert.throws(
    () =>
      validateAuthInput({
        mode: "register",
        full_name: "Azamat",
        phone: "+998901234567",
        pin: "12",
        accepted_terms: true,
      }),
    HttpError
  );
  assert.throws(
    () =>
      validateAuthInput({
        mode: "register",
        full_name: "Azamat",
        phone: "+998901234567",
        pin: "1234",
        accepted_terms: false,
      }),
    HttpError
  );
});

test("validateAccountCreate enforces valid name, type, and non-negative balance", () => {
  const acc = validateAccountCreate({
    name: "Humo Karta",
    type: "card",
    balance: 250000,
    monthly_limit: 1000000,
  });
  assert.equal(acc.name, "Humo Karta");
  assert.equal(acc.balance, 250000);

  assert.throws(
    () => validateAccountCreate({ name: "A", type: "card", balance: 100 }),
    HttpError
  );
  assert.throws(
    () => validateAccountCreate({ name: "Karta", type: "crypto", balance: 100 }),
    HttpError
  );
  assert.throws(
    () => validateAccountCreate({ name: "Karta", type: "card", balance: -50 }),
    HttpError
  );
});

test("validateAccountUpdate requires at least one valid field", () => {
  assert.throws(() => validateAccountUpdate({}), HttpError);
  const res = validateAccountUpdate({ monthly_limit: 500000 });
  assert.equal(res.monthlyLimit, 500000);
});

test("validateTransactionCreate requires positive amount and valid type", () => {
  const tx = validateTransactionCreate({
    account_id: 1,
    type: "expense",
    category: "Transport",
    amount: 15000,
    occurred_at: "2026-11-27",
  });
  assert.equal(tx.amount, 15000);

  assert.throws(
    () =>
      validateTransactionCreate({
        account_id: 1,
        type: "expense",
        category: "Transport",
        amount: 0,
      }),
    HttpError
  );
  assert.throws(
    () =>
      validateTransactionCreate({
        account_id: 1,
        type: "refund",
        category: "Transport",
        amount: 1000,
      }),
    HttpError
  );
});

test("validateTransferInput forbids same-account transfers", () => {
  assert.throws(
    () =>
      validateTransferInput({
        from_account_id: 2,
        to_account_id: 2,
        amount: 50000,
      }),
    (err) => err instanceof HttpError && err.status === 400
  );

  const valid = validateTransferInput({
    from_account_id: 1,
    to_account_id: 2,
    amount: 50000,
  });
  assert.equal(valid.fromAccountId, 1);
  assert.equal(valid.toAccountId, 2);
});
