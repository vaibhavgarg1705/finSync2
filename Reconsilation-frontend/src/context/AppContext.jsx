import { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext(null);
const LS_KEY = 'reconciliation.frontend.v1';

function loadInitial() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function dedupe(prev, incoming) {
  const seen = new Set(prev.map((x) => x._id));
  return [...prev, ...incoming.filter((x) => x && x._id && !seen.has(x._id))];
}

export function AppProvider({ children }) {
  const init = loadInitial();
  const [batchId, setBatchId] = useState(init.batchId || '');
  const [payments, setPayments] = useState(init.payments || []);
  const [invoices, setInvoices] = useState(init.invoices || []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ batchId, payments, invoices }));
    } catch { /* ignore */ }
  }, [batchId, payments, invoices]);

  const addInvoices = (list) => setInvoices((prev) => dedupe(prev, list || []));
  const addPayments = (list) => setPayments((prev) => dedupe(prev, list || []));
  const clearStored = () => { setPayments([]); setInvoices([]); };

  return (
    <AppContext.Provider
      value={{ batchId, setBatchId, payments, invoices, addInvoices, addPayments, clearStored }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);