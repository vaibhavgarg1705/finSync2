const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, headers, rawBody } = {}) {
  const opts = { method, headers: { Accept: 'application/json', ...(headers || {}) } };
  if (rawBody !== undefined) {
    opts.body = rawBody;
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(BASE + path, opts);
  } catch (e) {
    throw new ApiError(0, 'NETWORK_ERROR', e.message || 'Network request failed');
  }

  const text = await res.text();
  let parsed = null;
  if (text) {
    try { parsed = JSON.parse(text); } catch { /* non-JSON body */ }
  }

  if (!res.ok || (parsed && parsed.success === false)) {
    const err = (parsed && parsed.error) || {};
    throw new ApiError(
      res.status,
      err.code || `HTTP_${res.status}`,
      err.message || `Request failed with status ${res.status}`,
      err.details
    );
  }
  return parsed ?? {};
}

function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  health: () => request('/health'),

  // Raw CSV (no batchId) or JSON wrapper (csv + batchId). See doc §3.2 / §3.3.
  importInvoices({ csv, batchId }) {
    if (batchId) {
      return request('/api/import/invoices', { method: 'POST', body: { csv, batchId } });
    }
    return request('/api/import/invoices', {
      method: 'POST', rawBody: csv, headers: { 'Content-Type': 'text/csv' },
    });
  },

  importPayments({ csv, batchId }) {
    if (batchId) {
      return request('/api/import/payments', { method: 'POST', body: { csv, batchId } });
    }
    return request('/api/import/payments', {
      method: 'POST', rawBody: csv, headers: { 'Content-Type': 'text/csv' },
    });
  },

  runMatching({ batchId, paymentIds, invoiceIds }) {
    const body = {};
    if (batchId) body.batchId = batchId;
    if (Array.isArray(paymentIds) && paymentIds.length) body.paymentIds = paymentIds;
    if (Array.isArray(invoiceIds) && invoiceIds.length) body.invoiceIds = invoiceIds;
    return request('/api/reconciliation/match', { method: 'POST', body });
  },

  getSuggestions({ batchId, status, limit } = {}) {
    return request(`/api/reconciliation/suggestions${qs({ batchId, status, limit })}`);
  },

  confirmSuggestion(id, { amount, decisionNote }) {
    const body = {};
    if (amount !== undefined && amount !== null && amount !== '') body.amount = amount;
    if (decisionNote !== undefined && decisionNote !== null) body.decisionNote = decisionNote;
    return request(`/api/reconciliation/suggestions/${id}/confirm`, { method: 'POST', body });
  },

  rejectSuggestion(id, { decisionNote }) {
    const body = {};
    if (decisionNote !== undefined && decisionNote !== null) body.decisionNote = decisionNote;
    return request(`/api/reconciliation/suggestions/${id}/reject`, { method: 'POST', body });
  },

  createAllocation({ paymentId, invoiceId, amount, explanation }) {
    const body = { paymentId, invoiceId, amount };
    if (explanation !== undefined) body.explanation = explanation;
    return request('/api/reconciliation/allocations', { method: 'POST', body });
  },

  getBalances(batchId) {
    return request(`/api/reconciliation/balances${qs({ batchId })}`);
  },
};