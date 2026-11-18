import { describe, expect, it } from 'vitest'

import { selectSale } from './salePrice'

describe('selectSale', () => {
  it('reports the selling price, the earlier price and the rounded saving', () => {
    const book = { prices: [{ currency: 'ILS', amount: 60, compareAtAmount: 90 }] }
    expect(selectSale(book, 'ILS')).toEqual({ amount: 60, compareAtAmount: 90, percentOff: 33 })
  })

  it('is no sale when no earlier price is recorded', () => {
    expect(selectSale({ prices: [{ currency: 'ILS', amount: 60 }] }, 'ILS')).toBeNull()
    expect(selectSale({ prices: [{ currency: 'ILS', amount: 60, compareAtAmount: null }] }, 'ILS')).toBeNull()
  })

  it('is no sale when the earlier price is not higher than the selling price', () => {
    expect(selectSale({ prices: [{ currency: 'ILS', amount: 60, compareAtAmount: 60 }] }, 'ILS')).toBeNull()
    expect(selectSale({ prices: [{ currency: 'ILS', amount: 60, compareAtAmount: 40 }] }, 'ILS')).toBeNull()
  })

  it('reads only the requested currency', () => {
    const book = {
      prices: [
        { currency: 'ILS', amount: 60, compareAtAmount: 90 },
        { currency: 'USD', amount: 20 },
      ],
    }
    expect(selectSale(book, 'USD')).toBeNull()
  })

  it('is no sale for a book with no price in the currency', () => {
    expect(selectSale({ prices: [{ currency: 'ILS', amount: 60, compareAtAmount: 90 }] }, 'EUR')).toBeNull()
  })
})
