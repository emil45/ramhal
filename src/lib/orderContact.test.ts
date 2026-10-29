import { describe, expect, it } from 'vitest'

import { orderContactFields } from '@/lib/orderContact'

describe('orderContactFields', () => {
  it('copies the customer name and phone', () => {
    expect(orderContactFields({ name: 'דנה כהן', phone: '050-123-4567' })).toEqual({ contactName: 'דנה כהן', contactPhone: '050-123-4567' })
  })

  it('leaves a value out when the save did not carry it', () => {
    expect(orderContactFields({ name: 'דנה כהן' })).toEqual({ contactName: 'דנה כהן' })
    expect(orderContactFields({ phone: null, name: undefined })).toEqual({})
  })

  it('changes nothing when the save carries no customer at all', () => {
    expect(orderContactFields(undefined)).toEqual({})
  })
})
