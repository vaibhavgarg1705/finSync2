import { http, HttpResponse } from 'msw'
import type { Candidate, PreviewResponse } from '../api/types'

const candidates: Candidate[] = [
  {
    id: 'c1', runId: 'r1', paymentId: 'p1', invoiceId: 'inv1',
    rank: 1, score: 0.92, class: 'STRONG', status: 'SUGGESTED',
    components: { ref: 1, customerId: 1, amount: 1, date: 0.8, name: 0.9, desc: 0.6 },
    evidence: {
      supporting: ['Invoice ref INV-001 in description', 'Amount matches exactly', 'Customer ID verified'],
      conflicting: [], missing: [], alternatives: [], uncertainty: [],
      nextAction: 'Confirm allocation of full invoice total.',
    },
    explanation: { source: 'TEMPLATE', text: 'Matched via exact invoice reference and amount. Customer ID verified.' },
  },
  {
    id: 'c2', runId: 'r1', paymentId: 'p2', invoiceId: 'inv2',
    rank: 1, score: 0.72, class: 'AMBIGUOUS', status: 'SUGGESTED',
    components: { ref: 0.6, customerId: 1, amount: 0.8, date: 0.8, name: 0.85, desc: 0.4 },
    evidence: {
      supporting: ['Name similarity 0.85', 'Partial payment amount'],
      conflicting: [], missing: ['Invoice reference'], alternatives: ['Candidate #2 within 0.15'],
      uncertainty: ['Two candidates close'],
      nextAction: 'Review both candidates side-by-side before confirming.',
    },
    explanation: { source: 'AI', text: 'Two invoices have similar names and amounts. Human review required.' },
  },
]

export const handlers = [
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json() as { username: string }
    return HttpResponse.json({
      data: { token: 'mock-token', role: body.username === 'admin' ? 'Admin' : 'Reviewer' },
      meta: {},
    })
  }),
  http.get('/api/v1/reconciliation-runs/:runId/candidates', () =>
    HttpResponse.json({ data: { candidates }, meta: {} }),
  ),
  http.get('/api/v1/candidates/:id/evidence', ({ params }) =>
    HttpResponse.json({ data: candidates.find((c) => c.id === params.id), meta: {} }),
  ),
  http.post('/api/v1/allocations/preview', async () =>
    HttpResponse.json<{ data: PreviewResponse; meta: {} }>({
      data: {
        previewToken: crypto.randomUUID(),
        invoice: { total: 10000, paid: 0, outstandingBefore: 10000, outstandingAfter: 0 },
        payment: { amount: 10000, allocated: 0, remainingBefore: 10000, remainingAfter: 0 },
        overpaymentMinor: 0,
        conflicts: [],
        warnings: [],
      },
      meta: {},
    }),
  ),
  http.get('/api/v1/reports/summary', () =>
    HttpResponse.json({
      data: {
        countsByClass: { STRONG: 12, LIKELY: 8, AMBIGUOUS: 3, WEAK: 5, UNMATCHED: 2 },
        unresolved: 30, totalOutstandingMinor: 1450000, currency: 'USD',
        overdueCount: 4, integrityAlert: false,
      },
      meta: {},
    }),
  ),
]
