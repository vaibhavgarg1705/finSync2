export type CandidateClass = 'STRONG' | 'LIKELY' | 'AMBIGUOUS' | 'WEAK' | 'UNMATCHED'
export type CandidateStatus = 'SUGGESTED' | 'CONFIRMED' | 'REJECTED' | 'SUPERSEDED'

export interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  issueDate: string
  dueDate: string
  totalMinor: number
  currency: string
  status: string
  allocatedMinor: number
}

export interface Payment {
  id: string
  transactionId: string
  payerName: string
  referenceRaw: string
  description: string
  paymentDate: string
  amountMinor: number
  currency: string
  status: string
  allocatedMinor: number
}

export interface Evidence {
  supporting: string[]
  conflicting: string[]
  missing: string[]
  alternatives: string[]
  uncertainty: string[]
  nextAction: string
}

export interface Candidate {
  id: string
  runId: string
  paymentId: string
  invoiceId: string
  rank: number
  score: number
  class: CandidateClass
  status: CandidateStatus
  components: Record<string, number>
  evidence: Evidence
  explanation: { source: 'TEMPLATE' | 'AI'; text: string }
}

export interface PreviewResponse {
  previewToken: string
  invoice: { total: number; paid: number; outstandingBefore: number; outstandingAfter: number }
  payment: { amount: number; allocated: number; remainingBefore: number; remainingAfter: number }
  overpaymentMinor: number
  conflicts: string[]
  warnings: string[]
}
