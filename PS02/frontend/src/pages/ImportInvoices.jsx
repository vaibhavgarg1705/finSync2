import { useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import { ErrorAlert, SuccessAlert, Loader } from '../components/ui.jsx';

const SAMPLE = `invoiceNumber,customerId,customerName,invoiceDate,dueDate,totalAmount,currency
INV-1001,CUST-01,Acme Industries,2026-01-05,2026-02-04,1250.00,INR
INV-1002,CUST-02,Bluebird Trading,2026-01-12,2026-02-11,875.50,INR
`;

export default function ImportInvoices() {
  const { batchId, setBatchId, addInvoices } = useApp();
  const [csv, setCsv] = useState('');
  const [batch, setBatch] = useState(batchId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
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
      const res = await api.importInvoices({ csv, batchId: b || undefined });
      const d = res.data;
      setBatchId(d.batchId);
      addInvoices(d.invoices || []);
      setSuccess(
        <>Imported <strong>{d.count}</strong> invoice(s) into batch <code>{d.batchId}</code>.</>
      );
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Import invoices</h2>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          Send raw CSV (<code>Content-Type: text/csv</code>) or a JSON body with <code>csv</code>{' '}
          and optional <code>batchId</code>. Required columns: <code>invoiceNumber, customerId,
          customerName, invoiceDate, dueDate, totalAmount</code>. Optional: <code>currency</code>{' '}
          (must be INR). Dates accept <code>YYYY-MM-DD</code> or day-first{' '}
          <code>DD/MM/YYYY</code>, <code>DD-MM-YYYY</code>, <code>DD.MM.YYYY</code>.
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label>Batch ID (optional)</label>
            <input
              type="text"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="Leave blank to auto-generate a UUID"
            />
            <div className="hint">
              If provided, send this same batch ID for payment imports so batch filters include
              both sides.
            </div>
          </div>

          <div className="field">
            <label>Load from file</label>
            <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} />
          </div>

          <div className="field">
            <label>CSV content</label>
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={SAMPLE}
              spellCheck={false}
            />
            <div className="row">
              <button className="btn" type="button" onClick={() => setCsv(SAMPLE)}>
                Insert sample
              </button>
              <button className="btn" type="button" onClick={() => setCsv('')}>
                Clear
              </button>
              <div className="spacer" />
              <span className="muted">{(csv.length / 1024).toFixed(1)} KB</span>
            </div>
          </div>

          <div className="row">
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Importing…' : 'Import invoices'}
            </button>
            {loading && <Loader label="" />}
          </div>
        </form>
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />
      <SuccessAlert onDismiss={() => setSuccess(null)}>{success}</SuccessAlert>
    </div>
  );
}