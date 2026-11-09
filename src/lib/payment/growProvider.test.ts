import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GrowProvider } from '@/lib/payment/growProvider'

import type { GrowConfig } from '@/lib/payment/growConfig'
import type { PaymentRequest } from '@/lib/payment/paymentProvider'

const { postToGrowGateway } = vi.hoisted(() => ({ postToGrowGateway: vi.fn() }))

vi.mock('@/lib/payment/growClient', () => ({ postToGrowGateway }))

const CONFIG: GrowConfig = {
  createPaymentUrl: 'https://hook.example/create',
  paymentStatusUrl: 'https://hook.example/status',
  webhookSecret: 'secret',
  vatType: 'regular',
  siteUrl: 'https://www.ramhal.com',
}

const REQUEST: PaymentRequest = {
  orderNumber: 7,
  currency: 'ILS',
  total: 55,
  locale: 'he',
  returnUrl: '/checkout/return/token-7',
  payer: { name: 'ישראל ישראלי', email: 'buyer@example.com', phone: '050-123-4567' },
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('GrowProvider.createPayment', () => {
  it('asks the create scenario for a link and returns its page as the redirect', async () => {
    postToGrowGateway.mockResolvedValue({ processId: 23481, processToken: 'tok', paymentUrl: 'https://grow.link/pay' })

    const creation = await new GrowProvider(CONFIG).createPayment(REQUEST)

    expect(creation).toEqual({ providerRef: '23481:tok', redirectUrl: 'https://grow.link/pay' })
    expect(postToGrowGateway).toHaveBeenCalledWith(
      CONFIG,
      CONFIG.createPaymentUrl,
      expect.objectContaining({
        orderNumber: 7,
        amount: 55,
        successUrl: 'https://www.ramhal.com/checkout/return/token-7',
        payer: { fullName: 'ישראל ישראלי', phone: '0501234567', email: 'buyer@example.com' },
      }),
    )
  })

  it('refuses an order that is not in shekels without calling Grow', async () => {
    await expect(new GrowProvider(CONFIG).createPayment({ ...REQUEST, currency: 'EUR' })).rejects.toThrow(/shekels only/)

    expect(postToGrowGateway).not.toHaveBeenCalled()
  })

  it('refuses a payer Grow would reject without calling Grow', async () => {
    const payer = { ...REQUEST.payer, phone: '+33 6 12 34 56 78' }

    await expect(new GrowProvider(CONFIG).createPayment({ ...REQUEST, payer })).rejects.toThrow(/Israeli mobile number/)

    expect(postToGrowGateway).not.toHaveBeenCalled()
  })

  it('fails when the scenario answers without a payment link', async () => {
    postToGrowGateway.mockResolvedValue({ error: 'Grow said no' })

    await expect(new GrowProvider(CONFIG).createPayment(REQUEST)).rejects.toThrow(/lacks processId/)
  })
})

describe('GrowProvider.confirmPayment', () => {
  it('asks the status scenario about the payment link the reference names', async () => {
    postToGrowGateway.mockResolvedValue({ statusCode: 2, transactionId: 421100 })

    const confirmation = await new GrowProvider(CONFIG).confirmPayment('23481:tok')

    expect(postToGrowGateway).toHaveBeenCalledWith(CONFIG, CONFIG.paymentStatusUrl, { processId: '23481', processToken: 'tok' })
    expect(confirmation).toEqual({ status: 'paid', providerEventId: 'grow-421100' })
  })

  it('stays pending while Grow reports the payment link unpaid', async () => {
    postToGrowGateway.mockResolvedValue({ statusCode: 0 })

    expect(await new GrowProvider(CONFIG).confirmPayment('23481:tok')).toEqual({ status: 'pending' })
  })
})
