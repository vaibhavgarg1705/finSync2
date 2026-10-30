import { useState } from 'react'

const TYPES = ['summary', 'unmatched', 'outstanding', 'decisions', 'evidence', 'discrepancies', 'duplicates', 'evaluation']

export default function Reports() {
  const [type, setType] = useState('summary')
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv')

  function download() {
    window.location.href = `/api/v1/reports/${type}/export?format=${format}`
  }

  return (
    <div>
      <h2>Reports</h2>
      <label>Type
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label>Format
        <select value={format} onChange={(e) => setFormat(e.target.value as 'csv' | 'xlsx')}>
          <option value="csv">CSV</option>
          <option value="xlsx">XLSX</option>
        </select>
      </label>
      <button className="btn-primary" onClick={download}>Export</button>
    </div>
  )
}
