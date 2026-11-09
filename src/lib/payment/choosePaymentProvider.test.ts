import { describe, expect, it } from 'vitest'

import { choosePaymentProviderName } from '@/lib/payment/choosePaymentProvider'

import type { PaymentChoiceInput } from '@/lib/payment/choosePaymentProvider'

const ISRAELI_SHEKEL_ORDER: PaymentChoiceInput = { currency: 'ILS', destinationCountry: 'IL', payer: { name: 'ישראל ישראלי', email: 'buyer@example.com', phone: '050-123-4567' } }

describe('choosePaymentProviderName', () => {
  describe('with Grow and PayPal both enabled', () => {
    const enabled = ['grow', 'paypal'] as const

    it('sends a shekel order to Israel from an Israeli mobile to Grow', () => {
      expect(choosePaymentProviderName(enabled, ISRAELI_SHEKEL_ORDER)).toBe('grow')
    })

    it('sends an order in euros to PayPal, because Grow settles shekels only', () => {
      expect(choosePaymentProviderName(enabled, { ...ISRAELI_SHEKEL_ORDER, currency: 'EUR' })).toBe('paypal')
    })

    it('sends a shekel order shipping abroad to PayPal', () => {
      expect(choosePaymentProviderName(enabled, { ...ISRAELI_SHEKEL_ORDER, destinationCountry: 'US' })).toBe('paypal')
    })

    it('sends a payer without an Israeli mobile number to PayPal, since Grow would refuse the number', () => {
      const payer = { ...ISRAELI_SHEKEL_ORDER.payer, phone: '+33 6 12 34 56 78' }
      expect(choosePaymentProviderName(enabled, { ...ISRAELI_SHEKEL_ORDER, payer })).toBe('paypal')
    })

    it('sends a payer who typed a single name to PayPal, since Grow would refuse the name', () => {
      const payer = { ...ISRAELI_SHEKEL_ORDER.payer, name: 'ישראלי' }
      expect(choosePaymentProviderName(enabled, { ...ISRAELI_SHEKEL_ORDER, payer })).toBe('paypal')
    })
  })

  it('uses PayPal for everything when it is the only provider', () => {
    expect(choosePaymentProviderName(['paypal'], ISRAELI_SHEKEL_ORDER)).toBe('paypal')
  })

  it('uses the mock for everything when it is the only provider', () => {
    expect(choosePaymentProviderName(['mock'], { ...ISRAELI_SHEKEL_ORDER, currency: 'USD' })).toBe('mock')
  })

  it('fails rather than guess when the only provider cannot take the order', () => {
    expect(() => choosePaymentProviderName(['grow'], { ...ISRAELI_SHEKEL_ORDER, currency: 'EUR' })).toThrow(/No enabled payment provider.*EUR/)
  })
})
