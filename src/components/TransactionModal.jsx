import { useState } from "react";
import { X } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatMoney } from "../utils/format";

export default function TransactionModal({ accounts, initialTx, onClose, onSave }) {
  const isEdit = Boolean(initialTx);
  const [accountId, setAccountId] = useState(
    String(initialTx?.account_id || accounts[0]?.id || "")
  );
  const [type, setType] = useState(initialTx?.type || "expense");
  const [category, setCategory] = useState(
    initialTx?.category || (initialTx?.type === "income" ? "Maosh" : "Oziq-ovqat")
  );
  const [amount, setAmount] = useState(initialTx ? String(initialTx.amount) : "");
  const [description, setDescription] = useState(initialTx?.description || "");
  const [occurredAt, setOccurredAt] = useState(
    initialTx?.occurred_at || new Date().toISOString().slice(0, 10)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedAccount = accounts.find((a) => String(a.id) === String(accountId));

  function handleTypeChange(nextType) {
    setType(nextType);
    const list = nextType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!list.includes(category)) {
      setCategory(list[0]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const numAmount = Number(amount);
    if (!accountId) {
      setError("Avval hamyonni tanlang.");
      return;
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError("Summa 0 dan katta son bo'lishi kerak.");
      return;
    }
    if (category.trim().length < 2) {
      setError("Kategoriya kamida 2 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    setSubmitting(true);
    try {
      await onSave(
        {
          account_id: Number(accountId),
          type,
          category: category.trim(),
          amount: numAmount,
          description: description.trim(),
          occurred_at: occurredAt,
        },
        initialTx?.id
      );
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? "Tranzaksiyani tahrirlash" : "Yangi tranzaksiya"}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Yopish">
            <X size={16} />
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          {error && <div className="alert-error">{error}</div>}

          <div className="segmented">
            <button
              type="button"
              className={`seg-btn ${type === "expense" ? "active-expense" : ""}`}
              onClick={() => handleTypeChange("expense")}
            >
              Chiqim (-)
            </button>
            <button
              type="button"
              className={`seg-btn ${type === "income" ? "active-income" : ""}`}
              onClick={() => handleTypeChange("income")}
            >
              Kirim (+)
            </button>
          </div>

          <div className="field">
            <label htmlFor="tx-account">
              Hamyon{" "}
              {selectedAccount
                ? `(Mavjud: ${formatMoney(selectedAccount.balance, selectedAccount.currency)})`
                : ""}
            </label>
            <select
              id="tx-account"
              className="select"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — {formatMoney(acc.balance, acc.currency)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="tx-amount">Summa (so'm)</label>
            <input
              id="tx-amount"
              className="input"
              type="number"
              min="1"
              step="any"
              placeholder="Masalan: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="tx-category">Kategoriya</label>
            <input
              id="tx-category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <div className="chips">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`chip ${category === cat ? "selected" : ""}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="tx-date">Sana</label>
            <input
              id="tx-date"
              className="input"
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="tx-desc">Izoh (ixtiyoriy)</label>
            <input
              id="tx-desc"
              className="input"
              placeholder="Masalan: Tushlik yoki internet to'lovi"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saqlanmoqda..." : isEdit ? "Yangilash" : "Saqlash"}
          </button>
        </form>
      </div>
    </div>
  );
}
