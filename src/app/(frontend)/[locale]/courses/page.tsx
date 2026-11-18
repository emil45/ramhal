import { ListVideo, Play } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getDictionary } from '@/app/(frontend)/dictionary'
import { CoverImage } from '@/components/storefront/CoverImage'
import { LessonCard } from '@/components/storefront/LessonCard'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { buttonVariants } from '@/components/ui/button'
import { getCatalogueBooks } from '@/lib/books/booksData'
import { getSocialLinks } from '@/lib/content/siteSettingsData'
import { socialLinkForPlatform, youtubePlaylistsUrl } from '@/lib/content/socialLinks'
import { editionForLocale } from '@/lib/courses/courses'
import { getCourses, getCoursesPageText } from '@/lib/courses/coursesData'
import { playlistUrl, playlistVideoUrl, videoThumbnailUrl } from '@/lib/courses/youtubeLinks'
import { isLocale } from '@/lib/locale/locale'
import { bookPath } from '@/lib/locale/routes'

const CONTENT = {
  he: { youtubeChannel: 'לערוץ ביוטיוב', seriesTitle: 'סדרות השיעורים', book: 'הספר בחנות' },
  en: { youtubeChannel: 'YouTube channel', seriesTitle: 'Lesson series', book: 'Book in the store' },
  fr: { youtubeChannel: 'Chaîne YouTube', seriesTitle: 'Séries de cours', book: 'Livre en boutique' },
} as const

export async function generateMetadata({ params }: PageProps<'/[locale]/courses'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const pageText = await getCoursesPageText(locale)
  return { title: pageText.title, description: pageText.metaDescription }
}

export default async function CoursesPage({ params }: PageProps<'/[locale]/courses'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const content = CONTENT[locale]
  const dict = getDictionary(locale)
  const [pageText, courses, books, socialLinks] = await Promise.all([
    getCoursesPageText(locale),
    getCourses(locale),
    getCatalogueBooks(locale),
    getSocialLinks(locale),
  ])
  const booksById = new Map(books.map((book) => [book.id, book]))
  const youtubeLink = socialLinkForPlatform(socialLinks, 'youtube')
  const openingCourse = courses[0]

  return (
    <article>
      <section className="editorial-hero editorial-hero-study">
        <div className="page-container grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div className="flex flex-col items-start gap-5">
            <p className="eyebrow">{dict.home.coursesEyebrow}</p>
            <h1 className="type-display">{pageText.title}</h1>
            {pageText.lead ? (
              <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">{pageText.lead}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
              {openingCourse ? (
                <a
                  href={playlistVideoUrl(openingCourse.firstLessonVideoId, openingCourse.playlistId)}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ size: 'lg' })}
                >
                  <Play className="size-4" fill="currentColor" aria-hidden />
                  {dict.home.watchLesson}
                </a>
              ) : null}
              {youtubeLink ? (
                <a
                  href={youtubePlaylistsUrl(youtubeLink.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  {content.youtubeChannel}
                </a>
              ) : null}
            </div>
          </div>
          {openingCourse ? (
            <a
              href={playlistVideoUrl(openingCourse.firstLessonVideoId, openingCourse.playlistId)}
              target="_blank"
              rel="noreferrer"
              className="group/lesson block"
              aria-label={`${dict.home.watchLesson}: ${openingCourse.title}`}
            >
              <div className="lesson-image">
                <Image
                  src={videoThumbnailUrl(openingCourse.firstLessonVideoId)}
                  alt={`${dict.nav.chriqui}: ${openingCourse.title}`}
                  fill
                  sizes="(min-width: 1024px) 600px, 100vw"
                  priority
                  className="object-cover"
                />
                <span className="lesson-play">
                  <Play fill="currentColor" className="size-5" aria-hidden />
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-border py-4">
                <span className="type-heading">{openingCourse.title}</span>
                <span className="text-sm text-muted-foreground">
                  {dict.home.lessonCount(openingCourse.lessonCount)}
                </span>
              </div>
            </a>
          ) : null}
        </div>
      </section>
      <section className="page-container section-space">
        <SectionHeading eyebrow={dict.nav.chriqui}>{content.seriesTitle}</SectionHeading>
        <div className="grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const book = editionForLocale(
              course.bookIds.flatMap((bookId) => booksById.get(bookId) ?? []),
              locale,
            )
            return (
              <article key={course.id}>
                <LessonCard course={course} locale={locale} />
                <a
                  href={playlistUrl(course.playlistId)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link mt-3"
                >
                  <ListVideo className="size-4" aria-hidden />
                  {dict.bookCourse.playlist}
                </a>
                {book ? (
                  <Link
                    href={bookPath(locale, book.urlSlug)}
                    className="group/cover mt-4 flex items-center gap-3 border-t border-border pt-4"
                  >
                    <span className="w-10 shrink-0">
                      <CoverImage
                        book={{ bookLanguage: book.bookLanguage, categorySlug: book.category?.slug }}
                        cover={typeof book.cover === 'object' ? book.cover : null}
                        sizes="40px"
                        title={book.displayTitle}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-muted-foreground">{content.book}</span>
                      <span className="line-clamp-2 text-base font-medium text-teal">
                        {book.displayTitle}
                      </span>
                    </span>
                  </Link>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>
    </article>
  )
}
