import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { CheckboxList, ErrorAlert, InfoAlert, Loader, SuccessAlert } from '../components/ui.jsx';

export default function Matching() {
  const navigate = useNavigate();
  const { batchId, setBatchId, payments, invoices } = useApp();
  const [batch, setBatch] = useState(batchId || '');
  const [paymentIds, setPaymentIds] = useState([]);
  const [invoiceIds, setInvoiceIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setResult(null);
    const b = batch.trim();
    setBatchId(b);
    setLoading(true);
    try {
      const res = await api.runMatching({
        batchId: b || undefined,
        paymentIds,
        invoiceIds,
      });
      setResult(res.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const labelPayment = (p) =>
    `${p.paymentReference} — ${p.customerName} — ${p.amount} (${p.importBatchId || 'no batch'})`;
  const labelInvoice = (i) =>
    `${i.invoiceNumber} — ${i.customerName} — ${i.totalAmount} (${i.importBatchId || 'no batch'})`;

  return (
    <div>
      <h2>Generate match suggestions</h2>

      <InfoAlert>
        Matching <strong>replaces</strong> existing PENDING suggestions for the selected
        payment/invoice scope. It does not confirm or allocate anything. The POST response
        does not contain suggestion <code>_id</code>s — open the Suggestions page to review
        and act on them.
      </InfoAlert>

      <div className="card">
        <form onSubmit={submit}>
          <div className="field">
            <label>Batch ID (optional)</label>
            <input
              type="text"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="Scopes payments only; invoices are selected across batches unless invoice IDs are chosen"
            />
          </div>

          <div className="field">
            <label>Payment IDs (optional — overrides batchId)</label>
            <CheckboxList
              items={payments}
              selected={paymentIds}
              onChange={setPaymentIds}
              getId={(p) => p._id}
              getLabel={labelPayment}
              emptyText="No payments imported in this browser yet. Import payments or leave empty to select all in scope."
            />
            <div className="hint">
              Selected: {paymentIds.length} {paymentIds.length > 0 && (
                <button type="button" className="btn-link" onClick={() => setPaymentIds([])}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="field">
            <label>Invoice IDs (optional)</label>
            <CheckboxList
              items={invoices}
              selected={invoiceIds}
              onChange={setInvoiceIds}
              getId={(i) => i._id}
              getLabel={labelInvoice}
              emptyText="No invoices imported in this browser yet. Leave empty to include all INR invoices."
            />
            <div className="hint">
              Selected: {invoiceIds.length} {invoiceIds.length > 0 && (
                <button type="button" className="btn-link" onClick={() => setInvoiceIds([])}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="row">
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Running…' : 'Run matching'}
            </button>
            {loading && <Loader label="" />}
          </div>
        </form>
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {result && (
        <SuccessAlert>
          Payments: <strong>{result.paymentCount}</strong>{' '}
          · Invoices: <strong>{result.invoiceCount}</strong>{' '}
          · Suggestions generated: <strong>{result.suggestionCount}</strong>
          <div style={{ marginTop: 10 }}>
            <button className="btn primary" onClick={() => navigate('/suggestions')}>
              Open Suggestions
            </button>
          </div>
        </SuccessAlert>
      )}
    </div>
  );
}