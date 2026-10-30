import { api } from './client'
import type { Candidate } from './types'

export const getCandidatesForRun = (runId: string) =>
  api.get<{ candidates: Candidate[] }>(`/reconciliation-runs/${runId}/candidates`)

export const getEvidence = (candidateId: string) =>
  api.get<Candidate>(`/candidates/${candidateId}/evidence`)

export const rejectCandidate = (id: string, reasonCode: string, note?: string) =>
  api.post(`/candidates/${id}/reject`, { reasonCode, note })

export const correctCandidate = (id: string, invoiceId: string, reasonCode: string, note?: string) =>
  api.post(`/candidates/${id}/correct`, { invoiceId, reasonCode, note })

export const assignPayment = (paymentId: string, invoiceId: string, reasonCode: string) =>
  api.post(`/payments/${paymentId}/assign`, { invoiceId, reasonCode })
