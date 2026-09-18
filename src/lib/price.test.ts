import { describe, expect, it } from 'vitest'

import { formatPrice, selectPrice } from '@/lib/price'

describe('selectPrice', () => {
  it('returns the amount in the requested currency', () => {
    const book = { prices: [{ amount: 5500, currency: 'ILS' }, { amount: 1500, currency: 'EUR' }] }
    expect(selectPrice(book, 'ILS')).toBe(5500)
    expect(selectPrice(book, 'EUR')).toBe(1500)
  })

  it('returns null rather than falling back to a different currency', () => {
    const book = { prices: [{ amount: 5500, currency: 'ILS' }] }
    expect(selectPrice(book, 'USD')).toBeNull()
  })

  it('returns null for a book with no prices at all', () => {
    expect(selectPrice({ prices: [] }, 'ILS')).toBeNull()
  })
})

describe('formatPrice', () => {
  it('formats minor units as a localized currency string', () => {
    expect(formatPrice(5500, 'ILS', 'he')).toContain('55')
    expect(formatPrice(2700, 'EUR', 'fr')).toContain('27')
    expect(formatPrice(800, 'USD', 'en')).toBe('$8.00')
  })

  it('never displays a fractional minor-unit rounding artifact', () => {
    expect(formatPrice(1, 'USD', 'en')).toBe('$0.01')
  })
})
