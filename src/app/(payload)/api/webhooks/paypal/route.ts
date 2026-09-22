import { NextResponse } from 'next/server'

import { findOrderByProviderRef, markOrderPaid, markOrderPaymentUnsuccessful } from '@/lib/payment/orderPayment'
import { getAccessToken, verifyWebhookSignature } from '@/lib/payment/paypalClient'
import { readPayPalConfig } from '@/lib/payment/paypalConfig'
import { captureIdFromEvent, orderIdFromCaptureEvent, verdictForEventType } from '@/lib/payment/paypalMapping'

import type { PayPalCaptureWebhookEvent } from '@/lib/payment/paypalMapping'

/**
 * PayPal's own notification of a capture outcome — independent of, and a
 * safety net for, the synchronous capture PayPalProvider.confirmPayment
 * performs when the customer's browser returns. Whichever reaches
 * markOrderPaid/markOrderPaymentUnsuccessful first settles the order; the
 * other is a no-op through PaymentEvents' own UNIQUE constraint — no
 * separate idempotency check here. Not gated behind whether PAYMENT_PROVIDER
 * is currently "paypal": PayPal will keep sending notifications for orders
 * already placed under it even if the site's active provider changes later.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let config
  try {
    config = readPayPalConfig(process.env)
  } catch {
    return NextResponse.json({ error: 'PayPal is not configured on this deployment.' }, { status: 404 })
  }

  const transmissionId = request.headers.get('paypal-transmission-id')
  const transmissionTime = request.headers.get('paypal-transmission-time')
  const certUrl = request.headers.get('paypal-cert-url')
  const authAlgo = request.headers.get('paypal-auth-algo')
  const transmissionSig = request.headers.get('paypal-transmission-sig')
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return NextResponse.json({ error: 'Missing PayPal webhook headers.' }, { status: 400 })
  }

  const event = (await request.json().catch(() => null)) as PayPalCaptureWebhookEvent | null
  if (!event) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })

  const accessToken = await getAccessToken(config)
  const verified = await verifyWebhookSignature(config, accessToken, {
    authAlgo,
    certUrl,
    transmissionId,
    transmissionSig,
    transmissionTime,
    webhookEvent: event,
  })
  if (!verified) return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 })

  const verdict = verdictForEventType(event.event_type ?? '')
  if (!verdict) return NextResponse.json({ ok: true, ignored: event.event_type })

  const orderId = orderIdFromCaptureEvent(event)
  const captureId = captureIdFromEvent(event)
  if (!orderId || !captureId) return NextResponse.json({ error: 'Capture webhook missing order or capture id.' }, { status: 400 })

  const order = await findOrderByProviderRef(orderId)
  if (!order) return NextResponse.json({ ok: true, ignored: `no order for PayPal order ${orderId}` })

  const result = verdict === 'paid' ? await markOrderPaid(order.id, captureId) : await markOrderPaymentUnsuccessful(order.id, captureId, verdict)

  return NextResponse.json({ ok: true, result })
}
