import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { ACCOUNT_TYPE_LABELS, formatMoney } from "../utils/format";

export default function DashboardPage({
  accounts,
  totalBalance,
  transactions,
  analytics,
  loading,
  error,
  onRetry,
  onOpenNewAccount,
  onEditAccount,
  onDeleteAccount,
  onOpenNewTx,
  onEditTx,
  onGoTransactions,
}) {
  if (loading) {
    return <LoadingState count={3} />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  const monthIncome = analytics?.totals?.month_income ?? 0;
  const monthExpense = analytics?.totals?.month_expense ?? 0;
  const recentTx = transactions.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Moliyaviy boshqaruv paneli</h1>
          <p className="page-subtitle">
            Hamyonlar balansi, oylik limitlar va so‘nggi operatsiyalar bir joyda
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onOpenNewAccount}>
          <Plus size={16} />
          Yangi hamyon
        </button>
      </div>

      <section className="stats-grid">
        <div className="stat-card hero">
          <div className="stat-label">
            <span>Umumiy balans</span>
            <Wallet size={16} color="#10b981" />
          </div>
          <div className="stat-value">{formatMoney(totalBalance)}</div>
          <div className="stat-meta">{accounts.length} ta faol hamyon</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Shu oydagi kirim</span>
            <ArrowDownLeft size={16} color="#10b981" />
          </div>
          <div className="stat-value amount-income">+{formatMoney(monthIncome)}</div>
          <div className="stat-meta">Barcha hamyonlar bo‘yicha</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Shu oydagi chiqim</span>
            <ArrowUpRight size={16} color="#f43f5e" />
          </div>
          <div className="stat-value amount-expense">-{formatMoney(monthExpense)}</div>
          <div className="stat-meta">Joriy kalendar oyi</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Sof oqim (oylik)</span>
            <TrendingUp size={16} color="#3b82f6" />
          </div>
          <div className="stat-value">{formatMoney(monthIncome - monthExpense)}</div>
          <div className="stat-meta">Kirim minus chiqim</div>
        </div>
      </section>

      <div className="section-header">
        <h2 className="section-title">Hamyonlar va oylik limitlar</h2>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenNewAccount}>
          <Plus size={14} />
          Qo‘shish
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title="Hozircha hamyonlar yo‘q"
          description="Birinchi hamyoningizni yarating va kirim-chiqimlarni kuzatishni boshlang."
          actionLabel="Hamyon yaratish"
          onAction={onOpenNewAccount}
        />
      ) : (
        <div className="wallets-grid">
          {accounts.map((acc) => {
            const pct = Math.min(acc.limit_usage_pct, 100);
            const barColor = acc.limit_exceeded
              ? "#f43f5e"
              : pct >= 80
              ? "#f59e0b"
              : acc.color || "#10b981";

            return (
              <article key={acc.id} className="wallet-card">
                <div className="wallet-top">
                  <div className="wallet-title-wrap">
                    <span
                      className="wallet-dot"
                      style={{ background: acc.color || "#10b981" }}
                    />
                    <div>
                      <h3 className="wallet-name">{acc.name}</h3>
                      <span className="wallet-type">
                        <CreditCard size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                        {ACCOUNT_TYPE_LABELS[acc.type] || acc.type} · {acc.transaction_count} ta
                        operatsiya
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => onEditAccount(acc)}
                      title="Tahrirlash"
                      aria-label={`${acc.name} tahrirlash`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => onDeleteAccount(acc)}
                      title="O'chirish"
                      aria-label={`${acc.name} o'chirish`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="wallet-balance">{formatMoney(acc.balance, acc.currency)}</div>

                {acc.monthly_limit > 0 ? (
                  <div className="progress-wrap">
                    <div className="progress-labels">
                      <span>Oylik sarf: {formatMoney(acc.monthly_spent)}</span>
                      <span>
                        {acc.limit_usage_pct}% / {formatMoney(acc.monthly_limit)}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                    {acc.limit_exceeded && (
                      <span className="badge badge-warn">Oylik limitdan oshib ketdi</span>
                    )}
                  </div>
                ) : (
                  <div className="stat-meta">Oylik limit belgilanmagan</div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="section-header" style={{ marginTop: 30 }}>
        <h2 className="section-title">So‘nggi tranzaksiyalar</h2>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onGoTransactions}>
          Barchasini ko‘rish
        </button>
      </div>

      <div className="panel">
        {recentTx.length === 0 ? (
          <EmptyState
            title="Tranzaksiyalar hali yo‘q"
            description="Kirim yoki chiqim qo‘shib hisob-kitobni boshlang."
            actionLabel="Tranzaksiya qo‘shish"
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
                    <th>Kategoriya</th>
                    <th>Izoh</th>
                    <th>Summa</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.occurred_at}</td>
                      <td>{tx.account_name}</td>
                      <td>
                        <span
                          className={`badge ${
                            tx.type === "income" ? "badge-income" : "badge-expense"
                          }`}
                        >
                          {tx.category}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{tx.description || "—"}</td>
                      <td className={tx.type === "income" ? "amount-income" : "amount-expense"}>
                        {tx.type === "income" ? "+" : "-"}
                        {formatMoney(tx.amount)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => onEditTx(tx)}
                          aria-label="Tahrirlash"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="tx-mobile-list">
              {recentTx.map((tx) => (
                <div key={tx.id} className="tx-mobile-item" onClick={() => onEditTx(tx)}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{tx.category}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {tx.account_name} · {tx.occurred_at}
                    </div>
                  </div>
                  <div className={tx.type === "income" ? "amount-income" : "amount-expense"}>
                    {tx.type === "income" ? "+" : "-"}
                    {formatMoney(tx.amount)}
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
