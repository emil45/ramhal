import { describe, expect, it } from 'vitest'

import { ORDER_LIST_FILTERS } from '@/lib/orderListFilters'

describe('the orders list quick filters', () => {
  it('offers "paid, not yet posted" as a filter on paid orders still new or packed', () => {
    const filter = ORDER_LIST_FILTERS.find((candidate) => candidate.label === 'שולם, טרם נשלח')
    expect(filter).toBeDefined()

    const query = new URL(filter?.href ?? '', 'http://localhost').searchParams
    expect(query.get('where[and][0][paymentStatus][equals]')).toBe('paid')
    expect(query.get('where[and][1][fulfilmentStatus][in]')).toBe('new,packed')
  })
})
