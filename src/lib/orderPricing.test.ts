import { describe, expect, it } from 'vitest'

import { countriesServedInCurrency, priceOrder } from '@/lib/orderPricing'

import type { PricingBook } from '@/lib/orderPricing'
import type { ShippingZone } from '@/lib/shipping'

const zones: ShippingZone[] = [
  {
    name: 'ישראל',
    countries: ['IL'],
    currency: 'ILS',
    tiers: [{ minUnits: 0, amount: 3000 }],
    freeAboveUnits: 10,
    allowPickup: true,
    isDefault: false,
  },
  {
    name: 'אירופה',
    countries: ['FR', 'BE'],
    currency: 'EUR',
    tiers: [{ minUnits: 0, amount: 5000 }],
    freeAboveUnits: 10,
    allowPickup: false,
    isDefault: false,
  },
  {
    name: 'שאר העולם',
    countries: ['US'],
    currency: 'USD',
    tiers: [{ minUnits: 0, amount: 8600 }],
    freeAboveUnits: 10,
    allowPickup: false,
    isDefault: true,
  },
]

const book = (overrides: Partial<PricingBook> = {}): PricingBook => ({
  id: 1,
  title: 'מסילת ישרים',
  prices: [{ amount: 5500, currency: 'ILS' }, { amount: 1800, currency: 'EUR' }],
  shippingUnits: 1,
  inStock: true,
  ...overrides,
})

const israelDelivery = { currency: 'ILS', destinationCountry: 'IL', isPickup: false, zones } as const

describe('priceOrder', () => {
  it('snapshots each line at the current price, in the order currency', () => {
    const result = priceOrder({ ...israelDelivery, lines: [{ book: book(), quantity: 2 }] })

    expect(result).toMatchObject({
      ok: true,
      order: {
        currency: 'ILS',
        lines: [{ bookId: 1, title: 'מסילת ישרים', unitPrice: 5500, currency: 'ILS', quantity: 2, shippingUnits: 1 }],
      },
    })
  })

  it('adds the destination zone shipping to the subtotal', () => {
    const result = priceOrder({ ...israelDelivery, lines: [{ book: book(), quantity: 2 }] })

    expect(result).toMatchObject({ ok: true, order: { subtotal: 11000, shippingCost: 3000, total: 14000, shippingZone: 'ישראל' } })
  })

  it('counts shipping units, not lines, against the free-shipping threshold', () => {
    const result = priceOrder({ ...israelDelivery, lines: [{ book: book({ shippingUnits: 5 }), quantity: 2 }] })

    expect(result).toMatchObject({ ok: true, order: { shippingCost: 0, total: 11000 } })
  })

  it('makes self-pickup free in a zone that allows it', () => {
    const result = priceOrder({ ...israelDelivery, isPickup: true, lines: [{ book: book(), quantity: 1 }] })

    expect(result).toMatchObject({ ok: true, order: { isPickup: true, shippingCost: 0, total: 5500 } })
  })

  it('refuses self-pickup where the zone does not allow it', () => {
    const result = priceOrder({
      currency: 'EUR',
      destinationCountry: 'FR',
      isPickup: true,
      lines: [{ book: book(), quantity: 1 }],
      zones,
    })

    expect(result).toEqual({ ok: false, problem: { kind: 'pickup-not-available' } })
  })

  it('refuses a destination whose zone is priced in another currency', () => {
    const result = priceOrder({ ...israelDelivery, destinationCountry: 'FR', lines: [{ book: book(), quantity: 1 }] })

    expect(result).toEqual({ ok: false, problem: { kind: 'destination-not-served' } })
  })

  it('refuses a country no zone lists, even where a default zone exists', () => {
    const result = priceOrder({
      currency: 'USD',
      destinationCountry: 'AR',
      isPickup: false,
      lines: [{ book: book({ prices: [{ amount: 2000, currency: 'USD' }] }), quantity: 1 }],
      zones,
    })

    expect(result).toEqual({ ok: false, problem: { kind: 'destination-not-served' } })
  })

  it('names the book that is no longer purchasable in this currency', () => {
    const result = priceOrder({
      ...israelDelivery,
      lines: [{ book: book({ title: 'אדיר במרום', prices: [{ amount: 1800, currency: 'EUR' }] }), quantity: 1 }],
    })

    expect(result).toEqual({ ok: false, problem: { kind: 'book-not-purchasable', bookTitle: 'אדיר במרום' } })
  })

  it('treats a real zero price as not purchasable, never free', () => {
    const result = priceOrder({
      ...israelDelivery,
      lines: [{ book: book({ prices: [{ amount: 0, currency: 'ILS' }] }), quantity: 1 }],
    })

    expect(result).toMatchObject({ ok: false, problem: { kind: 'book-not-purchasable' } })
  })

  it('names the book that is out of stock', () => {
    const result = priceOrder({ ...israelDelivery, lines: [{ book: book({ inStock: false }), quantity: 1 }] })

    expect(result).toEqual({ ok: false, problem: { kind: 'book-out-of-stock', bookTitle: 'מסילת ישרים' } })
  })

  it('refuses an empty cart', () => {
    expect(priceOrder({ ...israelDelivery, lines: [] })).toEqual({ ok: false, problem: { kind: 'empty-cart' } })
  })
})

describe('countriesServedInCurrency', () => {
  it('lists only the countries of zones priced in that currency', () => {
    expect(countriesServedInCurrency(zones, 'EUR')).toEqual(['FR', 'BE'])
    expect(countriesServedInCurrency(zones, 'ILS')).toEqual(['IL'])
  })
})
