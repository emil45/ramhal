import { describe, expect, it } from 'vitest'

import { isPurchasable, selectNewBooks, sortCatalogue } from '@/lib/availability'

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

describe('sortCatalogue', () => {
  const purchasable = (title: string, publishedAt: string | null = null) => ({
    displayTitle: title,
    prices: [{ amount: 5000, currency: 'ILS' }],
    publishedAt,
  })
  const unpurchasable = (title: string, publishedAt: string | null = null) => ({
    displayTitle: title,
    prices: [{ amount: 0, currency: 'ILS' }],
    publishedAt,
  })

  it('places every purchasable-in-this-currency book before every other book', () => {
    const result = sortCatalogue([unpurchasable('א'), purchasable('ב'), unpurchasable('ג'), purchasable('ד')], 'ILS')
    expect(result.map((b) => b.displayTitle)).toEqual(['ב', 'ד', 'א', 'ג'])
  })

  it('orders each group by publication date, most recent first', () => {
    const result = sortCatalogue(
      [purchasable('ישן', '2020-01-01'), purchasable('חדש', '2024-01-01'), purchasable('בינוני', '2022-01-01')],
      'ILS',
    )
    expect(result.map((b) => b.displayTitle)).toEqual(['חדש', 'בינוני', 'ישן'])
  })

  it('sorts a book with no known publication date after every dated book in its group', () => {
    const result = sortCatalogue([purchasable('לא ידוע', null), purchasable('ידוע', '2020-01-01')], 'ILS')
    expect(result.map((b) => b.displayTitle)).toEqual(['ידוע', 'לא ידוע'])
  })

  it('falls back to title when dates tie, including two unknown dates', () => {
    const result = sortCatalogue([purchasable('ב'), purchasable('א')], 'ILS')
    expect(result.map((b) => b.displayTitle)).toEqual(['א', 'ב'])
  })

  it('does not mutate the input array', () => {
    const input = [purchasable('ב'), purchasable('א')]
    sortCatalogue(input, 'ILS')
    expect(input.map((b) => b.displayTitle)).toEqual(['ב', 'א'])
  })
})

describe('selectNewBooks', () => {
  const purchasable = (title: string, publishedAt: string | null) => ({
    displayTitle: title,
    prices: [{ amount: 5000, currency: 'ILS' }],
    publishedAt,
  })
  const unpurchasable = (title: string, publishedAt: string | null) => ({
    displayTitle: title,
    prices: [{ amount: 0, currency: 'ILS' }],
    publishedAt,
  })

  it('excludes books with no known publication date', () => {
    const result = selectNewBooks([purchasable('אין תאריך', null), purchasable('יש תאריך', '2024-01-01')], 'ILS', 6)
    expect(result.map((b) => b.displayTitle)).toEqual(['יש תאריך'])
  })

  it('excludes books not purchasable in this currency, even with a date', () => {
    const result = selectNewBooks([unpurchasable('לא למכירה', '2024-01-01'), purchasable('למכירה', '2023-01-01')], 'ILS', 6)
    expect(result.map((b) => b.displayTitle)).toEqual(['למכירה'])
  })

  it('orders most recently published first and respects the limit', () => {
    const result = selectNewBooks(
      [purchasable('ישן', '2020-01-01'), purchasable('חדש', '2024-01-01'), purchasable('בינוני', '2022-01-01')],
      'ILS',
      2,
    )
    expect(result.map((b) => b.displayTitle)).toEqual(['חדש', 'בינוני'])
  })
})
