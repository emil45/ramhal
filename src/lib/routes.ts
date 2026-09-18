import type { Locale } from '@/lib/locale'

// The word "book" in each locale's own language, used as the book-page path
// segment — Hebrew's is literally /ספר/<slug> (see
// docs/tasks/TASK-06-storefront.md §2). Adding a fourth locale means adding
// one entry here.
export const BOOK_SEGMENT: Record<Locale, string> = { he: 'ספר', en: 'book', fr: 'livre' }

// The catalogue's own path segment, plural of BOOK_SEGMENT — /ספרים,
// /en/books, /fr/livres (docs/tasks/TASK-07-storefront.md §B). Uses the same
// [bookWord] dynamic segment the book-page route already matches on, so a
// fourth locale still only needs one entry here and one in BOOK_SEGMENT.
export const CATALOGUE_SEGMENT: Record<Locale, string> = { he: 'ספרים', en: 'books', fr: 'livres' }

/** Hebrew carries no prefix; every other locale is prefixed — see
 * src/proxy.ts, which rewrites the unprefixed request onto /he. */
export function localePath(locale: Locale, path: string): string {
  const suffix = path === '/' ? '' : path
  return locale === 'he' ? suffix || '/' : `/${locale}${suffix}`
}

export function bookPath(locale: Locale, slug: string): string {
  return localePath(locale, `/${BOOK_SEGMENT[locale]}/${slug}`)
}

export function cataloguePath(locale: Locale): string {
  return localePath(locale, `/${CATALOGUE_SEGMENT[locale]}`)
}
