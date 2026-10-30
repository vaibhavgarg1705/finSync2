import { useMutation, useQueryClient } from '@tanstack/react-query'
import { confirmAllocation } from '../api/allocations'

export function useConfirmAllocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { paymentId: string; invoiceId: string; amountMinor: number; previewToken: string; idempotencyKey: string }) =>
      confirmAllocation(args.paymentId, args.invoiceId, args.amountMinor, args.previewToken, args.idempotencyKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balances'] })
      qc.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}
