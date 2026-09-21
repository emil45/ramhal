import { describe, expect, it } from 'vitest'

import { paginateCatalogue, sortCatalogueView } from '@/lib/catalogueView'

const book = (title: string, amount?: number) => ({
  prices: amount === undefined ? [] : [{ amount, currency: 'ILS' }],
  title,
})

describe('sortCatalogueView', () => {
  const entries = [book('ג', 3000), book('א', 5000), book('ב')]

  it('preserves the server-provided order by default', () => {
    expect(sortCatalogueView(entries, 'default', 'ILS', 'he')).toBe(entries)
  })

  it('sorts titles using the active locale', () => {
    expect(sortCatalogueView(entries, 'title', 'ILS', 'he').map((entry) => entry.title)).toEqual(['א', 'ב', 'ג'])
  })

  it('sorts prices in either direction and leaves missing prices last', () => {
    expect(sortCatalogueView(entries, 'price-ascending', 'ILS', 'he').map((entry) => entry.title)).toEqual(['ג', 'א', 'ב'])
    expect(sortCatalogueView(entries, 'price-descending', 'ILS', 'he').map((entry) => entry.title)).toEqual(['א', 'ג', 'ב'])
  })

  it('does not mutate the source list', () => {
    sortCatalogueView(entries, 'title', 'ILS', 'he')
    expect(entries.map((entry) => entry.title)).toEqual(['ג', 'א', 'ב'])
  })
})

describe('paginateCatalogue', () => {
  const entries = Array.from({ length: 45 }, (_, index) => index + 1)

  it('returns the requested page and one-based visible range', () => {
    expect(paginateCatalogue(entries, 2, 20)).toEqual({
      end: 40,
      items: entries.slice(20, 40),
      page: 2,
      start: 21,
      totalItems: 45,
      totalPages: 3,
    })
  })

  it('clamps stale and invalid page numbers', () => {
    expect(paginateCatalogue(entries, 99, 20).page).toBe(3)
    expect(paginateCatalogue(entries, -4, 20).page).toBe(1)
    expect(paginateCatalogue(entries, Number.NaN, 20).page).toBe(1)
  })

  it('represents an empty result as page 1 of 1 with an empty range', () => {
    expect(paginateCatalogue([], 1, 20)).toEqual({
      end: 0,
      items: [],
      page: 1,
      start: 0,
      totalItems: 0,
      totalPages: 1,
    })
  })

  it('rejects an invalid page size', () => {
    expect(() => paginateCatalogue(entries, 1, 0)).toThrow('positive integer')
  })
})
