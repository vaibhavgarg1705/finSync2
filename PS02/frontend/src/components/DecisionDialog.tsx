import { useState } from 'react'

export default function DecisionDialog({
  title, onConfirm, onCancel,
}: { title: string; onConfirm: (reasonCode: string, note: string) => void; onCancel: () => void }) {
  const [reasonCode, setReasonCode] = useState('')
  const [note, setNote] = useState('')
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <label>
          Reason (required)
          <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
            <option value="">Select…</option>
            <option value="WRONG_CUSTOMER">Wrong customer</option>
            <option value="WRONG_AMOUNT">Wrong amount</option>
            <option value="DUPLICATE">Duplicate</option>
            <option value="NOT_A_MATCH">Not a match</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>
          Note (optional)
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </label>
        <div className="modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="btn-primary" disabled={!reasonCode} onClick={() => onConfirm(reasonCode, note)}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
