import { describe, expect, it } from 'vitest'

import { cartSubtotal, cartUnits, unitsUntilFreeShipping } from '@/lib/cart'

const book = (amount: number, currency: string, shippingUnits = 1) => ({
  prices: [{ amount, currency }],
  shippingUnits,
})

describe('cartUnits', () => {
  it('sums shippingUnits across quantities, not line count', () => {
    const lines = [
      { book: book(5500, 'ILS', 2), quantity: 3 }, // 6 units
      { book: book(3000, 'ILS', 1), quantity: 1 }, // 1 unit
    ]
    expect(cartUnits(lines)).toBe(7)
  })
})

describe('cartSubtotal', () => {
  it('sums price × quantity in the requested currency', () => {
    const lines = [
      { book: book(5500, 'ILS'), quantity: 2 },
      { book: book(3000, 'ILS'), quantity: 1 },
    ]
    expect(cartSubtotal(lines, 'ILS')).toBe(5500 * 2 + 3000)
  })

  it('contributes 0 for a line with no price in that currency', () => {
    const lines = [{ book: book(5500, 'ILS'), quantity: 2 }]
    expect(cartSubtotal(lines, 'EUR')).toBe(0)
  })
})

describe('unitsUntilFreeShipping', () => {
  it('counts down toward the threshold', () => {
    expect(unitsUntilFreeShipping({ freeAboveUnits: 10 }, 2)).toBe(8)
  })

  it('reaches exactly the threshold after adding the remaining units, per the definition of done', () => {
    // "adding two books, then eight more, shows the threshold being crossed"
    expect(unitsUntilFreeShipping({ freeAboveUnits: 10 }, 2)).toBe(8)
    expect(unitsUntilFreeShipping({ freeAboveUnits: 10 }, 10)).toBe(0)
  })

  it('never goes negative once past the threshold', () => {
    expect(unitsUntilFreeShipping({ freeAboveUnits: 10 }, 15)).toBe(0)
  })

  it('is null when the zone has no free-shipping threshold', () => {
    expect(unitsUntilFreeShipping({ freeAboveUnits: null }, 5)).toBeNull()
  })
})
