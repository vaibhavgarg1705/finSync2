import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import {
  Badge, ErrorAlert, Loader, Modal, SuccessAlert, money,
} from '../components/ui.jsx';

const STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', ''];

export default function Suggestions() {
  const { batchId } = useApp();
  const [filters, setFilters] = useState({
    batchId: batchId || '',
    status: 'PENDING',
    limit: '100',
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);
  const [dialog, setDialog] = useState(null); // { mode, suggestion }

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.getSuggestions({
        batchId: filters.batchId.trim() || undefined,
        status: filters.status,
        limit: filters.limit ? Number(filters.limit) : undefined,
      });
      setRows(res.data || []);
    } catch (e) {
      setError(e); setRows([]);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onFilterChange = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const refresh = () => load();

  const onConfirmSubmit = async ({ amount, decisionNote }) => {
    try {
      await api.confirmSuggestion(dialog.suggestion._id, { amount, decisionNote });
      setDialog(null);
      setFlash('Suggestion confirmed. Balances may have changed — check the Dashboard.');
      refresh();
    } catch (e) {
      setError(e);
    }
  };

  const onRejectSubmit = async ({ decisionNote }) => {
    try {
      await api.rejectSuggestion(dialog.suggestion._id, { decisionNote });
      setDialog(null);
      setFlash('Suggestion rejected.');
      refresh();
    } catch (e) {
      setError(e);
    }
  };

  return (
    <div>
      <h2>Match suggestions</h2>

      <div className="card">
        <form className="row" onSubmit={(e) => { e.preventDefault(); load(); }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Batch</label>
            <input type="text" value={filters.batchId} onChange={onFilterChange('batchId')} placeholder="(any)" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Status</label>
            <select value={filters.status} onChange={onFilterChange('status')}>
              {STATUSES.map((s) => (
                <option key={s || 'all'} value={s}>{s || 'All statuses'}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0, width: 110 }}>
            <label>Limit</label>
            <input
              type="number" min={1} max={500}
              value={filters.limit}
              onChange={onFilterChange('limit')}
            />
          </div>
          <button className="btn primary" type="submit" disabled={loading}>Reload</button>
          <div className="spacer" />
          <span className="muted">Score is capped points (0–100), not probability.</span>
        </form>
      </div>

      {loading && <Loader label="Loading suggestions…" />}
      <ErrorAlert error={error} onDismiss={() => setError(null)} />
      <SuccessAlert onDismiss={() => setFlash(null)}>{flash}</SuccessAlert>

      {!loading && rows.length === 0 && (
        <div className="card">
          <div className="muted">
            No suggestions match the current filters. Run matching first, then open this page.
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Payment</th>
                <th>Invoice</th>
                <th className="num">Score</th>
                <th>Confidence</th>
                <th>Category</th>
                <th className="num">Suggested</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const pay = s.paymentId || {};
                const inv = s.invoiceId || {};
                return (
                  <tr key={s._id}>
                    <td>
                      <div><strong>{s.paymentReference}</strong></div>
                      <div className="muted">
                        {pay.customerName || '—'} · {money(pay.amount)}
                      </div>
                    </td>
                    <td>
                      <div><strong>{s.invoiceNumber}</strong></div>
                      <div className="muted">
                        {inv.customerName || '—'} · {money(inv.totalAmount)}
                      </div>
                    </td>
                    <td className="num">{s.score}</td>
                    <td><Badge value={s.confidence} /></td>
                    <td><Badge value={s.category} /></td>
                    <td className="num">{money(s.suggestedAmount)}</td>
                    <td><Badge value={s.status} /></td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <button
                          className="btn"
                          onClick={() => setDialog({ mode: 'confirm', suggestion: s })}
                          disabled={s.status !== 'PENDING'}
                        >
                          Confirm
                        </button>
                        <button
                          className="btn"
                          onClick={() => setDialog({ mode: 'reject', suggestion: s })}
                          disabled={s.status !== 'PENDING'}
                        >
                          Reject
                        </button>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <button className="btn-link" onClick={() => setDialog({ mode: 'details', suggestion: s })}>
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.mode === 'details' && (
        <Modal title="Suggestion details" onClose={() => setDialog(null)}>
          <DetailsView suggestion={dialog.suggestion} />
        </Modal>
      )}
      {dialog?.mode === 'confirm' && (
        <ConfirmDialog
          suggestion={dialog.suggestion}
          onCancel={() => setDialog(null)}
          onSubmit={onConfirmSubmit}
        />
      )}
      {dialog?.mode === 'reject' && (
        <RejectDialog
          suggestion={dialog.suggestion}
          onCancel={() => setDialog(null)}
          onSubmit={onRejectSubmit}
        />
      )}
    </div>
  );
}

function DetailsView({ suggestion: s }) {
  const pay = s.paymentId || {};
  const inv = s.invoiceId || {};
  return (
    <div>
      <div className="kv">
        <div className="k">Suggestion ID</div><div><code>{s._id}</code></div>
        <div className="k">Score / Confidence</div>
        <div>{s.score} · <Badge value={s.confidence} /></div>
        <div className="k">Category</div><div><Badge value={s.category} /></div>
        <div className="k">Suggested amount</div><div>{money(s.suggestedAmount)}</div>
        <div className="k">Payment</div>
        <div>
          {s.paymentReference} · {pay.customerName || '—'} · {money(pay.amount)}
        </div>
        <div className="k">Invoice</div>
        <div>
          {s.invoiceNumber} · {inv.customerName || '—'} · {money(inv.totalAmount)}
        </div>
        <div className="k">Decision note</div>
        <div>{s.decisionNote || <span className="muted">—</span>}</div>
      </div>

      <h3 style={{ marginTop: 16 }}>Flags</h3>
      {s.flags?.length ? (
        <div className="tag-list">
          {s.flags.map((f) => <span key={f} className="tag">{f}</span>)}
        </div>
      ) : <div className="muted">No flags.</div>}

      <h3 style={{ marginTop: 16 }}>Explanation</h3>
      {s.explanation?.length ? (
        <ul>
          {s.explanation.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      ) : <div className="muted">—</div>}
    </div>
  );
}

function ConfirmDialog({ suggestion, onCancel, onSubmit }) {
  const [amount, setAmount] = useState(String(suggestion.suggestedAmount || ''));
  const [note, setNote] = useState(suggestion.decisionNote || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    const amt = amount.trim();
    if (amt && !/^\d+(\.\d+)?$/.test(amt)) {
      setErr({ code: 'INVALID_AMOUNT', message: 'Amount must be a positive decimal value.' });
      return;
    }
    if (amt && Number(amt) <= 0) {
      setErr({ code: 'AMOUNT_NOT_POSITIVE', message: 'Amount must be greater than zero.' });
      return;
    }
    if (note.length > 2000) {
      setErr({ code: 'INVALID_INPUT', message: 'Decision note cannot exceed 2,000 characters.' });
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ amount: amt || undefined, decisionNote: note });
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Confirm ${suggestion.paymentReference} → ${suggestion.invoiceNumber}`} onClose={onCancel}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Amount to allocate</label>
          <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="hint">
            Leave blank to use the suggested amount ({money(suggestion.suggestedAmount)}).
            Must not exceed either remaining balance.
          </div>
        </div>
        <div className="field">
          <label>Decision note (optional, ≤ 2,000 chars)</label>
          <textarea
            style={{ minHeight: 100 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
          />
        </div>
        <ErrorAlert error={err} />
        <div className="row">
          <div className="spacer" />
          <button className="btn" type="button" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Confirming…' : 'Confirm suggestion'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RejectDialog({ suggestion, onCancel, onSubmit }) {
  const [note, setNote] = useState(suggestion.decisionNote || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (note.length > 2000) {
      setErr({ code: 'INVALID_INPUT', message: 'Decision note cannot exceed 2,000 characters.' });
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ decisionNote: note });
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Reject ${suggestion.paymentReference} → ${suggestion.invoiceNumber}`} onClose={onCancel}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Decision note (optional, ≤ 2,000 chars)</label>
          <textarea
            style={{ minHeight: 100 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
          />
        </div>
        <ErrorAlert error={err} />
        <div className="row">
          <div className="spacer" />
          <button className="btn" type="button" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn danger" type="submit" disabled={busy}>
            {busy ? 'Rejecting…' : 'Reject suggestion'}
          </button>
        </div>
      </form>
    </Modal>
  );
}