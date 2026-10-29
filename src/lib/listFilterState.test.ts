import { describe, expect, it } from 'vitest'

import { adminListFilterHref } from '@/lib/adminListFilters'
import { isActiveListFilter } from '@/lib/listFilterState'

const ORDERS = '/admin/collections/orders'
const awaitingPost = adminListFilterHref(ORDERS, [
  ['paymentStatus', 'equals', 'paid'],
  ['fulfilmentStatus', 'in', 'new,packed'],
])

describe('isActiveListFilter', () => {
  it('treats the unfiltered link as active only while no filter is applied', () => {
    expect(isActiveListFilter(ORDERS, {})).toBe(true)
    expect(isActiveListFilter(ORDERS, { limit: '10', sort: '-createdAt' })).toBe(true)
    expect(isActiveListFilter(ORDERS, { 'where[and][0][paymentStatus][equals]': 'paid' })).toBe(false)
  })

  it('treats a filter link as active when every condition matches, whatever else the URL carries', () => {
    expect(
      isActiveListFilter(awaitingPost, {
        'where[and][0][paymentStatus][equals]': 'paid',
        'where[and][1][fulfilmentStatus][in]': 'new,packed',
        page: '2',
      }),
    ).toBe(true)
  })

  it('is not active for a different or partial filter', () => {
    expect(isActiveListFilter(awaitingPost, {})).toBe(false)
    expect(isActiveListFilter(awaitingPost, { 'where[and][0][paymentStatus][equals]': 'paid' })).toBe(false)
    expect(
      isActiveListFilter(awaitingPost, {
        'where[and][0][paymentStatus][equals]': 'pending',
        'where[and][1][fulfilmentStatus][in]': 'new,packed',
      }),
    ).toBe(false)
  })

  it('reads a repeated parameter as a joined list', () => {
    expect(isActiveListFilter(awaitingPost, { 'where[and][0][paymentStatus][equals]': ['paid'], 'where[and][1][fulfilmentStatus][in]': ['new', 'packed'] })).toBe(true)
  })
})
