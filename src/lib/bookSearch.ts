// Same quote/gershayim variance as scripts/scrape/reconcile.mjs's
// normalizeTitle — "רמח״ל" (gershayim), "רמח"ל" (ASCII quote), and "רמחל"
// (quote dropped) must all match. Niqqud is stripped for the same reason
// slugify.ts strips it: never present in a typed title, but defensive.
const NIQQUD_RE = /[֑-ׇ]/g
const QUOTE_RE = /["'׳״]/g

/** Case-folded, quote/niqqud-stripped form used for a client-side substring
 * search — see docs/tasks/TASK-06-storefront.md §3c: no search
 * infrastructure, no Hebrew full-text configuration to fight. */
export function normalizeForSearch(text: string): string {
  return text.replace(NIQQUD_RE, '').replace(QUOTE_RE, '').toLowerCase().trim()
}

export type CatalogueEntry = {
  bookLanguage: string
  categorySlug: string | null
  title: string
}

export type CatalogueFilter = {
  bookLanguage?: string | null
  categorySlug?: string | null
  query?: string
}

/** Pure filter over an already-fetched catalogue — 128 books is small
 * enough to ship whole and filter on the client (§3c). */
export function filterCatalogue<T extends CatalogueEntry>(entries: T[], filter: CatalogueFilter): T[] {
  const normalizedQuery = filter.query ? normalizeForSearch(filter.query) : null

  return entries.filter((entry) => {
    if (filter.categorySlug && entry.categorySlug !== filter.categorySlug) return false
    if (filter.bookLanguage && entry.bookLanguage !== filter.bookLanguage) return false
    if (normalizedQuery && !normalizeForSearch(entry.title).includes(normalizedQuery)) return false
    return true
  })
}
