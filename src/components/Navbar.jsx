import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sun,
  Wallet,
} from "lucide-react";

const TABS = [
  { id: "dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { id: "transactions", label: "Tranzaksiyalar", icon: ReceiptText },
  { id: "analytics", label: "Tahlil", icon: BarChart3 },
];

export default function Navbar({
  activePage,
  onNavigate,
  onOpenNewTx,
  onOpenTransfer,
  theme,
  onToggleTheme,
  user,
  onLogout,
}) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-badge">
            <Wallet size={20} />
          </div>
          <span>FinFlow</span>
        </div>

        <nav className="nav-links" aria-label="Asosiy menyu">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`nav-btn ${activePage === tab.id ? "active" : ""}`}
                onClick={() => onNavigate(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="nav-actions">
          {user && (
            <span className="user-pill" title={`${user.full_name} (${user.phone})`}>
              <ShieldCheck size={14} />
              <span>{user.full_name}</span>
            </span>
          )}

          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Yorug' rejimga o'tish" : "Tungi rejimga o'tish"}
            aria-label="Mavzuni almashtirish"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenTransfer}
            title="Hamyondan hamyonga o'tkazma"
          >
            <ArrowLeftRight size={15} />
            <span>O'tkazma</span>
          </button>

          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenNewTx}>
            <Plus size={15} />
            <span>Tranzaksiya</span>
          </button>

          <button
            type="button"
            className="icon-btn danger"
            onClick={onLogout}
            title="Chiqish"
            aria-label="Hisobdan chiqish"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
