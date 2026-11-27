import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client";
import AccountModal from "./components/AccountModal";
import Navbar from "./components/Navbar";
import { LoadingState } from "./components/StateViews";
import TransactionModal from "./components/TransactionModal";
import TransferModal from "./components/TransferModal";
import AnalyticsPage from "./pages/AnalyticsPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import WelcomeAuthPage from "./pages/WelcomeAuthPage";

const INITIAL_FILTERS = {
  search: "",
  accountId: "",
  type: "",
  category: "",
};

const THEME_KEY = "finflow_theme";
const TOKEN_KEY = "finflow_token";

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const [page, setPage] = useState("dashboard");
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [txSummary, setTxSummary] = useState({
    count: 0,
    total_income: 0,
    total_expense: 0,
    net_flow: 0,
  });
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [accountModal, setAccountModal] = useState(null);
  const [txModal, setTxModal] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setAuthChecking(false);
      return;
    }
    api
      .verifySession(savedToken)
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setAuthChecking(false));
  }, []);

  const loadCoreData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [accRes, txRes, anaRes] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(filters),
        api.getAnalytics(),
      ]);
      setAccounts(accRes.accounts);
      setTotalBalance(accRes.total_balance);
      setTransactions(txRes.transactions);
      setTxSummary(txRes.summary);
      setAnalytics(anaRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user) {
      loadCoreData();
    }
  }, [user]);

  const loadTransactionsOnly = useCallback(async (nextFilters) => {
    setTxLoading(true);
    setError("");
    try {
      const txRes = await api.getTransactions(nextFilters);
      setTransactions(txRes.transactions);
      setTxSummary(txRes.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setTxLoading(false);
    }
  }, []);

  function handleAuthenticated(nextUser, token) {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(nextUser);
    showToast(`Xush kelibsiz, ${nextUser.full_name}!`);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setAccounts([]);
    setTransactions([]);
    setAnalytics(null);
    setTotalBalance(0);
    setPage("dashboard");
  }

  function handleFiltersChange(nextFilters) {
    setFilters(nextFilters);
    loadTransactionsOnly(nextFilters);
  }

  function handleResetFilters() {
    setFilters(INITIAL_FILTERS);
    loadTransactionsOnly(INITIAL_FILTERS);
  }

  async function handleSaveAccount(payload, id) {
    if (id) {
      await api.updateAccount(id, payload);
      showToast("Hamyon muvaffaqiyatli yangilandi");
    } else {
      await api.createAccount(payload);
      showToast("Yangi hamyon yaratildi");
    }
    await loadCoreData();
  }

  async function handleDeleteAccount(acc) {
    const confirmed = window.confirm(
      `"${acc.name}" hamyonini va unga tegishli tranzaksiyalarni o'chirishni tasdiqlaysizmi?`
    );
    if (!confirmed) return;
    try {
      await api.deleteAccount(acc.id);
      showToast("Hamyon o'chirildi");
      await loadCoreData();
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function handleSaveTx(payload, id) {
    if (id) {
      await api.updateTransaction(id, payload);
      showToast("Tranzaksiya yangilandi");
    } else {
      await api.createTransaction(payload);
      showToast("Tranzaksiya qo'shildi");
    }
    await loadCoreData();
  }

  async function handleDeleteTx(tx) {
    const confirmed = window.confirm(
      `${tx.category} (${tx.amount} so'm) tranzaksiyasini o'chirasizmi?`
    );
    if (!confirmed) return;
    try {
      await api.deleteTransaction(tx.id);
      showToast("Tranzaksiya o'chirildi");
      await loadCoreData();
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function handleTransfer(payload) {
    await api.createTransfer(payload);
    showToast("O'tkazma muvaffaqiyatli bajarildi");
    await loadCoreData();
  }

  if (authChecking) {
    return (
      <div className="container">
        <LoadingState count={3} />
      </div>
    );
  }

  if (!user) {
    return (
      <WelcomeAuthPage
        theme={theme}
        onToggleTheme={toggleTheme}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <div className="app-shell">
      <Navbar
        activePage={page}
        onNavigate={setPage}
        onOpenNewTx={() => setTxModal({})}
        onOpenTransfer={() => setTransferOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onLogout={handleLogout}
      />

      <main className="container">
        {page === "dashboard" && (
          <DashboardPage
            accounts={accounts}
            totalBalance={totalBalance}
            transactions={transactions}
            analytics={analytics}
            loading={loading}
            error={error}
            onRetry={loadCoreData}
            onOpenNewAccount={() => setAccountModal({})}
            onEditAccount={(acc) => setAccountModal(acc)}
            onDeleteAccount={handleDeleteAccount}
            onOpenNewTx={() => setTxModal({})}
            onEditTx={(tx) => setTxModal(tx)}
            onGoTransactions={() => setPage("transactions")}
          />
        )}

        {page === "transactions" && (
          <TransactionsPage
            accounts={accounts}
            transactions={transactions}
            summary={txSummary}
            filters={filters}
            onChangeFilters={handleFiltersChange}
            onResetFilters={handleResetFilters}
            loading={loading || txLoading}
            error={error}
            onRetry={() => loadTransactionsOnly(filters)}
            onOpenNewTx={() => setTxModal({})}
            onEditTx={(tx) => setTxModal(tx)}
            onDeleteTx={handleDeleteTx}
          />
        )}

        {page === "analytics" && (
          <AnalyticsPage
            accounts={accounts}
            analytics={analytics}
            loading={loading}
            error={error}
            onRetry={loadCoreData}
          />
        )}
      </main>

      {accountModal && (
        <AccountModal
          initialAccount={accountModal.id ? accountModal : null}
          onClose={() => setAccountModal(null)}
          onSave={handleSaveAccount}
        />
      )}

      {txModal && (
        <TransactionModal
          accounts={accounts}
          initialTx={txModal.id ? txModal : null}
          onClose={() => setTxModal(null)}
          onSave={handleSaveTx}
        />
      )}

      {transferOpen && (
        <TransferModal
          accounts={accounts}
          onClose={() => setTransferOpen(false)}
          onTransfer={handleTransfer}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
