import { describe, expect, it } from 'vitest'

import { formatPrice, roundMoney, selectPrice } from '@/lib/price'

describe('selectPrice', () => {
  it('returns the amount in the requested currency', () => {
    const book = { prices: [{ amount: 55, currency: 'ILS' }, { amount: 15, currency: 'EUR' }] }
    expect(selectPrice(book, 'ILS')).toBe(55)
    expect(selectPrice(book, 'EUR')).toBe(15)
  })

  it('returns null rather than falling back to a different currency', () => {
    const book = { prices: [{ amount: 55, currency: 'ILS' }] }
    expect(selectPrice(book, 'USD')).toBeNull()
  })

  it('returns null for a book with no prices at all', () => {
    expect(selectPrice({ prices: [] }, 'ILS')).toBeNull()
  })
})

describe('formatPrice', () => {
  it('formats a major-unit amount as a localized currency string', () => {
    expect(formatPrice(55, 'ILS', 'he')).toContain('55')
    expect(formatPrice(27, 'EUR', 'fr')).toContain('27')
    expect(formatPrice(8, 'USD', 'en')).toBe('$8.00')
  })

  it('keeps a real fraction of a unit', () => {
    expect(formatPrice(0.01, 'USD', 'en')).toBe('$0.01')
  })
})

describe('roundMoney', () => {
  it('rounds a float-arithmetic artifact back to two decimal places', () => {
    expect(roundMoney(19.99 * 3)).toBe(59.97)
  })

  it('leaves an already-exact amount unchanged', () => {
    expect(roundMoney(55)).toBe(55)
    expect(roundMoney(19.99)).toBe(19.99)
  })
})
