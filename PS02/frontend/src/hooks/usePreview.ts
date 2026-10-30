import { useMutation } from '@tanstack/react-query'
import { previewAllocation } from '../api/allocations'

export function usePreview() {
  return useMutation({
    mutationFn: ({ paymentId, invoiceId, amountMinor }: { paymentId: string; invoiceId: string; amountMinor: number }) =>
      previewAllocation(paymentId, invoiceId, amountMinor),
  })
}
