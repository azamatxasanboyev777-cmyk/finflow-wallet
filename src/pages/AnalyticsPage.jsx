import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { formatMoney } from "../utils/format";

export default function AnalyticsPage({ accounts, analytics, loading, error, onRetry }) {
  if (loading) return <LoadingState count={2} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!analytics) return null;

  const expenseCategories = analytics.by_category.filter((c) => c.type === "expense");
  const incomeCategories = analytics.by_category.filter((c) => c.type === "income");
  const maxExpense = Math.max(...expenseCategories.map((c) => c.total), 1);
  const maxIncome = Math.max(...incomeCategories.map((c) => c.total), 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Moliyaviy tahlil va limitlar</h1>
          <p className="page-subtitle">
            Kirim-chiqimlar tarkibi, kategoriyalar bo‘yicha ulush va kunlik dinamika
          </p>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="panel">
          <h2 className="section-title" style={{ marginBottom: 16 }}>
            Xarajatlar kategoriyalar bo‘yicha
          </h2>
          {expenseCategories.length === 0 ? (
            <EmptyState
              title="Xarajatlar yo'q"
              description="Chiqim tranzaksiyalari kiritilgandan so'ng tahlil ko'rinadi."
            />
          ) : (
            expenseCategories.map((item) => {
              const pct = Math.round((item.total / maxExpense) * 100);
              return (
                <div key={item.category} className="bar-row">
                  <div className="bar-meta">
                    <span>
                      <strong>{item.category}</strong> ({item.count} ta)
                    </span>
                    <span className="amount-expense">{formatMoney(item.total)}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, background: "#f43f5e" }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="panel">
          <h2 className="section-title" style={{ marginBottom: 16 }}>
            Kirimlar manbalari bo‘yicha
          </h2>
          {incomeCategories.length === 0 ? (
            <EmptyState
              title="Kirimlar yo'q"
              description="Kirim tranzaksiyalari kiritilgandan so'ng tahlil ko'rinadi."
            />
          ) : (
            incomeCategories.map((item) => {
              const pct = Math.round((item.total / maxIncome) * 100);
              return (
                <div key={item.category} className="bar-row">
                  <div className="bar-meta">
                    <span>
                      <strong>{item.category}</strong> ({item.count} ta)
                    </span>
                    <span className="amount-income">{formatMoney(item.total)}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, background: "#10b981" }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2 className="section-title" style={{ marginBottom: 16 }}>
          Hamyonlar bo‘yicha oylik byudjet nazorati
        </h2>
        {accounts.length === 0 ? (
          <EmptyState title="Hamyonlar yo'q" description="Avval hamyon yarating." />
        ) : (
          accounts.map((acc) => {
            const pct = acc.monthly_limit > 0 ? Math.min(acc.limit_usage_pct, 100) : 0;
            return (
              <div key={acc.id} className="bar-row">
                <div className="bar-meta">
                  <span>
                    <strong>{acc.name}</strong> · Balans: {formatMoney(acc.balance)}
                  </span>
                  <span>
                    {acc.monthly_limit > 0
                      ? `${formatMoney(acc.monthly_spent)} / ${formatMoney(acc.monthly_limit)} (${acc.limit_usage_pct}%)`
                      : "Limit belgilanmagan"}
                  </span>
                </div>
                {acc.monthly_limit > 0 && (
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: acc.limit_exceeded
                          ? "#f43f5e"
                          : pct >= 80
                          ? "#f59e0b"
                          : acc.color || "#10b981",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2 className="section-title" style={{ marginBottom: 16 }}>
          So‘nggi 14 kunlik pul oqimi
        </h2>
        {analytics.daily_flow.length === 0 ? (
          <EmptyState title="Ma'lumot yetarli emas" description="So'nggi kunlarda operatsiya yo'q." />
        ) : (
          <div className="table-wrap">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Sana</th>
                  <th>Kirim</th>
                  <th>Chiqim</th>
                  <th>Kunlik farq</th>
                </tr>
              </thead>
              <tbody>
                {analytics.daily_flow.map((day) => {
                  const net = day.income - day.expense;
                  return (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td className="amount-income">+{formatMoney(day.income)}</td>
                      <td className="amount-expense">-{formatMoney(day.expense)}</td>
                      <td style={{ fontWeight: 700 }}>{formatMoney(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
