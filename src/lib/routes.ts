import type { Locale } from '@/lib/locale'

// The word "book" in each locale's own language, used as the book-page path
// segment — Hebrew's is literally /ספר/<slug> (see
// docs/tasks/TASK-06-storefront.md §2). Adding a fourth locale means adding
// one entry here.
export const BOOK_SEGMENT: Record<Locale, string> = { he: 'ספר', en: 'book', fr: 'livre' }

/** Hebrew carries no prefix; every other locale is prefixed — see
 * src/proxy.ts, which rewrites the unprefixed request onto /he. */
export function localePath(locale: Locale, path: string): string {
  const suffix = path === '/' ? '' : path
  return locale === 'he' ? suffix || '/' : `/${locale}${suffix}`
}

export function bookPath(locale: Locale, slug: string): string {
  return localePath(locale, `/${BOOK_SEGMENT[locale]}/${slug}`)
}
