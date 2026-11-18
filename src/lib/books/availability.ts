import { selectPrice } from '@/lib/shop/price'

import type { Currency } from '@/lib/shop/currency'

type PricedItem = {
  prices: { amount: number; currency: string }[]
}

/**
 * A book is purchasable exactly when it carries a real, positive price in
 * the given currency. No price in this currency, or a real 0.00 (a real
 * €0.00 once existed on the French site for a five-volume set), both mean
 * "visible, not purchasable" — never "hidden" and never "free".
 */
export function isPurchasable(item: PricedItem, currency: Currency): boolean {
  const amount = selectPrice(item, currency)
  return amount !== null && amount > 0
}

type CatalogueEntry = PricedItem & {
  displayTitle: string
  publishedAt?: string | null
  markedNew?: boolean | null
}

/**
 * Most recently published first; a book with no known publication date sorts
 * after every dated one (an unknown date must never read as "very old" or jump
 * the queue as "brand new"), then alphabetically by title as the final,
 * stable tiebreak.
 */
function compareByPublicationThenTitle(a: CatalogueEntry, b: CatalogueEntry): number {
  const aTime = a.publishedAt ? Date.parse(a.publishedAt) : null
  const bTime = b.publishedAt ? Date.parse(b.publishedAt) : null
  if (aTime !== bTime) {
    if (aTime === null) return 1
    if (bTime === null) return -1
    return bTime - aTime
  }
  return a.displayTitle.localeCompare(b.displayTitle)
}

/**
 * The catalogue's display order: purchasable-in-this-currency books first,
 * then the rest — never hidden, just not leading (a real gap: many books have
 * no ILS price, and without an explicit sort they
 * landed at the top by insertion order, making the Hebrew shop's first five
 * screens dead cards). Within each group the books an editor marked new lead,
 * as a shop's "new releases" do, then the rest by publication date.
 */
export function sortCatalogue<T extends CatalogueEntry>(items: T[], currency: Currency): T[] {
  return [...items].sort((a, b) => {
    const aPurchasable = isPurchasable(a, currency)
    const bPurchasable = isPurchasable(b, currency)
    if (aPurchasable !== bPurchasable) return aPurchasable ? -1 : 1

    const aNew = a.markedNew === true
    const bNew = b.markedNew === true
    if (aNew !== bNew) return aNew ? -1 : 1

    return compareByPublicationThenTitle(a, b)
  })
}

/**
 * The front page's "new books" section: the purchasable-in-this-currency books
 * an editor marked new, most recently published first, capped to `limit`. The
 * mark is the only thing that says a book is new, so the ribbon on the cover,
 * the front of the shop and this section always agree.
 */
export function selectNewBooks<T extends CatalogueEntry>(items: T[], currency: Currency, limit: number): T[] {
  return items
    .filter((item) => item.markedNew === true && isPurchasable(item, currency))
    .sort(compareByPublicationThenTitle)
    .slice(0, limit)
}

type FeaturableItem = PricedItem & {
  /** A populated Media document, or an unresolved id, or nothing at all. */
  cover?: unknown
}

function hasScannedCover(item: FeaturableItem): boolean {
  return typeof item.cover === 'object' && item.cover !== null
}

/**
 * The front page's "from the catalogue" strip: purchasable-in-this-currency
 * books, ones with a real scanned cover first, otherwise in the order given
 * (pass an already-sorted catalogue). Unlike selectNewBooks it makes no claim
 * about recency, so it is never empty while the shop sells anything, and a
 * front page never depends on someone having filled in publication dates.
 */
export function selectFeaturedBooks<T extends FeaturableItem>(items: T[], currency: Currency, limit: number): T[] {
  const purchasable = items.filter((item) => isPurchasable(item, currency))
  return [...purchasable.filter(hasScannedCover), ...purchasable.filter((item) => !hasScannedCover(item))].slice(0, limit)
}
