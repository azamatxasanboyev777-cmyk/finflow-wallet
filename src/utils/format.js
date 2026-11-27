export const ACCOUNT_TYPE_LABELS = {
  card: "Bank kartasi",
  cash: "Naqd pul",
  savings: "Jamg'arma",
};

export const EXPENSE_CATEGORIES = [
  "Oziq-ovqat",
  "Transport",
  "Kommunal",
  "Ta'lim",
  "Salomatlik",
  "Ko'ngilochar",
  "Boshqa",
];

export const INCOME_CATEGORIES = [
  "Maosh",
  "Frilans",
  "Bonus",
  "Jamg'arma",
  "Qaytarilgan qarz",
  "Boshqa",
];

export const ACCOUNT_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];

export function formatMoney(amount, currency = "UZS") {
  const num = Number(amount || 0);
  const formatted = new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 2,
  }).format(num);
  return currency === "UZS" ? `${formatted} so'm` : `${formatted} ${currency}`;
}

export function exportTransactionsToCSV(transactions) {
  const headers = ["ID", "Sana", "Hamyon", "Tur", "Kategoriya", "Summa", "Izoh"];
  const escape = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
  const rows = transactions.map((tx) =>
    [
      tx.id,
      tx.occurred_at,
      tx.account_name || tx.account_id,
      tx.type === "income" ? "Kirim" : "Chiqim",
      tx.category,
      tx.amount,
      tx.description,
    ]
      .map(escape)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `finflow-tranzaksiyalar-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
