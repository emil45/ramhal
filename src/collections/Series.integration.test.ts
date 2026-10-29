import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { SKIP_STOREFRONT_REVALIDATION } from '@/collections/hooks/revalidateStorefront'
import { getCoursesForBook } from '@/lib/coursesData'
import { cleanUpTestRun, createTestBook, startTestRun } from '@/test/checkoutFixtures'

import type { Book, Series } from '@/payload-types'

const run = startTestRun()
const books: Book[] = []
const seriesIds: number[] = []
let book: Book

const PLAYLIST_ID = 'PLtestPlaylistIdentifier0123456789ab'
const VIDEO_ID = 'abcDEF12345'

beforeAll(async () => {
  book = await createTestBook(run)
  books.push(book)
})

afterAll(async () => {
  const payload = await getPayload({ config })
  for (const id of seriesIds) {
    await payload.delete({ collection: 'series', id, context: SKIP_STOREFRONT_REVALIDATION })
  }
  await cleanUpTestRun(run, books)
})

async function createSeries(data: Partial<Series>): Promise<Series> {
  const payload = await getPayload({ config })
  const series = await payload.create({
    collection: 'series',
    locale: 'he',
    data: {
      title: `סדרת בדיקה ${run.id}`,
      lessonCount: 12,
      youtubePlaylistId: PLAYLIST_ID,
      firstLessonYoutubeId: VIDEO_ID,
      ...data,
    },
    context: SKIP_STOREFRONT_REVALIDATION,
  })
  seriesIds.push(series.id)
  return series
}

describe('a series of lessons', () => {
  it('stores the bare identifiers when the editor pastes whole YouTube links', async () => {
    const series = await createSeries({
      youtubePlaylistId: `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`,
      firstLessonYoutubeId: `https://www.youtube.com/watch?v=${VIDEO_ID}&list=${PLAYLIST_ID}`,
    })

    expect(series.youtubePlaylistId).toBe(PLAYLIST_ID)
    expect(series.firstLessonYoutubeId).toBe(VIDEO_ID)
  })

  it('refuses a value that is not a YouTube link', async () => {
    await expect(createSeries({ firstLessonYoutubeId: 'https://example.com/video' })).rejects.toThrow()
  })

  it('is found from the book it teaches, and from no other', async () => {
    const series = await createSeries({ relatedBooks: [book.id] })

    const forBook = await getCoursesForBook('he', book.id)
    expect(forBook.map((course) => course.id)).toEqual([series.id])
    expect(forBook[0]).toMatchObject({ lessonCount: 12, playlistId: PLAYLIST_ID, firstLessonVideoId: VIDEO_ID })

    expect(await getCoursesForBook('he', book.id + 1_000_000)).toEqual([])
  })
})
