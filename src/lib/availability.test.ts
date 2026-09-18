import { describe, expect, it } from 'vitest'

import { isPurchasable } from '@/lib/availability'

describe('isPurchasable', () => {
  it('is purchasable when a real, positive price exists in the currency', () => {
    expect(isPurchasable({ prices: [{ amount: 5500, currency: 'ILS' }] }, 'ILS')).toBe(true)
  })

  it('is not purchasable when no price exists in the currency', () => {
    expect(isPurchasable({ prices: [{ amount: 5500, currency: 'ILS' }] }, 'EUR')).toBe(false)
  })

  it('is not purchasable when the price in that currency is a real zero', () => {
    expect(isPurchasable({ prices: [{ amount: 0, currency: 'EUR' }] }, 'EUR')).toBe(false)
  })

  it('is not purchasable for a book with no prices at all', () => {
    expect(isPurchasable({ prices: [] }, 'ILS')).toBe(false)
  })
})
