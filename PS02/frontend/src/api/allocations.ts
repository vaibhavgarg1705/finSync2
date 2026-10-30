import { api } from './client'
import type { PreviewResponse } from './types'

export const previewAllocation = (paymentId: string, invoiceId: string, amountMinor: number) =>
  api.post<PreviewResponse>('/allocations/preview', { paymentId, invoiceId, amountMinor })

export const confirmAllocation = (
  paymentId: string,
  invoiceId: string,
  amountMinor: number,
  previewToken: string,
  idempotencyKey: string,
) =>
  api.post<{ allocationId: string }>(
    '/allocations',
    { paymentId, invoiceId, amountMinor, previewToken },
    idempotencyKey,
  )

export const reverseAllocation = (allocationId: string, reason: string, idemKey: string) =>
  api.post(`/allocations/${allocationId}/reverse`, { reason }, idemKey)
