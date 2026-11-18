import { describe, expect, it } from 'vitest'

import { sortCatalogue } from '@/lib/books/availability'
import { selectHomeBooks } from '@/lib/books/homeBooks'

import type { CatalogueBook } from '@/lib/books/booksData'

function book(id: number, overrides: Partial<CatalogueBook> = {}): CatalogueBook {
  return {
    id,
    displayTitle: `Book ${id}`,
    urlSlug: `book-${id}`,
    bookLanguage: 'he',
    prices: [{ currency: 'ILS', amount: 50 }],
    category: null,
    hasColors: false,
    ...overrides,
  }
}

const ids = (books: CatalogueBook[]) => books.map((item) => item.id)

describe('the homepage book selection', () => {
  it('shows new books before editor-featured books, then fills from the remaining catalogue', () => {
    const books = [
      book(1),
      book(2, { featuredOnHomepage: true }),
      book(3, { markedNew: true }),
      book(4, { markedNew: true, featuredOnHomepage: true }),
      book(5, { featuredOnHomepage: true }),
    ]
    expect(ids(selectHomeBooks(books, 'he', 'ILS', [1], 8))).toEqual([3, 4, 2, 5, 1])
    expect(ids(books)).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps all new books first, including other languages and publishers, in catalogue order', () => {
    const books = [
      book(1, { markedNew: true }),
      book(2, { markedNew: true, bookLanguage: 'fr', fromInstitute: false, publishedAt: '2026-11-18' }),
      book(3, { featuredOnHomepage: true }),
    ]
    const selected = selectHomeBooks(books, 'he', 'ILS', [1, 3], 6)
    expect(selected.slice(0, 2)).toEqual(sortCatalogue(books.filter((item) => item.markedNew), 'ILS'))
    expect(ids(selected)).toEqual([2, 1, 3])
  })

  it('prioritizes explicit homepage choices over language and publisher defaults', () => {
    const books = [book(1), book(2, { featuredOnHomepage: true, bookLanguage: 'fr', fromInstitute: false })]
    expect(ids(selectHomeBooks(books, 'he', 'ILS', [1], 6))).toEqual([2, 1])
  })

  it('fills the remaining shelf with the visitor’s language, institute editions and first lesson occurrence', () => {
    const books = [book(1, { bookLanguage: 'fr' }), book(2, { fromInstitute: false }), book(3), book(4)]
    expect(ids(selectHomeBooks(books, 'he', 'ILS', [4, 3, 4], 6))).toEqual([4, 3, 2, 1])
  })

  it('excludes books without a positive local price even when they are new or featured', () => {
    const books = [
      book(1),
      book(2),
      book(3, { markedNew: true, prices: [{ currency: 'EUR', amount: 30 }] }),
      book(4, { featuredOnHomepage: true, prices: [{ currency: 'ILS', amount: 0 }] }),
    ]
    expect(ids(selectHomeBooks(books, 'he', 'ILS', [2, 1, 3], 6))).toEqual([2, 1])
  })

  it('falls back to available languages, supports more than four books, and respects the limit', () => {
    const books = Array.from({ length: 8 }, (_, index) => book(index + 1))
    expect(ids(selectHomeBooks(books, 'en', 'ILS', [], 6))).toEqual([1, 2, 3, 4, 5, 6])
  })
})
