import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { placeOrder } from '@/lib/placeOrder'
import { cleanUpTestRun, checkoutFormFor, createTestBook, findOrdersOf, startTestRun } from '@/test/checkoutFixtures'

import type { Book } from '@/payload-types'

// Real database, real Local API — see src/test/checkoutFixtures.ts. Israel
// shipping is seeded at ₪30 for fewer than 10 units.
const ISRAEL_SHIPPING = 3000
const BOOK_PRICE = 5500

const run = startTestRun()
const books: Book[] = []
let book: Book

beforeAll(async () => {
  book = await createTestBook(run, { prices: [{ currency: 'ILS', amount: BOOK_PRICE }] })
  books.push(book)
})

afterAll(async () => {
  await cleanUpTestRun(run, books)
})

const cartOf = (quantity: number) => [{ bookId: book.id, quantity }]

describe('placeOrder', () => {
  it('rejects a client total that does not match the database, and creates no order', async () => {
    const tamperedTotal = 1 // the client claims the two books cost one agora

    const result = await placeOrder({ cart: cartOf(2), form: checkoutFormFor(run, tamperedTotal), locale: 'he' })

    expect(result).toEqual({ ok: false, problem: { kind: 'total-changed' } })
    expect(await findOrdersOf(run)).toEqual([])
  })

  it('builds the order from database prices and sends the customer to the payment page', async () => {
    const expectedTotal = BOOK_PRICE * 2 + ISRAEL_SHIPPING

    const result = await placeOrder({ cart: cartOf(2), form: checkoutFormFor(run, expectedTotal), locale: 'he' })

    expect(result).toMatchObject({ ok: true, redirectUrl: expect.stringContaining('/mock-payment/') })
    const [order] = await findOrdersOf(run)
    expect(order).toMatchObject({
      paymentStatus: 'pending',
      fulfilmentStatus: null,
      currency: 'ILS',
      subtotal: BOOK_PRICE * 2,
      shippingCost: ISRAEL_SHIPPING,
      total: expectedTotal,
      shippingZone: 'ישראל',
      destinationCountry: 'IL',
      isPickup: false,
      locale: 'he',
      provider: 'mock',
    })
    expect(order.orderNumber).toBe(order.id)
    expect(order.providerRef).toBeTruthy()
    expect(order.lines).toMatchObject([
      { title: book.title, unitPrice: BOOK_PRICE, currency: 'ILS', quantity: 2, shippingUnits: 1 },
    ])
  })

  it('keeps what was sold and what was paid after the book is repriced and then deleted', async () => {
    const payload = await getPayload({ config })
    const soldBook = await createTestBook(run, { title: `ספר שיימחק ${run.id}` })
    const email = `snapshot-${run.email}`
    const form = checkoutFormFor(run, BOOK_PRICE + ISRAEL_SHIPPING, { email })

    await placeOrder({ cart: [{ bookId: soldBook.id, quantity: 1 }], form, locale: 'he' })
    await payload.update({
      collection: 'books',
      id: soldBook.id,
      data: { prices: [{ currency: 'ILS', amount: 9900 }] },
    })
    await payload.delete({ collection: 'books', id: soldBook.id })

    const order = (await payload.find({ collection: 'orders', where: { 'customer.email': { equals: email } }, depth: 0 })).docs[0]
    expect(order.total).toBe(BOOK_PRICE + ISRAEL_SHIPPING)
    expect(order.lines).toMatchObject([{ title: soldBook.title, unitPrice: BOOK_PRICE, book: null }])

    await payload.delete({ collection: 'mockPaymentSessions', where: { providerRef: { equals: order.providerRef ?? '' } } })
    await payload.delete({ collection: 'orders', id: order.id })
  })

  it('fails naming the book when it is out of stock', async () => {
    const soldOut = await createTestBook(run, { title: `ספר שאזל ${run.id}`, inStock: false })
    books.push(soldOut)

    const result = await placeOrder({
      cart: [{ bookId: soldOut.id, quantity: 1 }],
      form: checkoutFormFor(run, BOOK_PRICE + ISRAEL_SHIPPING),
      locale: 'he',
    })

    expect(result).toEqual({ ok: false, problem: { kind: 'book-out-of-stock', bookTitle: soldOut.title } })
  })

  it('fails naming the book when it has no price in the shopper\'s currency', async () => {
    const eurOnly = await createTestBook(run, { title: `ספר באירו בלבד ${run.id}`, prices: [{ currency: 'EUR', amount: 1800 }] })
    books.push(eurOnly)

    const result = await placeOrder({
      cart: [{ bookId: eurOnly.id, quantity: 1 }],
      form: checkoutFormFor(run, 1800 + ISRAEL_SHIPPING),
      locale: 'he',
    })

    expect(result).toEqual({ ok: false, problem: { kind: 'book-not-purchasable', bookTitle: eurOnly.title } })
  })
})
