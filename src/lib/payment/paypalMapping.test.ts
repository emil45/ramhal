import { describe, expect, it } from 'vitest'

import {
  cancelledConfirmation,
  captureIdFromEvent,
  confirmationFromCapture,
  declinedConfirmation,
  orderIdFromCaptureEvent,
  toPayPalAmount,
  toPayPalLocale,
  verdictForEventType,
} from '@/lib/payment/paypalMapping'

describe('toPayPalAmount', () => {
  // The gate requires ILS and at least one other currency — this is the one
  // place an amount could silently cross currencies.
  it.each([
    ['ILS', 55, { currency_code: 'ILS', value: '55.00' }],
    ['EUR', 30.5, { currency_code: 'EUR', value: '30.50' }],
    ['USD', 19.99, { currency_code: 'USD', value: '19.99' }],
  ] as const)('formats %s as a two-decimal string, never a float', (currency, amount, expected) => {
    expect(toPayPalAmount(currency, amount)).toEqual(expected)
  })

  it('rounds to the currency subunit rather than truncating', () => {
    expect(toPayPalAmount('ILS', 10.005).value).toBe('10.01')
  })
})

describe('toPayPalLocale', () => {
  it('swaps the BCP-47 hyphen for PayPal\'s underscore', () => {
    expect(toPayPalLocale('he-IL')).toBe('he_IL')
    expect(toPayPalLocale('en-US')).toBe('en_US')
    expect(toPayPalLocale('fr-FR')).toBe('fr_FR')
  })
})

describe('confirmationFromCapture', () => {
  it('maps a completed capture to paid, carrying the real capture id', () => {
    expect(confirmationFromCapture({ id: 'CAP-1', status: 'COMPLETED' })).toEqual({ status: 'paid', providerEventId: 'CAP-1' })
  })

  it('maps a declined capture to failed, carrying the real capture id', () => {
    expect(confirmationFromCapture({ id: 'CAP-2', status: 'DECLINED' })).toEqual({ status: 'failed', providerEventId: 'CAP-2' })
  })

  it('treats any other capture status as still pending rather than guessing', () => {
    expect(confirmationFromCapture({ id: 'CAP-3', status: 'PENDING' })).toEqual({ status: 'pending' })
  })
})

describe('cancelledConfirmation / declinedConfirmation', () => {
  it('synthesise the same event id for the same order every time — idempotent by construction', () => {
    expect(cancelledConfirmation('ORDER-1')).toEqual(cancelledConfirmation('ORDER-1'))
    expect(declinedConfirmation('ORDER-1')).toEqual(declinedConfirmation('ORDER-1'))
  })

  it('never collide with each other for the same order', () => {
    expect(cancelledConfirmation('ORDER-1')).not.toEqual(declinedConfirmation('ORDER-1'))
  })
})

describe('verdictForEventType', () => {
  it('acts only on the two capture outcome events', () => {
    expect(verdictForEventType('PAYMENT.CAPTURE.COMPLETED')).toBe('paid')
    expect(verdictForEventType('PAYMENT.CAPTURE.DENIED')).toBe('failed')
  })

  it('ignores every other event type', () => {
    expect(verdictForEventType('CHECKOUT.ORDER.APPROVED')).toBeNull()
    expect(verdictForEventType('PAYMENT.CAPTURE.REFUNDED')).toBeNull()
  })
})

describe('captureIdFromEvent / orderIdFromCaptureEvent', () => {
  const event = {
    resource: { id: 'CAP-9', supplementary_data: { related_ids: { order_id: 'ORDER-9' } } },
  }

  it('reads the capture id from resource.id', () => {
    expect(captureIdFromEvent(event)).toBe('CAP-9')
  })

  it('reads the order id from supplementary_data, not resource.id', () => {
    expect(orderIdFromCaptureEvent(event)).toBe('ORDER-9')
  })

  it('returns null rather than throwing on a malformed event', () => {
    expect(captureIdFromEvent({})).toBeNull()
    expect(orderIdFromCaptureEvent({ resource: {} })).toBeNull()
  })
})
