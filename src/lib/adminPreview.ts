import { isLocale } from './locale.ts'
import { bookPath, localePath } from './routes.ts'

/** The narrative pages that have a route of their own, each served at `/<slug>`
 * (src/app/(frontend)/[locale]/<slug>/page.tsx). A page created in the admin
 * under any other slug has no public address, so it gets no preview button. */
const NARRATIVE_PAGE_SLUGS: readonly string[] = ['beit-ramhal', 'rabbi-chriqui', 'ramhal']

/** Where a saved book is visible on the site, or `null` while it has no slug (a new, unsaved book). */
export function bookPreviewPath(book: Record<string, unknown>, locale: string): string | null {
  const urlSlug = book.urlSlug
  if (typeof urlSlug !== 'string' || urlSlug === '' || !isLocale(locale)) return null
  return bookPath(locale, urlSlug)
}

/** Where a saved narrative page is visible on the site, or `null` when it has no route. */
export function pagePreviewPath(page: Record<string, unknown>, locale: string): string | null {
  const slug = page.slug
  if (typeof slug !== 'string' || !NARRATIVE_PAGE_SLUGS.includes(slug) || !isLocale(locale)) return null
  return localePath(locale, `/${slug}`)
}
