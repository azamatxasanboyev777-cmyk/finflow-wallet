import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { formatMoney } from "../utils/format";

export default function TransferModal({ accounts, onClose, onTransfer }) {
  const [fromId, setFromId] = useState(String(accounts[0]?.id || ""));
  const [toId, setToId] = useState(String(accounts[1]?.id || accounts[0]?.id || ""));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!fromId || !toId) {
      setError("Kamida 2 ta hamyon tanlanishi kerak.");
      return;
    }
    if (fromId === toId) {
      setError("Manba va maqsad hamyon bir xil bo'lishi mumkin emas.");
      return;
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError("O'tkazma summasi 0 dan katta bo'lishi kerak.");
      return;
    }

    setSubmitting(true);
    try {
      await onTransfer({
        from_account_id: Number(fromId),
        to_account_id: Number(toId),
        amount: numAmount,
        description: description.trim() || "Ichki o'tkazma",
      });
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
          <h2 className="modal-title">Hamyonlararo o'tkazma</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Yopish">
            <X size={16} />
          </button>
        </div>

        {accounts.length < 2 ? (
          <div className="alert-error">
            O'tkazma qilish uchun kamida 2 ta hamyon bo'lishi kerak.
          </div>
        ) : (
          <form className="form-grid" onSubmit={handleSubmit}>
            {error && <div className="alert-error">{error}</div>}

            <div className="field">
              <label htmlFor="tr-from">Qaysi hamyondan</label>
              <select
                id="tr-from"
                className="select"
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — {formatMoney(acc.balance, acc.currency)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "center", color: "#10b981" }}>
              <ArrowRight size={18} />
            </div>

            <div className="field">
              <label htmlFor="tr-to">Qaysi hamyonga</label>
              <select
                id="tr-to"
                className="select"
                value={toId}
                onChange={(e) => setToId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — {formatMoney(acc.balance, acc.currency)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="tr-amount">Summa (so'm)</label>
              <input
                id="tr-amount"
                className="input"
                type="number"
                min="1"
                step="any"
                placeholder="Masalan: 250000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="tr-desc">Izoh</label>
              <input
                id="tr-desc"
                className="input"
                placeholder="Masalan: Jamg'armaga ajratildi"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "O'tkazilmoqda..." : "O'tkazmani bajarish"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
