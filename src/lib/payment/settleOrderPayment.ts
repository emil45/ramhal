import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import { getPaymentProvider } from '@/lib/payment/getPaymentProvider'
import { applyPaymentConfirmation } from '@/lib/payment/orderPayment'

import type { Order } from '@/payload-types'

/**
 * What to do when the customer's browser comes back from the payment page.
 * The visit itself proves nothing: this asks the provider what happened and
 * only that answer moves the order. Safe to run repeatedly — the return URL
 * can be reloaded, and a real provider's own notification may arrive first.
 * Returns the order as it now stands, or null for a token nobody was issued.
 */
export async function settleOrderPayment(publicToken: string): Promise<Order | null> {
  const payload = await getPayload({ config })
  const order = await findOrderByPublicToken(publicToken)
  if (!order) return null
  if (order.paymentStatus === 'paid' || !order.providerRef) return order

  // The provider that took this order's payment, not whichever the site
  // would choose for it today: the choice depends on configuration that can
  // change after the order exists.
  const confirmation = await getPaymentProvider(order.provider).confirmPayment(order.providerRef)
  await applyPaymentConfirmation(order.id, confirmation)

  return payload.findByID({ collection: 'orders', id: order.id, depth: 0 })
}

export async function findOrderByPublicToken(publicToken: string): Promise<Order | null> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'orders',
    where: { publicToken: { equals: publicToken } },
    depth: 0,
    limit: 1,
  })
  return result.docs[0] ?? null
}
