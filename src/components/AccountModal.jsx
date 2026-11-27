import { useState } from "react";
import { X } from "lucide-react";
import { ACCOUNT_COLORS, ACCOUNT_TYPE_LABELS } from "../utils/format";

export default function AccountModal({ initialAccount, onClose, onSave }) {
  const isEdit = Boolean(initialAccount);
  const [name, setName] = useState(initialAccount?.name || "");
  const [type, setType] = useState(initialAccount?.type || "card");
  const [balance, setBalance] = useState(
    initialAccount ? String(initialAccount.balance) : "0"
  );
  const [monthlyLimit, setMonthlyLimit] = useState(
    initialAccount ? String(initialAccount.monthly_limit) : "0"
  );
  const [color, setColor] = useState(initialAccount?.color || ACCOUNT_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Hamyon nomi kamida 2 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    const parsedLimit = Number(monthlyLimit || 0);
    if (!Number.isFinite(parsedLimit) || parsedLimit < 0) {
      setError("Oylik limit manfiy bo'lishi mumkin emas.");
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      monthly_limit: parsedLimit,
      color,
    };

    if (!isEdit) {
      const parsedBalance = Number(balance || 0);
      if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
        setError("Boshlang'ich balans manfiy bo'lishi mumkin emas.");
        return;
      }
      payload.balance = parsedBalance;
    }

    setSubmitting(true);
    try {
      await onSave(payload, initialAccount?.id);
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
            {isEdit ? "Hamyonni tahrirlash" : "Yangi hamyon qo'shish"}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Yopish">
            <X size={16} />
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          {error && <div className="alert-error">{error}</div>}

          <div className="field">
            <label htmlFor="acc-name">Hamyon nomi</label>
            <input
              id="acc-name"
              className="input"
              placeholder="Masalan: Uzcard Shaxsiy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="acc-type">Hamyon turi</label>
            <select
              id="acc-type"
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {!isEdit && (
            <div className="field">
              <label htmlFor="acc-balance">Boshlang'ich balans (so'm)</label>
              <input
                id="acc-balance"
                className="input"
                type="number"
                min="0"
                step="any"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="acc-limit">Oylik xarajat limiti (so'm, 0 = cheklovsiz)</label>
            <input
              id="acc-limit"
              className="input"
              type="number"
              min="0"
              step="any"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Kartochka rangi</label>
            <div className="chips">
              {ACCOUNT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Rang ${c}`}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "999px",
                    background: c,
                    border: color === c ? "3px solid #fff" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saqlanmoqda..." : isEdit ? "O'zgarishlarni saqlash" : "Hamyon yaratish"}
          </button>
        </form>
      </div>
    </div>
  );
}
