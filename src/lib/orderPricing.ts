import { cartUnits } from '@/lib/cart'
import { isPurchasable } from '@/lib/availability'
import { roundMoney, selectPrice } from '@/lib/price'
import { calculateShipping } from '@/lib/shipping'

import type { Currency } from '@/lib/currency'
import type { ShippingQuote, ShippingZone } from '@/lib/shipping'

export type PricingBook = {
  id: number
  title: string
  prices: { amount: number; currency: string }[]
  shippingUnits: number
  inStock?: boolean | null
}

export type PricingLine = {
  book: PricingBook
  quantity: number
}

/** What was sold, frozen at the moment of sale — never a reference to the
 * book's current price (docs/DECISIONS.md §16). */
export type OrderLineSnapshot = {
  bookId: number
  title: string
  unitPrice: number
  currency: Currency
  quantity: number
  shippingUnits: number
}

export type PricedOrder = {
  currency: Currency
  lines: OrderLineSnapshot[]
  subtotal: number
  shippingCost: number
  total: number
  shippingZone: string
  destinationCountry: string
  isPickup: boolean
}

/** Expected business failures, returned rather than thrown so the caller can
 * show the customer a message that names the book. */
export type CheckoutProblem =
  | { kind: 'empty-cart' }
  | { kind: 'book-not-purchasable'; bookTitle: string }
  | { kind: 'book-out-of-stock'; bookTitle: string }
  | { kind: 'destination-not-served' }
  | { kind: 'pickup-not-available' }

export type PricingResult = { ok: true; order: PricedOrder } | { ok: false; problem: CheckoutProblem }

/**
 * Countries a customer paying in this currency can ship to. An order has one
 * currency, and shipping is charged in the destination zone's currency — so a
 * zone priced in another currency cannot be added to this order's subtotal.
 * Only countries the zones list explicitly are offered: the son controls who
 * the shop ships to by editing the zones, and a zone's `isDefault` fallback
 * is for the cart's estimate, not an open invitation to every country.
 */
export function countriesServedInCurrency(zones: ShippingZone[], currency: Currency): string[] {
  return zones.filter((zone) => zone.currency === currency).flatMap((zone) => zone.countries)
}

/** Self-pickup is free; the checkout page and the server both price shipping
 * through this, so the total the customer sees is the total the server
 * computes. */
export function orderShippingCost(quote: ShippingQuote, isPickup: boolean): number {
  return isPickup ? 0 : quote.amount
}

/**
 * Builds the order from the database's numbers — current prices, current
 * stock, the shipping rules — and nothing the customer's browser sent. Every
 * amount on the result is derived here, so a tampered client total has
 * nothing to tamper with; the caller compares what the customer was shown
 * against `total` to catch a price that changed in the meantime.
 */
export function priceOrder(input: {
  currency: Currency
  destinationCountry: string
  isPickup: boolean
  lines: PricingLine[]
  zones: ShippingZone[]
}): PricingResult {
  const { currency, destinationCountry, isPickup, lines, zones } = input

  if (lines.length === 0) return { ok: false, problem: { kind: 'empty-cart' } }

  for (const { book } of lines) {
    if (book.inStock === false) return { ok: false, problem: { kind: 'book-out-of-stock', bookTitle: book.title } }
    if (!isPurchasable(book, currency)) {
      return { ok: false, problem: { kind: 'book-not-purchasable', bookTitle: book.title } }
    }
  }

  if (!countriesServedInCurrency(zones, currency).includes(destinationCountry)) {
    return { ok: false, problem: { kind: 'destination-not-served' } }
  }

  const quote = calculateShipping(zones, { countryCode: destinationCountry, units: cartUnits(lines) })
  if (isPickup && !quote.allowPickup) return { ok: false, problem: { kind: 'pickup-not-available' } }

  const snapshots = lines.map(({ book, quantity }): OrderLineSnapshot => {
    const unitPrice = selectPrice(book, currency)
    if (unitPrice === null) {
      throw new Error(`Book ${book.id} passed the purchasability check but has no ${currency} price.`)
    }
    return {
      bookId: book.id,
      title: book.title,
      unitPrice,
      currency,
      quantity,
      shippingUnits: book.shippingUnits,
    }
  })

  const subtotal = roundMoney(snapshots.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0))
  const shippingCost = orderShippingCost(quote, isPickup)

  return {
    ok: true,
    order: {
      currency,
      lines: snapshots,
      subtotal,
      shippingCost,
      total: roundMoney(subtotal + shippingCost),
      shippingZone: quote.zoneName,
      destinationCountry,
      isPickup,
    },
  }
}
