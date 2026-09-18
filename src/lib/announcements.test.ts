import { describe, expect, it } from 'vitest'

import { isAnnouncementActive } from '@/lib/announcements'

describe('isAnnouncementActive', () => {
  it('is active once startsAt has passed, with no endsAt', () => {
    expect(isAnnouncementActive({ startsAt: '2026-01-01' }, new Date('2026-06-01'))).toBe(true)
  })

  it('is not active before startsAt', () => {
    expect(isAnnouncementActive({ startsAt: '2026-06-01' }, new Date('2026-01-01'))).toBe(false)
  })

  it('is active while now is within [startsAt, endsAt]', () => {
    expect(isAnnouncementActive({ startsAt: '2026-01-01', endsAt: '2026-12-31' }, new Date('2026-06-01'))).toBe(true)
  })

  it('is not active once endsAt has passed', () => {
    expect(isAnnouncementActive({ startsAt: '2026-01-01', endsAt: '2026-03-01' }, new Date('2026-06-01'))).toBe(false)
  })

  it('treats endsAt as inclusive', () => {
    const endsAt = '2026-06-01T00:00:00.000Z'
    expect(isAnnouncementActive({ startsAt: '2026-01-01', endsAt }, new Date(endsAt))).toBe(true)
  })
})
