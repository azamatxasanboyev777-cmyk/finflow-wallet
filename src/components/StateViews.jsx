import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

export function LoadingState({ count = 3 }) {
  return (
    <div className="skeleton-grid" aria-busy="true" aria-label="Yuklanmoqda">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-box" role="alert">
      <AlertCircle size={36} color="#f43f5e" style={{ margin: "0 auto" }} />
      <h3>Ma'lumotlarni yuklashda xatolik</h3>
      <p>{message || "Server bilan bog'lanishda muammo yuz berdi."}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          <RefreshCw size={15} />
          Qayta urinish
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="state-box">
      <Inbox size={36} color="#94a3b8" style={{ margin: "0 auto" }} />
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
