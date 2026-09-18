import { isPurchasable } from '@/lib/availability'
import { LOCALE_CONFIG } from '@/lib/locale'
import { formatPrice, selectPrice } from '@/lib/price'

import type { Dictionary } from '@/app/(frontend)/dictionary'
import type { Locale } from '@/lib/locale'

type PricedItem = { prices: { amount: number; currency: string }[] }

/**
 * A book with no price in the viewer's currency, or a real 0.00, is visible
 * and clearly not purchasable — never hidden, never free (§3b). Used on
 * both the catalogue card and the book page, so the rule reads the same
 * everywhere.
 */
export function PriceTag({ book, dict, locale }: { book: PricedItem; dict: Dictionary; locale: Locale }) {
  const currency = LOCALE_CONFIG[locale].currency
  const amount = selectPrice(book, currency)
  const purchasable = isPurchasable(book, currency)

  if (amount !== null && purchasable) {
    return <span className="font-medium text-foreground">{formatPrice(amount, currency, locale)}</span>
  }

  return <span className="text-sm text-muted-foreground">{dict.book.unavailableTitle}</span>
}
