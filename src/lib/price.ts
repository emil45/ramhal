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

/** A major-unit amount (shekels/dollars/euros) to a localized display string,
 * e.g. 55 → "₪55.00". */
export function formatPrice(amount: number, currency: Currency, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_CONFIG[locale].intlTag, { style: 'currency', currency }).format(amount)
}

/**
 * Rounds a computed money value (a sum or product of major-unit amounts) back
 * to its currency's two decimal places, so float arithmetic never leaves a
 * value like 59.97000000000001 sitting in an order total or a hidden form
 * field. Every derived money value — a line total, a subtotal, an order
 * total — must be rounded through this before it is stored, compared, or
 * sent to the browser.
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}
