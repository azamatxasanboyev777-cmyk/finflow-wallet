import { Download, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  exportTransactionsToCSV,
  formatMoney,
} from "../utils/format";

const ALL_CATEGORIES = Array.from(
  new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, "O'tkazma"])
);

export default function TransactionsPage({
  accounts,
  transactions,
  summary,
  filters,
  onChangeFilters,
  onResetFilters,
  loading,
  error,
  onRetry,
  onOpenNewTx,
  onEditTx,
  onDeleteTx,
}) {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tranzaksiyalar tarixi</h1>
          <p className="page-subtitle">
            Qidiruv, filtrlash, tahrirlash va CSV hisobot eksporti
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={transactions.length === 0}
            onClick={() => exportTransactionsToCSV(transactions)}
          >
            <Download size={16} />
            CSV yuklash
          </button>
          <button type="button" className="btn btn-primary" onClick={onOpenNewTx}>
            <Plus size={16} />
            Yangi tranzaksiya
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="filters-bar">
          <input
            className="input"
            type="search"
            placeholder="Izoh, kategoriya yoki hamyon bo'yicha qidirish..."
            value={filters.search}
            onChange={(e) => onChangeFilters({ ...filters, search: e.target.value })}
          />

          <select
            className="select"
            value={filters.accountId}
            onChange={(e) => onChangeFilters({ ...filters, accountId: e.target.value })}
          >
            <option value="">Barcha hamyonlar</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={filters.type}
            onChange={(e) => onChangeFilters({ ...filters, type: e.target.value })}
          >
            <option value="">Barcha turlar</option>
            <option value="income">Kirim (+)</option>
            <option value="expense">Chiqim (-)</option>
          </select>

          <select
            className="select"
            value={filters.category}
            onChange={(e) => onChangeFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Barcha kategoriyalar</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onResetFilters}
            title="Filtrlarni tozalash"
          >
            <RotateCcw size={15} />
            Tozalash
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
            flexWrap: "wrap",
            fontSize: "0.88rem",
            color: "var(--text-muted)",
          }}
        >
          <span>
            Topildi: <strong style={{ color: "var(--text)" }}>{summary.count}</strong> ta
          </span>
          <span>
            Kirim: <strong className="amount-income">+{formatMoney(summary.total_income)}</strong>
          </span>
          <span>
            Chiqim: <strong className="amount-expense">-{formatMoney(summary.total_expense)}</strong>
          </span>
          <span>
            Sof oqim: <strong style={{ color: "var(--text)" }}>{formatMoney(summary.net_flow)}</strong>
          </span>
        </div>
      </div>

      <div className="panel">
        {loading && transactions.length === 0 ? (
          <LoadingState count={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="Tranzaksiyalar topilmadi"
            description="Filtr shartlarini o'zgartiring yoki yangi tranzaksiya qo'shing."
            actionLabel="Yangi tranzaksiya"
            onAction={onOpenNewTx}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Sana</th>
                    <th>Hamyon</th>
                    <th>Tur</th>
                    <th>Kategoriya</th>
                    <th>Izoh</th>
                    <th>Summa</th>
                    <th style={{ textAlign: "right" }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.occurred_at}</td>
                      <td>{tx.account_name}</td>
                      <td>
                        <span
                          className={`badge ${
                            tx.type === "income" ? "badge-income" : "badge-expense"
                          }`}
                        >
                          {tx.type === "income" ? "Kirim" : "Chiqim"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{tx.category}</td>
                      <td style={{ color: "var(--text-muted)" }}>{tx.description || "—"}</td>
                      <td className={tx.type === "income" ? "amount-income" : "amount-expense"}>
                        {tx.type === "income" ? "+" : "-"}
                        {formatMoney(tx.amount)}
                      </td>
                      <td>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => onEditTx(tx)}
                            aria-label="Tahrirlash"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => onDeleteTx(tx)}
                            aria-label="O'chirish"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="tx-mobile-list">
              {transactions.map((tx) => (
                <div key={tx.id} className="tx-mobile-item">
                  <div>
                    <div style={{ fontWeight: 700 }}>{tx.category}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {tx.account_name} · {tx.occurred_at}
                    </div>
                    {tx.description && (
                      <div style={{ fontSize: "0.82rem", marginTop: 4, color: "var(--text-muted)" }}>
                        {tx.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span className={tx.type === "income" ? "amount-income" : "amount-expense"}>
                      {tx.type === "income" ? "+" : "-"}
                      {formatMoney(tx.amount)}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onEditTx(tx)}
                        aria-label="Tahrirlash"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => onDeleteTx(tx)}
                        aria-label="O'chirish"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
