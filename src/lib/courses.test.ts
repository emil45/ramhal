import { describe, expect, it } from 'vitest'

import { editionForLocale, toCourse } from '@/lib/courses'

import type { Series } from '@/payload-types'

const BASE_SERIES: Series = {
  id: 7,
  title: 'אדיר במרום',
  displayTitle: 'אדיר במרום',
  displayTitleLocale: 'he',
  relatedBooks: [11, 12],
  youtubePlaylistId: 'PLI4WtgHMTlAfFGjt4FyO7CokQoy6t6B8v',
  firstLessonYoutubeId: '4PY4qSHWN3I',
  lessonCount: 208,
  updatedAt: '2026-10-29T00:00:00.000Z',
  createdAt: '2026-10-29T00:00:00.000Z',
}

describe('toCourse', () => {
  it('keeps the identifiers the storefront builds its links from', () => {
    expect(toCourse(BASE_SERIES)).toEqual({
      id: 7,
      title: 'אדיר במרום',
      lessonCount: 208,
      playlistId: 'PLI4WtgHMTlAfFGjt4FyO7CokQoy6t6B8v',
      firstLessonVideoId: '4PY4qSHWN3I',
      bookIds: [11, 12],
    })
  })

  it('shows the title the editor did write when the current language has none', () => {
    expect(toCourse({ ...BASE_SERIES, title: null, displayTitle: 'Adir BaMarom' }).title).toBe('Adir BaMarom')
  })

  it('tolerates a course with no book', () => {
    expect(toCourse({ ...BASE_SERIES, relatedBooks: null }).bookIds).toEqual([])
  })
})

describe('editionForLocale', () => {
  const hebrew = { id: 1, bookLanguage: 'he' as const }
  const french = { id: 2, bookLanguage: 'he-fr' as const }

  it('sends French visitors to a French edition and everyone else to the Hebrew one', () => {
    expect(editionForLocale([hebrew, french], 'fr')).toBe(french)
    expect(editionForLocale([french, hebrew], 'he')).toBe(hebrew)
    expect(editionForLocale([french, hebrew], 'en')).toBe(hebrew)
  })

  it('falls back to the first edition listed when none suits the language', () => {
    expect(editionForLocale([hebrew], 'fr')).toBe(hebrew)
    expect(editionForLocale([french], 'he')).toBe(french)
  })

  it('finds nothing for a course with no book', () => {
    expect(editionForLocale([], 'he')).toBeUndefined()
  })
})
