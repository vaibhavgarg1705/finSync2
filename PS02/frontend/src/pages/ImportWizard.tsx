import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

interface ImportBatch {
  id: string
  status: string
  type: 'INVOICES' | 'PAYMENTS'
  rowCount: number
  errorCount: number
}

interface ImportError {
  rowNumber: number
  field: string
  message: string
}

type Step = 'upload' | 'mapping' | 'summary'

export default function ImportWizard() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES')
  const [batch, setBatch] = useState<ImportBatch | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<ImportError[]>([])
  const nav = useNavigate()

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose a file first')
      const form = new FormData()
      form.append('file', file)
      form.append('type', type)
      return api.postForm<ImportBatch>('/imports', form)
    },
    onSuccess: (b) => {
      setBatch(b)
      setStep('mapping')
    },
  })

  const mappingMutation = useMutation({
    mutationFn: () => api.put<ImportBatch>(`/imports/${batch!.id}/mapping`, { mapping }),
    onSuccess: async (b) => {
      setBatch(b)
      const errs = await api.get<{ errors: ImportError[] }>(`/imports/${b.id}/errors`)
      setErrors(errs.errors)
      setStep('summary')
    },
  })

  const runMutation = useMutation({
    mutationFn: () => api.post<{ runId: string }>('/reconciliation-runs', { importBatchId: batch!.id }),
    onSuccess: (r) => {
      nav(`/runs/${r.runId}/results`)
    },
  })

  return (
    <div className="wizard">
      <ol className="wizard-steps">
        <li className={step === 'upload' ? 'active' : ''}>Upload</li>
        <li className={step === 'mapping' ? 'active' : ''}>Map columns</li>
        <li className={step === 'summary' ? 'active' : ''}>Summary</li>
      </ol>

      {step === 'upload' && (
        <section>
          <h2>Upload CSV</h2>
          <label>Type
            <select value={type} onChange={(e) => setType(e.target.value as 'INVOICES' | 'PAYMENTS')}>
              <option value="INVOICES">Invoices</option>
              <option value="PAYMENTS">Payments</option>
            </select>
          </label>
          <label>File
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button className="btn-primary" onClick={() => uploadMutation.mutate()} disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
          </button>
          {uploadMutation.error && <p className="error">{(uploadMutation.error as Error).message}</p>}
        </section>
      )}

      {step === 'mapping' && batch && (
        <section>
          <h2>Map columns</h2>
          <p className="muted">We detected headers. Confirm the mapping to required fields.</p>
          {Object.keys(mapping).length === 0 && (
            <p className="muted">Provide one mapping per required field below.</p>
          )}
          {['invoiceNumber', 'customerId', 'totalMinor', 'issueDate', 'dueDate', 'currency'].map((field) => (
            <label key={field}>
              {field}
              <input
                placeholder="source column name"
                value={mapping[field] ?? ''}
                onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
              />
            </label>
          ))}
          <button className="btn-primary" onClick={() => mappingMutation.mutate()} disabled={mappingMutation.isPending}>
            Save mapping
          </button>
          {mappingMutation.error && <p className="error">{(mappingMutation.error as Error).message}</p>}
        </section>
      )}

      {step === 'summary' && batch && (
        <section>
          <h2>Import summary</h2>
          <p>{batch.rowCount} rows read, {batch.errorCount} with errors.</p>
          {errors.length > 0 && (
            <table className="data-table">
              <thead><tr><th>Row</th><th>Field</th><th>Message</th></tr></thead>
              <tbody>
                {errors.map((e, i) => (
                  <tr key={i}><td>{e.rowNumber}</td><td>{e.field}</td><td>{e.message}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <button className="btn-primary" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
            Run matching
          </button>
          {runMutation.error && <p className="error">{(runMutation.error as Error).message}</p>}
        </section>
      )}
    </div>
  )
}
