import { adminListFilterHref } from './adminListFilters.ts'
import { FULFILMENT_OUTSTANDING_STATUSES } from './orderStatus.ts'

import type { Payload } from 'payload'
import type { Announcement, Event } from '@/payload-types'

const ORDERS_LIST_PATH = '/admin/collections/orders'
const BOOKS_LIST_PATH = '/admin/collections/books'

export type DashboardSummary = {
  pendingOrderCount: number
  outstandingOrderCount: number
  outstandingOrdersHref: string
  pendingOrdersHref: string
  booksMissingCover: { count: number; href: string }
  booksMissingPrice: { count: number; href: string }
  booksMissingDescription: { count: number; href: string }
  events: Pick<Event, 'id' | 'displayTitle' | 'title' | 'startsAt'>[]
  announcements: Pick<Announcement, 'id' | 'displayTitle' | 'title' | 'startsAt'>[]
}

/**
 * Everything the dashboard shows, in one place — every number here is a
 * real query against the current database, never a static count.
 * `payload` is the same instance
 * already open for the admin request (src/components/admin/Dashboard.tsx),
 * not a fresh connection.
 */
export async function getDashboardSummary(payload: Payload): Promise<DashboardSummary> {
  const [pendingOrderCount, outstandingOrderCount, missingCover, missingDescription, missingPrice, events, announcements] = await Promise.all([
    payload.count({ collection: 'orders', where: { paymentStatus: { equals: 'pending' } } }),
    payload.count({
      collection: 'orders',
      where: {
        and: [{ paymentStatus: { equals: 'paid' } }, { fulfilmentStatus: { in: [...FULFILMENT_OUTSTANDING_STATUSES] } }],
      },
    }),
    payload.count({ collection: 'books', where: { cover: { exists: false } } }),
    payload.count({ collection: 'books', where: { description: { exists: false } } }),
    // Books.prices requires at least one row (Books.ts), so "missing a
    // price" means a zero-amount row, not an absent array — confirmed
    // empirically: Payload's `where` cannot test `exists` on an array
    // field itself ("Cannot find field for path at undefined"), only on
    // its subfields.
    payload.count({ collection: 'books', where: { 'prices.amount': { equals: 0 } } }),
    payload.find({ collection: 'events', locale: 'he', pagination: false, sort: 'startsAt', depth: 0 }),
    payload.find({ collection: 'announcements', locale: 'he', pagination: false, sort: '-startsAt', depth: 0 }),
  ])

  return {
    pendingOrderCount: pendingOrderCount.totalDocs,
    outstandingOrderCount: outstandingOrderCount.totalDocs,
    pendingOrdersHref: adminListFilterHref(ORDERS_LIST_PATH, [['paymentStatus', 'equals', 'pending']]),
    outstandingOrdersHref: adminListFilterHref(ORDERS_LIST_PATH, [
      ['paymentStatus', 'equals', 'paid'],
      ['fulfilmentStatus', 'in', FULFILMENT_OUTSTANDING_STATUSES.join(',')],
    ]),
    booksMissingCover: { count: missingCover.totalDocs, href: adminListFilterHref(BOOKS_LIST_PATH, [['cover', 'exists', 'false']]) },
    booksMissingDescription: {
      count: missingDescription.totalDocs,
      href: adminListFilterHref(BOOKS_LIST_PATH, [['description', 'exists', 'false']]),
    },
    booksMissingPrice: {
      count: missingPrice.totalDocs,
      href: adminListFilterHref(BOOKS_LIST_PATH, [['prices.amount', 'equals', '0']]),
    },
    events: events.docs,
    announcements: announcements.docs,
  }
}
