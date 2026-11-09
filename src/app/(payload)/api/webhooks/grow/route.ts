import { NextResponse } from 'next/server'

import { GrowProvider } from '@/lib/payment/growProvider'
import { GROW_WEBHOOK_SECRET_HEADER, readGrowConfig } from '@/lib/payment/growConfig'
import { parseGrowPaymentNotification } from '@/lib/payment/growMapping'
import { isValidWebhookSecret } from '@/lib/payment/growWebhookSecret'
import { applyPaymentConfirmation, findOrderByProviderRef } from '@/lib/payment/orderPayment'

/**
 * Make's relay of Grow's own notification that a payment changed — a safety
 * net for the customer who paid and never came back to our return page.
 * Make calls it only after Grow's callback is genuine, and the shared secret
 * says the call is Make's; neither is taken as proof of payment. Like every
 * provider here, what moves the order is the answer to confirmPayment, asked
 * of Grow again, and the same answer arriving twice is harmless through
 * PaymentEvents' UNIQUE constraint.
 *
 * Gated on the secret being configured rather than on the site currently
 * routing orders to Grow: Grow keeps notifying about orders already placed
 * under it even if the configuration changes later.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.GROW_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Grow is not configured on this deployment.' }, { status: 404 })
  }
  const config = readGrowConfig(process.env)

  if (!isValidWebhookSecret(request.headers.get(GROW_WEBHOOK_SECRET_HEADER), config.webhookSecret)) {
    return NextResponse.json({ error: 'Invalid webhook secret.' }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)
  let providerRef: string
  try {
    providerRef = parseGrowPaymentNotification(body)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid notification.' }, { status: 400 })
  }

  const order = await findOrderByProviderRef(providerRef)
  if (!order) return NextResponse.json({ ok: true, ignored: `no order for Grow payment ${providerRef}` })

  const confirmation = await new GrowProvider(config).confirmPayment(providerRef)
  await applyPaymentConfirmation(order.id, confirmation)

  return NextResponse.json({ ok: true, status: confirmation.status })
}
