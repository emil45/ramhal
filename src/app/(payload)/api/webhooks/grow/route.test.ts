import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from './route'

const { applyPaymentConfirmation, confirmPayment, findOrderByProviderRef } = vi.hoisted(() => ({
  applyPaymentConfirmation: vi.fn(),
  confirmPayment: vi.fn(),
  findOrderByProviderRef: vi.fn(),
}))

vi.mock('@/lib/payment/orderPayment', () => ({ applyPaymentConfirmation, findOrderByProviderRef }))
vi.mock('@/lib/payment/growProvider', () => ({ GrowProvider: vi.fn(() => ({ confirmPayment })) }))

const SECRET = 'shared-secret'

function notification(body: unknown, headers: Record<string, string> = { 'x-ramhal-webhook-secret': SECRET }): Request {
  return new Request('https://site.example/api/webhooks/grow', { method: 'POST', headers, body: JSON.stringify(body) })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('GROW_CREATE_PAYMENT_URL', 'https://hook.example/create')
  vi.stubEnv('GROW_PAYMENT_STATUS_URL', 'https://hook.example/status')
  vi.stubEnv('GROW_WEBHOOK_SECRET', SECRET)
  vi.stubEnv('GROW_VAT_TYPE', 'exempt')
  vi.stubEnv('SERVER_URL', 'https://site.example')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/webhooks/grow', () => {
  it('answers 404 on a deployment where Grow is not configured', async () => {
    vi.stubEnv('GROW_WEBHOOK_SECRET', '')

    const response = await POST(notification({ processId: '1', processToken: 't' }))

    expect(response.status).toBe(404)
  })

  it('refuses a call without the shared secret, before touching any order', async () => {
    const response = await POST(notification({ processId: '1', processToken: 't' }, {}))

    expect(response.status).toBe(401)
    expect(findOrderByProviderRef).not.toHaveBeenCalled()
  })

  it('refuses a notification that cannot name a payment link', async () => {
    const response = await POST(notification({ processId: '1' }))

    expect(response.status).toBe(400)
  })

  it('acknowledges a payment link no order belongs to, so Make does not retry it', async () => {
    findOrderByProviderRef.mockResolvedValue(null)

    const response = await POST(notification({ processId: '1', processToken: 't' }))

    expect(response.status).toBe(200)
    expect(confirmPayment).not.toHaveBeenCalled()
  })

  it('asks Grow what happened, and settles the order with that answer, not with the notification', async () => {
    findOrderByProviderRef.mockResolvedValue({ id: 9 })
    confirmPayment.mockResolvedValue({ status: 'paid', providerEventId: 'grow-421100' })

    const response = await POST(notification({ processId: 23481, processToken: 'tok', statusCode: 2 }))

    expect(findOrderByProviderRef).toHaveBeenCalledWith('23481:tok')
    expect(confirmPayment).toHaveBeenCalledWith('23481:tok')
    expect(applyPaymentConfirmation).toHaveBeenCalledWith(9, { status: 'paid', providerEventId: 'grow-421100' })
    expect(await response.json()).toEqual({ ok: true, status: 'paid' })
  })
})
