import { describe, expect, it } from 'vitest'

import {
  firstLessonUrl,
  firstLessonThumbnailUrl,
  FULL_BOOK_COURSE_LESSON_COUNT,
  FULL_BOOK_COURSES,
  fullBookCourseForBook,
  playlistUrl,
  preferredBookSlug,
} from '@/lib/fullBookCourses'

describe('full book courses', () => {
  it('keeps playlist and first-lesson identifiers unique', () => {
    expect(new Set(FULL_BOOK_COURSES.map((course) => course.playlistId)).size).toBe(FULL_BOOK_COURSES.length)
    expect(new Set(FULL_BOOK_COURSES.map((course) => course.firstLessonYoutubeId)).size).toBe(FULL_BOOK_COURSES.length)
  })

  it('builds a direct first-lesson link that retains the playlist', () => {
    const course = FULL_BOOK_COURSES[0]

    expect(firstLessonUrl(course)).toBe(
      `https://www.youtube.com/watch?v=${course.firstLessonYoutubeId}&list=${course.playlistId}`,
    )
    expect(playlistUrl(course)).toBe(`https://www.youtube.com/playlist?list=${course.playlistId}`)
    expect(firstLessonThumbnailUrl(course)).toBe(`https://i.ytimg.com/vi/${course.firstLessonYoutubeId}/hqdefault.jpg`)
  })

  it('maps every edition of a work back to its course', () => {
    expect(fullBookCourseForBook('דעת-תבונות')?.id).toBe('daat-tevunot')
    expect(fullBookCourseForBook('דעת-תבונות-צרפתית-עברית')?.id).toBe('daat-tevunot')
    expect(fullBookCourseForBook('פינות-המרכבה')?.id).toBe('pinot-hamerkava')
    expect(fullBookCourseForBook('משכני-עליון')?.id).toBe('mishkenei-elyon')
    expect(fullBookCourseForBook('מסילת-ישרים')).toBeNull()
  })

  it('prefers the current locale edition and falls back to Hebrew', () => {
    const daatTevunot = FULL_BOOK_COURSES[0]
    const adirBaMarom = FULL_BOOK_COURSES.find((course) => course.id === 'adir-bamarom')

    expect(preferredBookSlug(daatTevunot, 'fr')).toBe('דעת-תבונות-צרפתית-עברית')
    expect(adirBaMarom && preferredBookSlug(adirBaMarom, 'fr')).toBe('אדיר-במרום-הוצאת-מכון-רמחל')
  })

  it('records the complete library total', () => {
    expect(FULL_BOOK_COURSE_LESSON_COUNT).toBe(795)
  })
})
