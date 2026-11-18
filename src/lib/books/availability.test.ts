import { describe, expect, it } from 'vitest'

import { isPurchasable, selectFeaturedBooks, selectNewBooks, sortCatalogue } from '@/lib/books/availability'

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

  it('puts books marked new first within their group, ahead of newer unmarked books', () => {
    const result = sortCatalogue(
      [
        purchasable('חדש בשוק', '2024-01-01'),
        { ...purchasable('מסומן ישן', '2020-01-01'), markedNew: true },
        { ...unpurchasable('מסומן אך לא למכירה'), markedNew: true },
        unpurchasable('לא למכירה'),
      ],
      'ILS',
    )
    expect(result.map((b) => b.displayTitle)).toEqual(['מסומן ישן', 'חדש בשוק', 'מסומן אך לא למכירה', 'לא למכירה'])
  })

  it('does not mutate the input array', () => {
    const input = [purchasable('ב'), purchasable('א')]
    sortCatalogue(input, 'ILS')
    expect(input.map((b) => b.displayTitle)).toEqual(['ב', 'א'])
  })
})

describe('selectNewBooks', () => {
  const marked = (title: string, publishedAt: string | null = null, amount = 5000) => ({
    displayTitle: title,
    prices: [{ amount, currency: 'ILS' }],
    publishedAt,
    markedNew: true,
  })
  const unmarked = (title: string, publishedAt: string | null = null) => ({ ...marked(title, publishedAt), markedNew: false })

  it('includes only books an editor marked new, whatever their publication date', () => {
    const result = selectNewBooks([unmarked('לא מסומן', '2024-01-01'), marked('מסומן ללא תאריך')], 'ILS', 6)
    expect(result.map((b) => b.displayTitle)).toEqual(['מסומן ללא תאריך'])
  })

  it('excludes marked books not purchasable in this currency', () => {
    const result = selectNewBooks([marked('לא למכירה', '2024-01-01', 0), marked('למכירה', '2023-01-01')], 'ILS', 6)
    expect(result.map((b) => b.displayTitle)).toEqual(['למכירה'])
  })

  it('orders most recently published first and respects the limit', () => {
    const result = selectNewBooks([marked('ישן', '2020-01-01'), marked('חדש', '2024-01-01'), marked('בינוני', '2022-01-01')], 'ILS', 2)
    expect(result.map((b) => b.displayTitle)).toEqual(['חדש', 'בינוני'])
  })
})

describe('selectFeaturedBooks', () => {
  const book = (title: string, options: { amount?: number; cover?: unknown } = {}) => ({
    displayTitle: title,
    prices: [{ amount: options.amount ?? 5000, currency: 'ILS' }],
    cover: options.cover ?? null,
  })
  const scan = { url: '/cover.jpg' }

  it('features only books that can be bought in the currency', () => {
    const result = selectFeaturedBooks([book('א', { amount: 0 }), book('ב')], 'ILS', 6)
    expect(result.map((b) => b.displayTitle)).toEqual(['ב'])
  })

  it('puts books with a scanned cover ahead of typeset ones, keeping the given order within each', () => {
    const result = selectFeaturedBooks([book('א'), book('ב', { cover: scan }), book('ג'), book('ד', { cover: scan })], 'ILS', 6)
    expect(result.map((b) => b.displayTitle)).toEqual(['ב', 'ד', 'א', 'ג'])
  })

  it('does not treat an unresolved cover id as a scanned cover', () => {
    const result = selectFeaturedBooks([book('א'), book('ב', { cover: 17 })], 'ILS', 6)
    expect(result.map((b) => b.displayTitle)).toEqual(['א', 'ב'])
  })

  it('stops at the limit', () => {
    expect(selectFeaturedBooks([book('א'), book('ב'), book('ג')], 'ILS', 2)).toHaveLength(2)
  })
})
