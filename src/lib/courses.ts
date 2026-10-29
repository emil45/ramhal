import type { Book, Series } from '@/payload-types'
import type { Locale } from '@/lib/locale'

/** A course as the storefront shows it: a title, a YouTube playlist and the books it teaches. */
export type Course = {
  id: number
  title: string
  lessonCount: number
  playlistId: string
  firstLessonVideoId: string
  bookIds: number[]
}

type BookLanguage = Book['bookLanguage']

const FRENCH_EDITION_LANGUAGES: readonly BookLanguage[] = ['fr', 'he-fr', 'aramaic-fr']

/**
 * A course is entered once, against every edition of its book. The title is
 * structural, like a book's: when the current language has none it shows the
 * one the editor did write rather than an empty card.
 */
export function toCourse(series: Series): Course {
  return {
    id: series.id,
    title: series.title || series.displayTitle || '',
    lessonCount: series.lessonCount,
    playlistId: series.youtubePlaylistId,
    firstLessonVideoId: series.firstLessonYoutubeId,
    bookIds: (series.relatedBooks ?? []).map((book) => (typeof book === 'number' ? book : book.id)),
  }
}

/**
 * The edition of a work to link from a course in the given language: a French
 * visitor is sent to a French edition when there is one; everyone else to a
 * non-French edition, which in practice is the Hebrew original. Falls back to
 * the first edition the editor listed.
 */
export function editionForLocale<Edition extends { bookLanguage: BookLanguage }>(
  editions: readonly Edition[],
  locale: Locale,
): Edition | undefined {
  const isFrench = (edition: Edition) => FRENCH_EDITION_LANGUAGES.includes(edition.bookLanguage)
  const preferred = locale === 'fr' ? editions.find(isFrench) : editions.find((edition) => !isFrench(edition))
  return preferred ?? editions[0]
}
