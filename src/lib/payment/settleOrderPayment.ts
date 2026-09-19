import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import { getPaymentProvider } from '@/lib/payment/getPaymentProvider'
import { markOrderPaid, markOrderPaymentUnsuccessful } from '@/lib/payment/orderPayment'

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

  const confirmation = await getPaymentProvider().confirmPayment(order.providerRef)

  if (confirmation.status === 'paid') {
    await markOrderPaid(order.id, confirmation.providerEventId)
  } else if (confirmation.status !== 'pending') {
    await markOrderPaymentUnsuccessful(order.id, confirmation.providerEventId, confirmation.status)
  }

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
