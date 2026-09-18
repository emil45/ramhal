import { selectPrice } from '@/lib/price'

import type { Currency } from '@/lib/currency'
import type { ShippingZone } from '@/lib/shipping'

type CartLine = {
  book: { prices: { amount: number; currency: string }[]; shippingUnits: number }
  quantity: number
}

/** Total shipping units in the cart — what src/lib/shipping.ts's tiers and
 * free-shipping threshold count against, not number of line items. */
export function cartUnits(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.book.shippingUnits * line.quantity, 0)
}

/**
 * Sums each line's price in the given currency. A line whose book has no
 * price in this currency contributes 0 rather than throwing — the cart
 * itself only ever holds purchasable lines (see the "add to cart" action,
 * which refuses to add a book that isn't), so this is defence in depth, not
 * the mechanism that enforces purchasability.
 */
export function cartSubtotal(lines: CartLine[], currency: Currency): number {
  return lines.reduce((sum, line) => sum + (selectPrice(line.book, currency) ?? 0) * line.quantity, 0)
}

/**
 * How many more shipping units would cross this zone's free-shipping
 * threshold — null when the zone has no such threshold, 0 once it's already
 * crossed. Drives the "another N books and shipping is free" nudge
 * (docs/tasks/TASK-06-storefront.md §4, cart).
 */
export function unitsUntilFreeShipping(zone: Pick<ShippingZone, 'freeAboveUnits'>, currentUnits: number): number | null {
  if (zone.freeAboveUnits === null) return null
  return Math.max(0, zone.freeAboveUnits - currentUnits)
}
