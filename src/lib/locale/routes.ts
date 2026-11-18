import type { Locale } from '@/lib/locale/locale'

// The word "book" in each locale's own language, used as the book-page path
// segment — Hebrew's is literally /ספר/<slug>. Adding a fourth locale means
// adding one entry here.
export const BOOK_SEGMENT: Record<Locale, string> = { he: 'ספר', en: 'book', fr: 'livre' }

// The catalogue's own path segment, plural of BOOK_SEGMENT — /ספרים,
// /en/books, /fr/livres. Uses the same
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

const SHARED_PAGE_SEGMENTS = [
  'beit-ramhal', 'cart', 'courses', 'donate', 'press', 'privacy', 'questions-and-answers', 'rabbi-chriqui', 'ramhal',
]

/** Switch language from the locale layout. Book slugs are shared across locales. */
export function localizedPagePath(current: Locale, target: Locale, segments: readonly string[]): string {
  const [rawSection, slug] = segments
  const section = rawSection ? decodeURIComponent(rawSection) : ''
  if (section === CATALOGUE_SEGMENT[current]) return cataloguePath(target)
  if (section === BOOK_SEGMENT[current] && slug) return bookPath(target, slug)
  if (segments.length === 1 && SHARED_PAGE_SEGMENTS.includes(section)) return localePath(target, `/${section}`)
  return localePath(target, '/')
}

export function coursesPath(locale: Locale): string {
  return localePath(locale, '/courses')
}

export function donatePath(locale: Locale): string {
  return localePath(locale, '/donate')
}

export function questionsPath(locale: Locale): string {
  return localePath(locale, '/questions-and-answers')
}
