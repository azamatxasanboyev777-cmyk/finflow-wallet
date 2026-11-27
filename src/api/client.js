async function request(url, options = {}) {
  const token = localStorage.getItem("finflow_token");
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      `So'rovda xatolik yuz berdi (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return data;
}

export const api = {
  authenticate(payload) {
    return request("/api/auth", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  verifySession(token) {
    return request("/api/auth", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getAccounts(params = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.type) qs.set("type", params.type);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/api/accounts${query}`);
  },

  createAccount(payload) {
    return request("/api/accounts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateAccount(id, payload) {
    return request(`/api/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteAccount(id) {
    return request(`/api/accounts/${id}`, { method: "DELETE" });
  },

  getTransactions(params = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.accountId) qs.set("accountId", params.accountId);
    if (params.type) qs.set("type", params.type);
    if (params.category) qs.set("category", params.category);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/api/transactions${query}`);
  },

  createTransaction(payload) {
    return request("/api/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateTransaction(id, payload) {
    return request(`/api/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteTransaction(id) {
    return request(`/api/transactions/${id}`, { method: "DELETE" });
  },

  createTransfer(payload) {
    return request("/api/transfers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getAnalytics() {
    return request("/api/analytics");
  },
};
