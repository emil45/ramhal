import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { markOrderPaid, markOrderPaymentUnsuccessful } from '@/lib/payment/orderPayment'
import { decideMockPayment, MockPaymentProvider } from '@/lib/payment/mockPaymentProvider'
import { settleOrderPayment } from '@/lib/payment/settleOrderPayment'
import { placeOrder } from '@/lib/placeOrder'
import {
  checkoutFormFor,
  cleanUpTestRun,
  countPaymentEventsFor,
  createTestBook,
  findOrdersOf,
  startTestRun,
} from '@/test/checkoutFixtures'

import type { MockPaymentDecision } from '@/lib/payment/mockPaymentDecision'
import type { Book, Order } from '@/payload-types'

// Real database — see src/test/checkoutFixtures.ts. The UNIQUE constraint on
// paymentEvents.providerEventId is what these tests lean on: nothing here
// would pass against an "if already paid" check in application code.
const ISRAEL_TOTAL = 5500 + 3000

const run = startTestRun()
let book: Book
let placedOrders = 0

beforeAll(async () => {
  book = await createTestBook(run)
})

afterAll(async () => {
  await cleanUpTestRun(run, [book])
})

/** Places a fresh pending order for this run and returns it. */
async function placePendingOrder(): Promise<Order> {
  await placeOrder({ cart: [{ bookId: book.id, quantity: 1 }], form: checkoutFormFor(run, ISRAEL_TOTAL), locale: 'he' })
  const orders = await findOrdersOf(run)
  placedOrders += 1
  expect(orders).toHaveLength(placedOrders)
  return orders.reduce((newest, order) => (order.id > newest.id ? order : newest))
}

async function customerDecides(order: Order, decision: MockPaymentDecision): Promise<void> {
  if (!order.providerRef) throw new Error('The placed order has no providerRef.')
  await decideMockPayment(order.providerRef, decision)
}

async function reloadOrder(order: Order): Promise<Order> {
  const payload = await getPayload({ config })
  return payload.findByID({ collection: 'orders', id: order.id, depth: 0 })
}

describe('a mock purchase, end to end', () => {
  it('marks the order paid only after the provider confirms it, and starts fulfilment at "new"', async () => {
    const order = await placePendingOrder()
    expect(order).toMatchObject({ paymentStatus: 'pending', fulfilmentStatus: null, paidAt: null })

    const beforeCustomerActs = await settleOrderPayment(order.publicToken)
    expect(beforeCustomerActs?.paymentStatus).toBe('pending')

    await customerDecides(order, 'paid')
    const settled = await settleOrderPayment(order.publicToken)

    expect(settled).toMatchObject({ paymentStatus: 'paid', fulfilmentStatus: 'new' })
    expect(settled?.paidAt).toBeTruthy()
    expect(await countPaymentEventsFor(order.id)).toBe(1)
  })

  it('leaves a declined order as a legible non-sale, with no fulfilment status', async () => {
    const order = await placePendingOrder()

    await customerDecides(order, 'declined')
    const settled = await settleOrderPayment(order.publicToken)

    expect(settled).toMatchObject({ paymentStatus: 'failed', fulfilmentStatus: null, paidAt: null })
  })

  it('leaves a cancelled order as a legible non-sale, with no fulfilment status', async () => {
    const order = await placePendingOrder()

    await customerDecides(order, 'cancelled')
    const settled = await settleOrderPayment(order.publicToken)

    expect(settled).toMatchObject({ paymentStatus: 'cancelled', fulfilmentStatus: null, paidAt: null })
  })

  it('cannot be decided twice: the first click stands', async () => {
    const order = await placePendingOrder()

    await customerDecides(order, 'cancelled')
    await customerDecides(order, 'paid')

    expect((await settleOrderPayment(order.publicToken))?.paymentStatus).toBe('cancelled')
  })
})

describe('the mock provider', () => {
  it('reports the same event id every time it is asked', async () => {
    const order = await placePendingOrder()
    await customerDecides(order, 'paid')
    const provider = new MockPaymentProvider()

    const first = await provider.confirmPayment(order.providerRef ?? '')
    const second = await provider.confirmPayment(order.providerRef ?? '')

    expect(first).toMatchObject({ status: 'paid' })
    expect(second).toEqual(first)
  })
})

describe('markOrderPaid', () => {
  it('changes nothing when called again with the same providerEventId', async () => {
    const order = await placePendingOrder()

    const first = await markOrderPaid(order.id, 'evt-repeat')
    const afterFirst = await reloadOrder(order)
    const second = await markOrderPaid(order.id, 'evt-repeat')
    const afterSecond = await reloadOrder(order)

    expect(first).toBe('applied')
    expect(second).toBe('already-processed')
    expect(afterSecond).toEqual(afterFirst)
    expect(await countPaymentEventsFor(order.id)).toBe(1)
  })

  it('records exactly one event when the same confirmation arrives concurrently', async () => {
    const order = await placePendingOrder()

    const results = await Promise.all(Array.from({ length: 8 }, () => markOrderPaid(order.id, 'evt-race')))

    expect(results.filter((result) => result === 'applied')).toHaveLength(1)
    expect(results.filter((result) => result === 'already-processed')).toHaveLength(7)
    expect(await countPaymentEventsFor(order.id)).toBe(1)
    expect((await reloadOrder(order)).paymentStatus).toBe('paid')
  })

  it('is not undone by a later, different event reporting failure', async () => {
    const order = await placePendingOrder()

    await markOrderPaid(order.id, 'evt-paid')
    await markOrderPaymentUnsuccessful(order.id, 'evt-late-failure', 'failed')

    expect((await reloadOrder(order)).paymentStatus).toBe('paid')
    expect(await countPaymentEventsFor(order.id)).toBe(2)
  })
})
