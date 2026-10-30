import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { ErrorAlert, Loader, Badge, money } from '../components/ui.jsx';

export default function Dashboard() {
  const { batchId, setBatchId } = useApp();
  const [inputBatch, setInputBatch] = useState(batchId || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);

  const load = useCallback(async (b) => {
    setLoading(true); setError(null);
    try {
      const res = await api.getBalances(b || undefined);
      setData(res.data);
    } catch (e) {
      setError(e); setData(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    api.health().then((r) => setHealth(r)).catch(() => setHealth({ status: 'down' }));
    load(batchId);
  }, []);

  const applyFilter = (e) => {
    e.preventDefault();
    const b = inputBatch.trim();
    setBatchId(b);
    load(b);
  };

  const t = data && data.totals;

  return (
    <div>
      <div className="row" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div className="spacer" />
        {health && (
          <span className="muted">
            API: <Badge value={health.status === 'ok' ? 'PAID' : 'OVERDUE'} />{' '}
            {health.status === 'ok' ? 'healthy' : 'unreachable'}
          </span>
        )}
      </div>

      <div className="card">
        <form className="row" onSubmit={applyFilter}>
          <div className="field" style={{ margin: 0, minWidth: 280 }}>
            <label>Batch filter (optional)</label>
            <input type="text" value={inputBatch} onChange={(e) => setInputBatch(e.target.value)} placeholder="e.g. demo-2026-01" />
          </div>
          <button className="btn primary" type="submit" disabled={loading}>Apply</button>
          <button className="btn" type="button" onClick={() => { setInputBatch(''); setBatchId(''); load(); }} disabled={loading}>Clear</button>
          <div className="spacer" />
          <button className="btn" type="button" onClick={() => load(inputBatch.trim())} disabled={loading}>Refresh</button>
        </form>
      </div>

      {loading && <Loader label="Loading balances…" />}
      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {t && (
        <>
          <div className="grid cols-5" style={{ marginBottom: 20 }}>
            <Stat label="Total Invoiced" value={money(t.totalInvoiced)} />
            <Stat label="Payments Received" value={money(t.totalPaymentsReceived)} />
            <Stat label="Total Allocated" value={money(t.totalAllocated)} />
            <Stat label="Total Outstanding" value={money(t.totalOutstanding)} />
            <Stat label="Unallocated Payments" value={money(t.totalUnallocatedPayments)} />
          </div>
          <div className="grid cols-3" style={{ marginBottom: 20 }}>
            <Stat label="Invoices" value={t.invoiceCount} />
            <Stat label="Payments" value={t.paymentCount} />
            <Stat label="Currency" value={data.currency} />
          </div>

          <div className="card">
            <h3>Invoice balances</h3>
            {data.invoices.length === 0 ? (
              <div className="muted">No invoices in scope.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th><th>Customer</th><th>Due date</th>
                    <th className="num">Total</th><th className="num">Allocated</th>
                    <th className="num">Outstanding</th><th>Status</th>
                    <th className="num">Days overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv) => (
                    <tr key={inv.invoiceId}>
                      <td>{inv.invoiceNumber}</td>
                      <td>{inv.customerName} <span className="muted">({inv.customerId})</span></td>
                      <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="num">{money(inv.totalAmount)}</td>
                      <td className="num">{money(inv.allocatedAmount)}</td>
                      <td className="num">{money(inv.outstandingAmount)}</td>
                      <td><Badge value={inv.status} /></td>
                      <td className="num">{inv.daysOverdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}