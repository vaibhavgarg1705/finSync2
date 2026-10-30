import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Candidate } from '../api/types'
import ScoreBadge from '../components/ScoreBadge'
import EvidencePanel from '../components/EvidencePanel'
import ImpactPreview from '../components/ImpactPreview'
import { usePreview } from '../hooks/usePreview'
import { useConfirmAllocation } from '../hooks/useConfirmAllocation'

export default function Results() {
  const { runId } = useParams<{ runId: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['candidates', runId],
    queryFn: () => api.get<{ candidates: Candidate[] }>(`/reconciliation-runs/${runId}/candidates`),
    enabled: !!runId,
  })
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [previewToken, setPreviewToken] = useState<string | null>(null)
  const [idemKey] = useState(() => crypto.randomUUID())

  const previewMutation = usePreview()
  const confirmMutation = useConfirmAllocation()

  if (isLoading) return <p>Loading candidates…</p>
  if (!data) return null

  async function openCandidate(c: Candidate) {
    setSelected(c)
    setPreviewToken(null)
    const preview = await previewMutation.mutateAsync({
      paymentId: c.paymentId,
      invoiceId: c.invoiceId,
      amountMinor: 0, // server infers amount; adjust to component if required
    })
    setPreviewToken(preview.previewToken)
  }

  return (
    <div className="results-layout">
      <div className="candidate-list">
        <h2>Suggestions</h2>
        {data.candidates.map((c) => (
          <button key={c.id} className={`candidate-row ${selected?.id === c.id ? 'selected' : ''}`} onClick={() => openCandidate(c)}>
            <ScoreBadge cls={c.class} score={c.score} />
            <span>#{c.rank} Payment → Invoice</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="candidate-detail">
          <EvidencePanel candidate={selected} />
          {previewToken && previewMutation.data && (
            <ImpactPreview
              preview={previewMutation.data}
              currency="USD"
              disabled={confirmMutation.isPending}
              onConfirm={() => confirmMutation.mutate({
                paymentId: selected.paymentId,
                invoiceId: selected.invoiceId,
                amountMinor: Math.min(
                  previewMutation.data!.payment.remainingBefore - previewMutation.data!.payment.remainingAfter,
                  previewMutation.data!.invoice.outstandingBefore - previewMutation.data!.invoice.outstandingAfter,
                ),
                previewToken: previewToken,
                idempotencyKey: idemKey,
              })}
            />
          )}
          {confirmMutation.error && <p className="error">{confirmMutation.error.message}</p>}
        </div>
      )}
    </div>
  )
}
