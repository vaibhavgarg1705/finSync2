import type { PreviewResponse } from '../api/types'
import MoneyText from './MoneyText'

export default function ImpactPreview({
  preview, currency, onConfirm, disabled,
}: { preview: PreviewResponse; currency: string; onConfirm: () => void; disabled: boolean }) {
  return (
    <div className="impact-preview">
      <h3>Impact Preview</h3>
      <div className="impact-grid">
        <div>
          <h5>Invoice</h5>
          <p>Total: <MoneyText amountMinor={preview.invoice.total} currency={currency} /></p>
          <p>Paid: <MoneyText amountMinor={preview.invoice.paid} currency={currency} /></p>
          <p>Outstanding: <MoneyText amountMinor={preview.invoice.outstandingBefore} currency={currency} /> → <strong><MoneyText amountMinor={preview.invoice.outstandingAfter} currency={currency} /></strong></p>
        </div>
        <div>
          <h5>Payment</h5>
          <p>Amount: <MoneyText amountMinor={preview.payment.amount} currency={currency} /></p>
          <p>Allocated: <MoneyText amountMinor={preview.payment.allocated} currency={currency} /></p>
          <p>Remaining: <MoneyText amountMinor={preview.payment.remainingBefore} currency={currency} /> → <strong><MoneyText amountMinor={preview.payment.remainingAfter} currency={currency} /></strong></p>
        </div>
      </div>
      {preview.overpaymentMinor > 0 && (
        <p className="warn">Overpayment: <MoneyText amountMinor={preview.overpaymentMinor} currency={currency} /></p>
      )}
      {preview.conflicts.length > 0 && (
        <div className="conflict-banner">
          <strong>Conflicts:</strong>
          <ul>{preview.conflicts.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      )}
      {preview.warnings.length > 0 && (
        <ul className="warnings">{preview.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
      )}
      <button className="btn-primary" onClick={onConfirm} disabled={disabled || preview.conflicts.length > 0}>
        Confirm Allocation
      </button>
    </div>
  )
}
