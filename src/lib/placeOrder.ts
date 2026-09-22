import 'server-only'

import config from '@payload-config'
import { randomUUID } from 'node:crypto'
import { getPayload } from 'payload'

import { getPaymentProvider } from '@/lib/payment/getPaymentProvider'
import { priceOrder } from '@/lib/orderPricing'
import { DEFAULT_LOCALE, LOCALE_CONFIG, LOCALES } from '@/lib/locale'
import { localePath } from '@/lib/routes'
import { getShippingZones } from '@/lib/shippingData'

import type { CartItem } from '@/lib/serverCart'
import type { CheckoutFormValues } from '@/lib/checkoutForm'
import type { CheckoutProblem, PricingLine } from '@/lib/orderPricing'
import type { Locale } from '@/lib/locale'

export type PlaceOrderProblem = CheckoutProblem | { kind: 'total-changed' }

export type PlaceOrderResult = { ok: true; redirectUrl: string } | { ok: false; problem: PlaceOrderProblem }

export const RETURN_PATH_SEGMENT = 'checkout/return'

/**
 * Turns a cart and a filled-in checkout form into a pending order and a
 * payment to send the customer to. Everything money-related is read from the
 * database here — the only number that arrives from the browser is the total
 * the customer was shown, and it is compared, never used.
 */
export async function placeOrder(input: {
  cart: CartItem[]
  form: CheckoutFormValues
  locale: Locale
}): Promise<PlaceOrderResult> {
  const { cart, form, locale } = input
  const payload = await getPayload({ config })

  const [books, zones] = await Promise.all([
    payload.find({
      collection: 'books',
      where: { id: { in: cart.map((item) => item.bookId) } },
      locale,
      // A title is structural — every line needs a name — so it falls back
      // to the default locale, then any locale, like the catalogue's does.
      fallbackLocale: [DEFAULT_LOCALE, ...LOCALES],
      depth: 0,
      pagination: false,
    }),
    getShippingZones(),
  ])

  const lines: PricingLine[] = cart.flatMap((item) => {
    const book = books.docs.find((candidate) => candidate.id === item.bookId)
    if (!book) return []
    // The query's own fallbackLocale chain above already guarantees a title
    // in practice; book.displayTitle (docs/tasks/TASK-32-admin-facelift.md
    // §1c) is the same guarantee the type system can express, since a
    // title's requiredness is now data-driven rather than schema-enforced.
    return [{ book: { ...book, title: book.title ?? book.displayTitle ?? '' }, quantity: item.quantity }]
  })

  const priced = priceOrder({
    currency: LOCALE_CONFIG[locale].currency,
    destinationCountry: form.countryCode,
    isPickup: form.isPickup,
    lines,
    zones,
  })
  if (!priced.ok) return { ok: false, problem: priced.problem }
  const { order } = priced

  if (order.total !== form.expectedTotal) return { ok: false, problem: { kind: 'total-changed' } }

  const provider = getPaymentProvider()
  const publicToken = randomUUID()

  const created = await payload.create({
    collection: 'orders',
    data: {
      paymentStatus: 'pending',
      customer: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      },
      lines: order.lines.map((line) => ({
        book: line.bookId,
        title: line.title,
        unitPrice: line.unitPrice,
        currency: line.currency,
        quantity: line.quantity,
        shippingUnits: line.shippingUnits,
      })),
      currency: order.currency,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      shippingZone: order.shippingZone,
      destinationCountry: order.destinationCountry,
      isPickup: order.isPickup,
      locale,
      provider: provider.name,
      publicToken,
    },
  })

  const payment = await provider.createPayment({
    orderNumber: created.id,
    currency: order.currency,
    total: order.total,
    locale,
    returnUrl: localePath(locale, `/${RETURN_PATH_SEGMENT}/${publicToken}`),
  })

  await payload.update({ collection: 'orders', id: created.id, data: { providerRef: payment.providerRef } })

  return { ok: true, redirectUrl: payment.redirectUrl }
}
