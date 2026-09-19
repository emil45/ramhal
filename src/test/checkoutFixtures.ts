import config from '@payload-config'
import { randomUUID } from 'node:crypto'
import { getPayload } from 'payload'

import type { CheckoutFormValues } from '@/lib/checkoutForm'
import type { Book, Order } from '@/payload-types'

// The tests below run against the real development database, like
// booksData.integration.test.ts. Everything they create is tagged with one
// run id so they can remove exactly their own rows afterwards — including
// orders, which the application itself never deletes.

export type TestRun = { id: string; email: string }

export function startTestRun(): TestRun {
  const id = randomUUID().slice(0, 8)
  return { id, email: `checkout-test-${id}@example.invalid` }
}

/** A throwaway book the test owns, so no real catalogue price is touched. */
export async function createTestBook(
  run: TestRun,
  overrides: { title?: string; prices?: Book['prices']; inStock?: boolean; shippingUnits?: number } = {},
): Promise<Book> {
  const payload = await getPayload({ config })
  return payload.create({
    collection: 'books',
    locale: 'he',
    data: {
      title: overrides.title ?? `ספר בדיקה ${run.id}`,
      // Required by the generated types; the title hook fills both in — the
      // same way src/importBooks.ts creates books.
      slug: '',
      urlSlug: '',
      bookLanguage: 'he',
      prices: overrides.prices ?? [{ currency: 'ILS', amount: 5500 }],
      inStock: overrides.inStock ?? true,
      shippingUnits: overrides.shippingUnits ?? 1,
    },
  })
}

export function checkoutFormFor(run: TestRun, expectedTotal: number, overrides: Partial<CheckoutFormValues> = {}): CheckoutFormValues {
  return {
    name: 'לקוח בדיקה',
    email: run.email,
    phone: '0501234567',
    countryCode: 'IL',
    isPickup: false,
    address: { line1: 'הרצל 1', line2: '', city: 'תל אביב', postalCode: '6100000' },
    expectedTotal,
    ...overrides,
  }
}

export async function findOrdersOf(run: TestRun): Promise<Order[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'orders',
    where: { 'customer.email': { equals: run.email } },
    depth: 0,
    pagination: false,
  })
  return result.docs
}

export async function countPaymentEventsFor(orderId: number): Promise<number> {
  const payload = await getPayload({ config })
  const result = await payload.count({ collection: 'paymentEvents', where: { order: { equals: orderId } } })
  return result.totalDocs
}

/** Removes everything a run created, children before parents. */
export async function cleanUpTestRun(run: TestRun, books: Book[]): Promise<void> {
  const payload = await getPayload({ config })

  for (const order of await findOrdersOf(run)) {
    await payload.delete({ collection: 'paymentEvents', where: { order: { equals: order.id } } })
    if (order.providerRef) {
      await payload.delete({ collection: 'mockPaymentSessions', where: { providerRef: { equals: order.providerRef } } })
    }
    await payload.delete({ collection: 'orders', id: order.id })
  }

  for (const book of books) {
    await payload.delete({ collection: 'books', id: book.id })
  }
}
