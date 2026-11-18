import { isPurchasable, sortCatalogue } from '@/lib/books/availability'

import type { CatalogueBook } from '@/lib/books/booksData'
import type { Locale } from '@/lib/locale/locale'
import type { Currency } from '@/lib/shop/currency'

/** New books lead in catalogue order, then the editor's homepage choices.
 * The remaining shelf follows the visitor's language and existing lesson order. */
export function selectHomeBooks(
  books: CatalogueBook[],
  locale: Locale,
  currency: Currency,
  courseBookIds: number[],
  limit: number,
): CatalogueBook[] {
  const courseOrder = new Map<number, number>()
  courseBookIds.forEach((bookId, index) => {
    if (!courseOrder.has(bookId)) courseOrder.set(bookId, index)
  })

  return sortCatalogue(books, currency)
    .filter((book) => isPurchasable(book, currency))
    .sort((a, b) => {
      const newDifference = Number(b.markedNew === true) - Number(a.markedNew === true)
      if (newDifference) return newDifference
      // The "new" ribbon, catalogue and homepage must tell the same story.
      if (a.markedNew === true && b.markedNew === true) return 0

      const featuredDifference = Number(b.featuredOnHomepage === true) - Number(a.featuredOnHomepage === true)
      const languageDifference = Number(b.bookLanguage === locale) - Number(a.bookLanguage === locale)
      const publisherDifference = Number(b.fromInstitute !== false) - Number(a.fromInstitute !== false)
      const courseDifference =
        (courseOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (courseOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER)
      return featuredDifference || languageDifference || publisherDifference || courseDifference
    })
    .slice(0, limit)
}
