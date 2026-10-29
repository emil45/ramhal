import { describe, expect, it } from 'vitest'

import { formatAdminDateTime } from '@/lib/adminDateTime'

describe('formatAdminDateTime', () => {
  it('writes the day before the month name and the hour in 24-hour time', () => {
    expect(formatAdminDateTime('2026-10-29T21:06:00.000Z')).toBe('29 באוקטובר 2026 בשעה 23:06')
  })

  it('reads the time in Jerusalem, not in UTC: summer time is three hours ahead', () => {
    expect(formatAdminDateTime('2026-07-01T09:00:00.000Z')).toBe('1 ביולי 2026 בשעה 12:00')
  })
})
