import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { ErrorAlert, Loader, SuccessAlert, money } from '../components/ui.jsx';

export default function ManualAllocation() {
  const { payments, invoices, batchId } = useApp();
  const [balances, setBalances] = useState(null);
  const [balLoading, setBalLoading] = useState(false);
  const [form, setForm] = useState({
    paymentId: '', invoiceId: '', amount: '', explanation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const loadBalances = async () => {
    setBalLoading(true);
    try {
      const res = await api.getBalances(batchId || undefined);
      setBalances(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setBalLoading(false);
    }
  };

  useEffect(() => { loadBalances(); /* eslint-disable-next-line */ }, []);

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setResult(null);

    if (!form.paymentId.trim()) { setError({ code: 'INVALID_ID', message: 'paymentId is required.' }); return; }
    if (!form.invoiceId.trim()) { setError({ code: 'INVALID_ID', message: 'invoiceId is required.' }); return; }
    if (!form.amount.trim() || !/^\d+(\.\d+)?$/.test(form.amount.trim()) || Number(form.amount) <= 0) {
      setError({ code: 'INVALID_AMOUNT', message: 'Amount must be a positive decimal value.' });
      return;
    }
    if (form.explanation.length > 2000) {
      setError({ code: 'INVALID_INPUT', message: 'Explanation cannot exceed 2,000 characters.' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.createAllocation({
        paymentId: form.paymentId.trim(),
        invoiceId: form.invoiceId.trim(),
        amount: form.amount.trim(),
        explanation: form.explanation,
      });
      setResult(res.data);
      setForm({ paymentId: '', invoiceId: '', amount: '', explanation: '' });
      loadBalances();
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const inv = balances?.invoices || [];

  return (
    <div>
      <h2>Manual allocation</h2>
      <p className="muted">
        Allocates part or all of a payment to an invoice without a suggestion. There is no
        backend endpoint to list payments, so the payment dropdown comes from payments you have
        imported in this browser. Paste any valid payment ObjectId directly to bypass it.
      </p>

      <div className="card">
        <form onSubmit={submit}>
          <div className="field">
            <label>Payment ID</label>
            <input
              type="text"
              list="payments-list"
              value={form.paymentId}
              onChange={upd('paymentId')}
              placeholder="ObjectId of an existing payment"
            />
            <datalist id="payments-list">
              {payments.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.paymentReference} — {p.customerName} — {money(p.amount)}
                </option>
              ))}
            </datalist>
            <div className="hint">
              {payments.length === 0
                ? 'No payments imported in this browser yet — you can still paste an ObjectId.'
                : `${payments.length} imported payment(s) available.`}
            </div>
          </div>

          <div className="field">
            <label>Invoice ID</label>
            <input
              type="text"
              list="invoices-list"
              value={form.invoiceId}
              onChange={upd('invoiceId')}
              placeholder="ObjectId of an existing invoice"
            />
            <datalist id="invoices-list">
              {inv.map((x) => (
                <option key={x.invoiceId} value={x.invoiceId}>
                  {x.invoiceNumber} — {x.customerName} — outstanding {money(x.outstandingAmount)}
                </option>
              ))}
              {invoices.map((x) => (
                <option key={'imp-' + x._id} value={x._id}>
                  {x.invoiceNumber} — {x.customerName} — {money(x.totalAmount)}
                </option>
              ))}
            </datalist>
            <div className="hint">
              Options come from the current balances response and invoices imported here.
            </div>
          </div>

          <div className="field">
            <label>Amount</label>
            <input
              type="text"
              value={form.amount}
              onChange={upd('amount')}
              placeholder="e.g. 500.00"
            />
            <div className="hint">
              Must be positive and not exceed either the payment's or the invoice's remaining
              balance.
            </div>
          </div>

          <div className="field">
            <label>Explanation (optional, ≤ 2,000 chars)</label>
            <textarea
              style={{ minHeight: 90 }}
              value={form.explanation}
              onChange={upd('explanation')}
              maxLength={2000}
            />
          </div>

          <div className="row">
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Allocating…' : 'Create allocation'}
            </button>
            {loading && <Loader label="" />}
          </div>
        </form>
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {result && (
        <SuccessAlert onDismiss={() => setResult(null)}>
          Allocated <strong>{result.amount}</strong> from payment <code>{result.paymentId}</code>{' '}
          to invoice <code>{result.invoiceId}</code>. Allocation id:{' '}
          <code>{result._id}</code>.
        </SuccessAlert>
      )}

      <div className="card">
        <div className="row">
          <h3 style={{ margin: 0 }}>Current invoice balances</h3>
          <div className="spacer" />
          <button className="btn" onClick={loadBalances} disabled={balLoading}>
            {balLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {!balances ? (
          <div className="muted">Loading…</div>
        ) : balances.invoices.length === 0 ? (
          <div className="muted">No invoices in scope.</div>
        ) : (
          <table className="table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th className="num">Total</th>
                <th className="num">Allocated</th>
                <th className="num">Outstanding</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {balances.invoices.map((x) => (
                <tr key={x.invoiceId}>
                  <td><code>{x.invoiceNumber}</code></td>
                  <td>{x.customerName}</td>
                  <td className="num">{money(x.totalAmount)}</td>
                  <td className="num">{money(x.allocatedAmount)}</td>
                  <td className="num">{money(x.outstandingAmount)}</td>
                  <td>{x.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}