import { selectPrice } from '@/lib/price'

import type { Currency } from '@/lib/currency'

type PricedItem = {
  prices: { amount: number; currency: string }[]
}

/**
 * A book is purchasable exactly when it carries a real, positive price in
 * the given currency. No price in this currency, or a real 0.00 (see
 * docs/reviews/REVIEW-01-findings.md — a real €0.00 existed on the French
 * site for a five-volume set), both mean "visible, not purchasable" —
 * never "hidden" and never "free" (docs/tasks/TASK-06-storefront.md §3b).
 */
export function isPurchasable(item: PricedItem, currency: Currency): boolean {
  const amount = selectPrice(item, currency)
  return amount !== null && amount > 0
}

type CatalogueEntry = PricedItem & {
  displayTitle: string
  publishedAt?: string | null
}

/**
 * The catalogue's display order: purchasable-in-this-currency books first,
 * then the rest — never hidden, just not leading (docs/tasks/TASK-07-storefront.md
 * §A2: 66 of 128 books have no ILS price, and without an explicit sort they
 * landed at the top by insertion order, making the Hebrew shop's first five
 * screens dead cards). Within each group, most recently published first; a
 * book with no known publication date sorts after every dated book in its
 * group (an unknown date must never read as "very old" or jump the queue as
 * "brand new"), then alphabetically by title as the final, stable tiebreak.
 */
export function sortCatalogue<T extends CatalogueEntry>(items: T[], currency: Currency): T[] {
  return [...items].sort((a, b) => {
    const aPurchasable = isPurchasable(a, currency)
    const bPurchasable = isPurchasable(b, currency)
    if (aPurchasable !== bPurchasable) return aPurchasable ? -1 : 1

    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : null
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : null
    if (aTime !== bTime) {
      if (aTime === null) return 1
      if (bTime === null) return -1
      return bTime - aTime
    }

    return a.displayTitle.localeCompare(b.displayTitle)
  })
}

/**
 * The front page's "new books" section: purchasable-in-this-currency books
 * that carry a real publication date, most recent first, capped to `limit`
 * (docs/tasks/TASK-07-storefront.md §B — "new books are not a section to
 * curate," per docs/DECISIONS.md §9). A book with no known publication date
 * is excluded rather than sorted to the end — this section claims to show
 * what's new, and a date-less book has no basis for that claim, unlike the
 * full catalogue (sortCatalogue), which must still show it somewhere.
 */
export function selectNewBooks<T extends CatalogueEntry>(items: T[], currency: Currency, limit: number): T[] {
  return items
    .filter((item): item is T & { publishedAt: string } => !!item.publishedAt && isPurchasable(item, currency))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, limit)
}
