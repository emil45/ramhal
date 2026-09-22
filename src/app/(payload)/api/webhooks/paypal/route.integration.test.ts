import config from '@payload-config'
import { randomUUID } from 'node:crypto'
import { getPayload } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { countPaymentEventsFor, startTestRun } from '@/test/checkoutFixtures'

import { POST } from './route'

import type { Order } from '@/payload-types'

const { getAccessToken, verifyWebhookSignature } = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}))

vi.mock('@/lib/payment/paypalClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/payment/paypalClient')>()),
  getAccessToken,
  verifyWebhookSignature,
}))

// Real database (see src/test/checkoutFixtures.ts) — only the network calls
// to PayPal itself are mocked; the webhook route's own signature check,
// order lookup, and settlement all run for real.
const run = startTestRun()
const orders: Order[] = []

async function createPayPalOrder(providerRef: string): Promise<Order> {
  const payload = await getPayload({ config })
  return payload.create({
    collection: 'orders',
    data: {
      paymentStatus: 'pending',
      customer: { name: 'לקוח בדיקה', email: run.email, phone: '0501234567' },
      lines: [{ title: 'ספר בדיקה', unitPrice: 55, currency: 'ILS', quantity: 1, shippingUnits: 1 }],
      currency: 'ILS',
      subtotal: 55,
      shippingCost: 0,
      total: 55,
      shippingZone: 'israel',
      destinationCountry: 'IL',
      locale: 'he',
      provider: 'paypal',
      providerRef,
      publicToken: randomUUID(),
    },
  })
}

async function reload(order: Order): Promise<Order> {
  const payload = await getPayload({ config })
  return payload.findByID({ collection: 'orders', id: order.id, depth: 0 })
}

function webhookRequest(event: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://site.example/api/webhooks/paypal', {
    method: 'POST',
    headers: {
      'paypal-transmission-id': 'transmission-1',
      'paypal-transmission-time': '2026-01-01T00:00:00Z',
      'paypal-cert-url': 'https://api.paypal.com/cert',
      'paypal-auth-algo': 'SHA256withRSA',
      'paypal-transmission-sig': 'sig',
      ...headers,
    },
    body: JSON.stringify(event),
  })
}

function captureCompletedEvent(orderId: string, captureId: string) {
  return {
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    resource: { id: captureId, supplementary_data: { related_ids: { order_id: orderId } } },
  }
}

beforeAll(async () => {
  // readPayPalConfig requires these; the values themselves are never used —
  // every PayPal network call in this file is mocked.
  vi.stubEnv('PAYPAL_CLIENT_ID', 'client-id')
  vi.stubEnv('PAYPAL_CLIENT_SECRET', 'client-secret')
  vi.stubEnv('PAYPAL_WEBHOOK_ID', 'webhook-id')
  vi.stubEnv('PAYPAL_ENV', 'sandbox')
  getAccessToken.mockResolvedValue('access-token')
})

afterEach(() => {
  verifyWebhookSignature.mockReset()
})

afterAll(async () => {
  vi.unstubAllEnvs()
  const payload = await getPayload({ config })
  for (const order of orders) {
    await payload.delete({ collection: 'paymentEvents', where: { order: { equals: order.id } } })
    await payload.delete({ collection: 'orders', id: order.id })
  }
})

describe('POST /api/webhooks/paypal', () => {
  it('marks the order paid on a verified capture-completed event', async () => {
    const order = await createPayPalOrder(`ORDER-${randomUUID()}`)
    orders.push(order)
    verifyWebhookSignature.mockResolvedValue(true)

    const response = await POST(webhookRequest(captureCompletedEvent(order.providerRef ?? '', `CAP-${randomUUID()}`)))

    expect(response.status).toBe(200)
    expect((await reload(order)).paymentStatus).toBe('paid')
  })

  it('rejects a tampered payload: an unverified signature never settles the order', async () => {
    const order = await createPayPalOrder(`ORDER-${randomUUID()}`)
    orders.push(order)
    verifyWebhookSignature.mockResolvedValue(false)

    const response = await POST(webhookRequest(captureCompletedEvent(order.providerRef ?? '', `CAP-${randomUUID()}`)))

    expect(response.status).toBe(400)
    expect((await reload(order)).paymentStatus).toBe('pending')
  })

  it('is a no-op on a replayed delivery of the same event — proven by actually replaying it', async () => {
    const order = await createPayPalOrder(`ORDER-${randomUUID()}`)
    orders.push(order)
    verifyWebhookSignature.mockResolvedValue(true)
    const event = captureCompletedEvent(order.providerRef ?? '', `CAP-${randomUUID()}`)

    const first = await POST(webhookRequest(event))
    const firstBody = await first.json()
    const second = await POST(webhookRequest(event))
    const secondBody = await second.json()

    expect(firstBody.result).toBe('applied')
    expect(secondBody.result).toBe('already-processed')
    expect(await countPaymentEventsFor(order.id)).toBe(1)
    expect((await reload(order)).paymentStatus).toBe('paid')
  })

  it('rejects a request missing PayPal\'s own headers before ever checking the signature', async () => {
    const response = await POST(webhookRequest({ event_type: 'PAYMENT.CAPTURE.COMPLETED' }, { 'paypal-transmission-sig': '' }))

    expect(response.status).toBe(400)
    expect(verifyWebhookSignature).not.toHaveBeenCalled()
  })

  it('acknowledges but ignores an event type it does not act on', async () => {
    verifyWebhookSignature.mockResolvedValue(true)

    const response = await POST(webhookRequest({ event_type: 'CHECKOUT.ORDER.APPROVED', resource: {} }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ignored).toBe('CHECKOUT.ORDER.APPROVED')
  })

  it('acknowledges a capture event for an order it has no record of, rather than erroring', async () => {
    verifyWebhookSignature.mockResolvedValue(true)

    const response = await POST(webhookRequest(captureCompletedEvent(`ORDER-${randomUUID()}`, `CAP-${randomUUID()}`)))

    expect(response.status).toBe(200)
  })
})
