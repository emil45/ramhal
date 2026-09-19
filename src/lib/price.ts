// Relative and extensioned, unlike this folder's usual `@/` imports: the Orders
// collection formats its total with this file, so it sits in Payload's config
// graph — see the note at the top of src/payload.config.ts.
import { LOCALE_CONFIG } from './locale.ts'

import type { Currency } from '@/lib/currency'
import type { Locale } from '@/lib/locale'

type PricedItem = {
  prices: { amount: number; currency: string }[]
}

/**
 * The book's price in the given currency, or null when it doesn't carry one.
 * No fallback to another currency — a French visitor sees the book's actual
 * EUR price or none at all, never an ILS price relabelled (see
 * docs/tasks/TASK-06-storefront.md §3b).
 */
export function selectPrice(item: PricedItem, currency: Currency): number | null {
  const match = item.prices.find((price) => price.currency === currency)
  return match ? match.amount : null
}

/** Minor units (agorot/cents) to a localized display string, e.g. 5500 → "₪55.00". */
export function formatPrice(amountMinorUnits: number, currency: Currency, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_CONFIG[locale].intlTag, { style: 'currency', currency }).format(
    amountMinorUnits / 100,
  )
}
