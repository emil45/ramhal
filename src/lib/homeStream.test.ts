import { describe, expect, it } from 'vitest'

import { buildNewsStream } from '@/lib/homeStream'

function announcement(id: number, startsAt: string) {
  return { id, title: `Announcement ${id}`, startsAt }
}

function event(id: number, startsAt: string) {
  return { id, title: `Event ${id}`, startsAt }
}

describe('buildNewsStream', () => {
  it('puts announcements before events', () => {
    const result = buildNewsStream([announcement(1, '2026-09-01T10:00:00.000Z')], [event(2, '2026-12-01T10:00:00.000Z')])

    expect(result.map(({ id, kind }) => [id, kind])).toEqual([
      ['1', 'announcement'],
      ['2', 'event'],
    ])
  })

  it('keeps the order each list arrives in', () => {
    const result = buildNewsStream(
      [announcement(1, '2026-09-20T10:00:00.000Z'), announcement(2, '2026-09-01T10:00:00.000Z')],
      [event(3, '2026-12-01T10:00:00.000Z'), event(4, '2026-10-01T10:00:00.000Z')],
    )

    expect(result.map(({ id }) => id)).toEqual(['1', '2', '3', '4'])
  })

  it('normalises an item with no image and no link', () => {
    const [result] = buildNewsStream([announcement(1, '2026-09-20T10:00:00.000Z')], [])

    expect(result).toMatchObject({ image: null, link: null, location: null })
  })

  it('drops an incomplete link', () => {
    const item = { ...announcement(1, '2026-09-20T10:00:00.000Z'), link: { label: 'Details' } }
    const [result] = buildNewsStream([item], [])

    expect(result.link).toBeNull()
  })

  it('returns an empty stream for empty input', () => {
    expect(buildNewsStream([], [])).toEqual([])
  })
})
