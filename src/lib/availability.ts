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
