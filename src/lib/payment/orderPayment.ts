import 'server-only'

import config from '@payload-config'
import { commitTransaction, getPayload, initTransaction, killTransaction, ValidationError } from 'payload'

import type { Order } from '@/payload-types'
import type { PaymentStatus } from '@/lib/orderStatus'

export type PaymentEventResult = 'applied' | 'already-processed'

/** Finds the order a provider's own reference belongs to — what a webhook
 * has to do first, since it only ever names the provider's own ids. */
export async function findOrderByProviderRef(providerRef: string): Promise<Order | null> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'orders',
    where: { providerRef: { equals: providerRef } },
    depth: 0,
    limit: 1,
  })
  return result.docs[0] ?? null
}

type ProviderVerdict = Exclude<PaymentStatus, 'pending'>

/**
 * The single function that transitions an order to paid, and idempotent: the
 * database's UNIQUE constraint on `providerEventId` decides whether this
 * confirmation has been seen, not a read-then-write in application code,
 * which two concurrent deliveries of the same provider retry would both pass.
 */
export async function markOrderPaid(orderId: number, providerEventId: string): Promise<PaymentEventResult> {
  return recordProviderVerdict(orderId, providerEventId, 'paid')
}

/** A provider's word that the payment did not go through. Never overrides a
 * payment we already know arrived. */
export async function markOrderPaymentUnsuccessful(
  orderId: number,
  providerEventId: string,
  verdict: 'failed' | 'cancelled',
): Promise<PaymentEventResult> {
  return recordProviderVerdict(orderId, providerEventId, verdict)
}

/**
 * Records the event and moves the order in one transaction, so a failure
 * halfway cannot leave an event on file for an order that never changed —
 * which would make every retry look like a duplicate and the order could
 * never be marked paid.
 */
async function recordProviderVerdict(
  orderId: number,
  providerEventId: string,
  verdict: ProviderVerdict,
): Promise<PaymentEventResult> {
  const payload = await getPayload({ config })
  const req = { payload }
  const startedTransaction = await initTransaction(req)

  try {
    const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, req })

    await payload.create({
      collection: 'paymentEvents',
      data: { providerEventId, provider: order.provider, order: orderId, status: verdict },
      req,
    })

    if (verdict === 'paid') {
      if (order.paymentStatus !== 'paid') {
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: { paymentStatus: 'paid', paidAt: new Date().toISOString(), fulfilmentStatus: 'new' },
          req,
        })
      }
    } else if (order.paymentStatus === 'pending') {
      await payload.update({ collection: 'orders', id: orderId, data: { paymentStatus: verdict }, req })
    }

    if (startedTransaction) await commitTransaction(req)
    return 'applied'
  } catch (error) {
    if (startedTransaction) await killTransaction(req)
    if (isDuplicateProviderEvent(error)) return 'already-processed'
    throw error
  }
}

function isDuplicateProviderEvent(error: unknown): boolean {
  return error instanceof ValidationError && error.data.errors.some((fieldError) => fieldError.path === 'providerEventId')
}
