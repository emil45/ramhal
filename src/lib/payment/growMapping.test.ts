import { describe, expect, it } from 'vitest'

import {
  buildGrowCreatePaymentBody,
  confirmationFromGrowStatus,
  decodeGrowReference,
  encodeGrowReference,
  parseGrowPaymentLink,
  parseGrowPaymentNotification,
  parseGrowPaymentStatus,
} from '@/lib/payment/growMapping'

import type { GrowConfig } from '@/lib/payment/growConfig'
import type { PaymentRequest } from '@/lib/payment/paymentProvider'

const CONFIG: GrowConfig = {
  createPaymentUrl: 'https://hook.example/create',
  paymentStatusUrl: 'https://hook.example/status',
  webhookSecret: 'secret',
  vatType: 'exempt',
  siteUrl: 'https://www.ramhal.com',
}

const REQUEST: PaymentRequest = {
  orderNumber: 42,
  currency: 'ILS',
  total: 99.9,
  locale: 'he',
  returnUrl: '/checkout/return/abc-123',
  payer: { name: 'ישראל ישראלי', email: 'buyer@example.com', phone: '0501234567' },
}

const PAYER = { fullName: 'ישראל ישראלי', phone: '0501234567', email: 'buyer@example.com' }

describe('buildGrowCreatePaymentBody', () => {
  it('turns the return path into an address on this site, so Grow can send the customer back', () => {
    expect(buildGrowCreatePaymentBody(REQUEST, PAYER, CONFIG).successUrl).toBe('https://www.ramhal.com/checkout/return/abc-123')
  })

  it('keeps an absolute return address as it is', () => {
    const request = { ...REQUEST, returnUrl: 'https://other.example/return' }

    expect(buildGrowCreatePaymentBody(request, PAYER, CONFIG).successUrl).toBe('https://other.example/return')
  })

  it('titles the payment page with the order number and no punctuation, which Grow rejects', () => {
    const { title } = buildGrowCreatePaymentBody(REQUEST, PAYER, CONFIG)

    expect(title).toContain('42')
    expect(title).not.toMatch(/[^\p{L}\p{N} ]/u)
  })

  it('charges the order total and carries the configured VAT type', () => {
    expect(buildGrowCreatePaymentBody(REQUEST, PAYER, CONFIG)).toMatchObject({ orderNumber: 42, amount: 99.9, vatType: 'exempt', payer: PAYER })
  })
})

describe('Grow payment reference', () => {
  it('round-trips the two values Grow identifies a payment link by', () => {
    const reference = encodeGrowReference({ processId: '23481', processToken: '9ee3720005a0671c' })

    expect(decodeGrowReference(reference)).toEqual({ processId: '23481', processToken: '9ee3720005a0671c' })
  })

  it.each(['23481', '23481:', ':token', 'a:b:c', ''])('refuses "%s", which is not a reference', (reference) => {
    expect(() => decodeGrowReference(reference)).toThrow(/not a Grow payment reference/)
  })
})

describe('parseGrowPaymentLink', () => {
  it('reads the link, accepting identifiers Make renders as numbers', () => {
    expect(parseGrowPaymentLink({ processId: 23481, processToken: 'tok', paymentUrl: 'https://grow.link/x' })).toEqual({
      processId: '23481',
      processToken: 'tok',
      paymentUrl: 'https://grow.link/x',
    })
  })

  it.each([null, 'text', {}, { processId: '1', processToken: 't' }])('refuses a response without a complete link: %j', (body) => {
    expect(() => parseGrowPaymentLink(body)).toThrow(/lacks processId, processToken or paymentUrl/)
  })
})

describe('parseGrowPaymentNotification', () => {
  it('names the payment link the notification is about, in the form the order stores it', () => {
    expect(parseGrowPaymentNotification({ processId: 23481, processToken: 'tok' })).toBe('23481:tok')
  })

  it.each([null, {}, { processId: '1' }, { processToken: 't' }])('refuses a notification that cannot name a payment link: %j', (body) => {
    expect(() => parseGrowPaymentNotification(body)).toThrow(/lacks processId or processToken/)
  })
})

describe('parseGrowPaymentStatus', () => {
  it('reads the status code and the transaction id when there is one', () => {
    expect(parseGrowPaymentStatus({ statusCode: 2, transactionId: '421100' })).toEqual({ statusCode: '2', transactionId: '421100' })
    expect(parseGrowPaymentStatus({ statusCode: '0' })).toEqual({ statusCode: '0', transactionId: null })
  })

  it('refuses a response without a status code', () => {
    expect(() => parseGrowPaymentStatus({ transactionId: '1' })).toThrow(/lacks statusCode/)
  })
})

describe('confirmationFromGrowStatus', () => {
  const REFERENCE = '23481:tok'

  it('reports a paid payment under its transaction id, which makes a repeat harmless', () => {
    expect(confirmationFromGrowStatus(REFERENCE, { statusCode: '2', transactionId: '421100' })).toEqual({
      status: 'paid',
      providerEventId: 'grow-421100',
    })
  })

  it('refuses to call a payment paid without a transaction to point at', () => {
    expect(() => confirmationFromGrowStatus(REFERENCE, { statusCode: '2', transactionId: null })).toThrow(/without a transaction id/)
  })

  it('reports a denied payment as failed', () => {
    expect(confirmationFromGrowStatus(REFERENCE, { statusCode: '9', transactionId: '7' })).toEqual({
      status: 'failed',
      providerEventId: 'grow-denied-7',
    })
  })

  it('reports a payment cancelled before transmission as cancelled', () => {
    expect(confirmationFromGrowStatus(REFERENCE, { statusCode: '4', transactionId: '8' })).toEqual({
      status: 'cancelled',
      providerEventId: 'grow-cancelled-8',
    })
  })

  it('derives a stable event id from the reference when a failure has no transaction', () => {
    const first = confirmationFromGrowStatus(REFERENCE, { statusCode: '4', transactionId: null })
    const again = confirmationFromGrowStatus(REFERENCE, { statusCode: '4', transactionId: null })

    expect(first).toEqual(again)
  })

  it.each(['0', '3', '6'])('treats status %s as no final answer yet', (statusCode) => {
    expect(confirmationFromGrowStatus(REFERENCE, { statusCode, transactionId: null })).toEqual({ status: 'pending' })
  })

  it('fails loudly on a status code it does not know, instead of guessing', () => {
    expect(() => confirmationFromGrowStatus(REFERENCE, { statusCode: '77', transactionId: null })).toThrow(/unknown status code "77"/)
  })
})
