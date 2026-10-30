import { useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { ErrorAlert, SuccessAlert, Loader } from '../components/ui.jsx';

const SAMPLE = 'paymentReference,customerId,customerName,amount,transactionDate,invoiceReference,description,currency\nPAY-9001,CUST-01,Acme Industries,1250.00,2026-01-20,INV-1001,Payment for INV-1001,INR\nPAY-9002,CUST-02,Bluebird Trading,500.00,2026-01-25,,Part payment,INR\n';

export default function ImportPayments() {
  const { batchId, setBatchId, addPayments } = useApp();
  const [csv, setCsv] = useState('');
  const [batch, setBatch] = useState(batchId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError({ code: 'FILE_TOO_LARGE', message: 'File exceeds the 5 MB request limit.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result || ''));
    reader.readAsText(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    const b = batch.trim();
    if (!csv.trim()) { setError({ code: 'CSV_REQUIRED', message: 'CSV content is required.' }); return; }
    setLoading(true);
    try {
      const res = await api.importPayments({ csv, batchId: b || undefined });
      const d = res.data;
      setBatchId(d.batchId);
      addPayments(d.payments || []);
      setSuccess(<>Imported <strong>{d.count}</strong> payment(s) into batch <code>{d.batchId}</code>. Payment IDs saved locally.</>);
    } catch (e) { setError(e); } finally { setLoading(false); }
  };

  return (
    <div>
      <h2>Import payments</h2>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          Required: <code>paymentReference, customerId, customerName, amount, transactionDate</code>.
          Optional: <code>invoiceReference, description, currency</code> (INR only).
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Batch ID (optional)</label>
            <input type="text" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="Same as invoice batch to keep both sides together" />
          </div>
          <div className="field">
            <label>Load from file</label>
            <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} />
          </div>
          <div className="field">
            <label>CSV content</label>
            <textarea value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={SAMPLE} spellCheck={false} />
            <div className="row">
              <button className="btn" type="button" onClick={() => setCsv(SAMPLE)}>Insert sample</button>
              <button className="btn" type="button" onClick={() => setCsv('')}>Clear</button>
              <div className="spacer" />
              <span className="muted">{(csv.length / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          <div className="row">
            <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Importing…' : 'Import payments'}</button>
            {loading && <Loader label="" />}
          </div>
        </form>
      </div>
      <ErrorAlert error={error} onDismiss={() => setError(null)} />
      <SuccessAlert onDismiss={() => setSuccess(null)}>{success}</SuccessAlert>
    </div>
  );
}