import { useMutation } from '@tanstack/react-query'
import { checkoutQuoteSchema, type CheckoutInput } from '@/contracts/checkout'
import { useSession } from '@/features/auth/api'
import { identityEpoch } from '@/lib/identity'
import { scopedRequest } from '@/lib/scoped-request'
export function useCheckoutQuote() {
  const session = useSession(); const epoch = identityEpoch()
  return useMutation({ mutationKey: ['private', session.data?.user.id, 'checkout-quote'], retry: false,
    mutationFn: async (input: CheckoutInput) => checkoutQuoteSchema.parse((await scopedRequest({ method: 'POST', url: '/checkout/quote', data: input }, epoch)).data),
  })
}
