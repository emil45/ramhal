import { describe, expect, it } from 'vitest'

import { isEventUpcoming } from '@/lib/events'

describe('isEventUpcoming', () => {
  it('is upcoming when startsAt is in the future', () => {
    expect(isEventUpcoming({ startsAt: '2026-12-01' }, new Date('2026-01-01'))).toBe(true)
  })

  it('is not upcoming once startsAt has passed', () => {
    expect(isEventUpcoming({ startsAt: '2026-01-01' }, new Date('2026-06-01'))).toBe(false)
  })

  it('is not upcoming the instant it starts', () => {
    const startsAt = '2026-06-01T12:00:00.000Z'
    expect(isEventUpcoming({ startsAt }, new Date(startsAt))).toBe(false)
  })
})
