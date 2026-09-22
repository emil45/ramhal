import { describe, expect, it } from 'vitest'

import { buildNewsStream } from '@/lib/homeStream'

const NOW = new Date('2026-09-22T12:00:00.000Z')

function announcement(id: number, startsAt: string) {
  return { id, title: `Announcement ${id}`, startsAt }
}

function event(id: number, startsAt: string) {
  return { id, title: `Event ${id}`, startsAt }
}

describe('buildNewsStream', () => {
  it('puts future items before past items', () => {
    const result = buildNewsStream(
      [announcement(1, '2026-09-22T10:00:00.000Z')],
      [event(2, '2026-09-23T10:00:00.000Z')],
      NOW,
    )

    expect(result.map(({ id }) => id)).toEqual(['2', '1'])
  })

  it('sorts future items nearest first', () => {
    const result = buildNewsStream(
      [],
      [event(1, '2026-10-10T10:00:00.000Z'), event(2, '2026-09-23T10:00:00.000Z')],
      NOW,
    )

    expect(result.map(({ id }) => id)).toEqual(['2', '1'])
  })

  it('sorts past items newest first', () => {
    const result = buildNewsStream(
      [announcement(1, '2026-09-01T10:00:00.000Z'), announcement(2, '2026-09-20T10:00:00.000Z')],
      [],
      NOW,
    )

    expect(result.map(({ id }) => id)).toEqual(['2', '1'])
  })

  it('normalises an item with no image and no link', () => {
    const [result] = buildNewsStream([announcement(1, '2026-09-20T10:00:00.000Z')], [], NOW)

    expect(result).toMatchObject({ image: null, link: null, location: null })
  })

  it('drops an incomplete link', () => {
    const item = { ...announcement(1, '2026-09-20T10:00:00.000Z'), link: { label: 'Details' } }
    const [result] = buildNewsStream([item], [], NOW)

    expect(result.link).toBeNull()
  })

  it('returns an empty stream for empty input', () => {
    expect(buildNewsStream([], [], NOW)).toEqual([])
  })
})
