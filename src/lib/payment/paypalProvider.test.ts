import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PayPalProvider } from '@/lib/payment/paypalProvider'

import type { PayPalConfig } from '@/lib/payment/paypalConfig'
import type { PayPalOrder } from '@/lib/payment/paypalClient'

const { captureOrder, createOrder, getAccessToken, getOrder, PayPalApiError } = vi.hoisted(() => ({
  captureOrder: vi.fn(),
  createOrder: vi.fn(),
  getAccessToken: vi.fn(),
  getOrder: vi.fn(),
  PayPalApiError: class PayPalApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly body: unknown,
    ) {
      super(message)
    }
  },
}))

vi.mock('@/lib/payment/paypalClient', () => ({ captureOrder, createOrder, getAccessToken, getOrder, PayPalApiError }))

const CONFIG: PayPalConfig = {
  apiBaseUrl: 'https://api-m.sandbox.paypal.com',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  webhookId: 'webhook-id',
}

function orderWithLinks(id: string, links: { href: string; rel: string }[]): PayPalOrder {
  return { id, links, status: 'CREATED' }
}

beforeEach(() => {
  vi.resetAllMocks()
  getAccessToken.mockResolvedValue('access-token')
})

describe('PayPalProvider.createPayment', () => {
  it('sends the order total in the order currency, never a different one', async () => {
    createOrder.mockResolvedValue(orderWithLinks('ORDER-1', [{ rel: 'approve', href: 'https://paypal.example/approve' }]))
    const provider = new PayPalProvider(CONFIG)

    await provider.createPayment({ orderNumber: 1, currency: 'EUR', total: 30.5, locale: 'fr', returnUrl: 'https://site.example/return' })

    expect(createOrder).toHaveBeenCalledWith(
      CONFIG,
      'access-token',
      expect.objectContaining({ amount: { currency_code: 'EUR', value: '30.50' } }),
    )
  })

  it('returns the approve link as redirectUrl and the order id as providerRef', async () => {
    createOrder.mockResolvedValue(
      orderWithLinks('ORDER-2', [
        { rel: 'self', href: 'https://api.example/orders/ORDER-2' },
        { rel: 'approve', href: 'https://paypal.example/approve/ORDER-2' },
      ]),
    )
    const provider = new PayPalProvider(CONFIG)

    const result = await provider.createPayment({ orderNumber: 2, currency: 'ILS', total: 55, locale: 'he', returnUrl: 'https://site.example/return' })

    expect(result).toEqual({ providerRef: 'ORDER-2', redirectUrl: 'https://paypal.example/approve/ORDER-2' })
  })

  it('points both return and cancel at the same URL, so confirmPayment is the single source of truth', async () => {
    createOrder.mockResolvedValue(orderWithLinks('ORDER-3', [{ rel: 'approve', href: 'https://paypal.example/approve' }]))
    const provider = new PayPalProvider(CONFIG)

    await provider.createPayment({ orderNumber: 3, currency: 'USD', total: 10, locale: 'en', returnUrl: 'https://site.example/return' })

    expect(createOrder).toHaveBeenCalledWith(
      CONFIG,
      'access-token',
      expect.objectContaining({ returnUrl: 'https://site.example/return' }),
    )
  })
})

describe('PayPalProvider.confirmPayment', () => {
  it('reads an already-completed capture without capturing again', async () => {
    getOrder.mockResolvedValue({
      id: 'ORDER-4',
      links: [],
      status: 'COMPLETED',
      purchase_units: [{ payments: { captures: [{ id: 'CAP-4', status: 'COMPLETED' }] } }],
    })
    const provider = new PayPalProvider(CONFIG)

    const result = await provider.confirmPayment('ORDER-4')

    expect(result).toEqual({ status: 'paid', providerEventId: 'CAP-4' })
    expect(captureOrder).not.toHaveBeenCalled()
  })

  it('captures an approved order and reports the fresh capture', async () => {
    getOrder.mockResolvedValue({ id: 'ORDER-5', links: [], status: 'APPROVED' })
    captureOrder.mockResolvedValue({
      id: 'ORDER-5',
      links: [],
      status: 'COMPLETED',
      purchase_units: [{ payments: { captures: [{ id: 'CAP-5', status: 'COMPLETED' }] } }],
    })
    const provider = new PayPalProvider(CONFIG)

    const result = await provider.confirmPayment('ORDER-5')

    expect(captureOrder).toHaveBeenCalledWith(CONFIG, 'access-token', 'ORDER-5')
    expect(result).toEqual({ status: 'paid', providerEventId: 'CAP-5' })
  })

  it('reports a refused capture as failed, with a synthesised event id', async () => {
    getOrder.mockResolvedValue({ id: 'ORDER-6', links: [], status: 'APPROVED' })
    captureOrder.mockRejectedValue(new PayPalApiError('declined', 422, { name: 'UNPROCESSABLE_ENTITY' }))
    const provider = new PayPalProvider(CONFIG)

    const result = await provider.confirmPayment('ORDER-6')

    expect(result).toEqual({ status: 'failed', providerEventId: 'paypal-decline-ORDER-6' })
  })

  it('reports a still-CREATED order as cancelled — the customer returned without approving', async () => {
    getOrder.mockResolvedValue({ id: 'ORDER-7', links: [], status: 'CREATED' })
    const provider = new PayPalProvider(CONFIG)

    const result = await provider.confirmPayment('ORDER-7')

    expect(result).toEqual({ status: 'cancelled', providerEventId: 'paypal-cancel-ORDER-7' })
    expect(captureOrder).not.toHaveBeenCalled()
  })

  it('is idempotent across repeated calls for the same still-CREATED order', async () => {
    getOrder.mockResolvedValue({ id: 'ORDER-8', links: [], status: 'CREATED' })
    const provider = new PayPalProvider(CONFIG)

    const first = await provider.confirmPayment('ORDER-8')
    const second = await provider.confirmPayment('ORDER-8')

    expect(first).toEqual(second)
  })
})
