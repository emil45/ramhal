import { ArrowUpRight, CirclePlay, ListVideo, Play } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CoverImage } from '@/components/storefront/CoverImage'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getCatalogueBooks } from '@/lib/booksData'
import {
  firstLessonThumbnailUrl,
  firstLessonUrl,
  FULL_BOOK_COURSES,
  playlistUrl,
  preferredBookSlug,
} from '@/lib/fullBookCourses'
import { isLocale } from '@/lib/locale'
import { bookPath } from '@/lib/routes'
import { getSocialLinks } from '@/lib/siteSettingsData'
import { socialLinkForPlatform, youtubePlaylistsUrl } from '@/lib/socialLinks'

const CONTENT = {
  he: {
    metadataDescription:
      'סדרות שיעורים מלאות בספרי הרמח״ל מפי הרב מרדכי שריקי, מן השיעור הראשון ועד סיום הספר.',
    title: 'שיעורים מלאים בספרי הרמח״ל',
    lead: 'הרב מרדכי שריקי מלמד את הספרים מתחילתם ועד סופם.',
    youtubeChannel: 'לערוץ ביוטיוב',
    seriesTitle: 'סדרות השיעורים',
    lessons: (count: number) => `${count} שיעורים`,
    start: 'לשיעור הראשון',
    playlist: 'לכל השיעורים',
    book: 'הספר בחנות',
    thumbnailAlt: (title: string) => `השיעור הראשון בסדרת ${title}`,
  },
  en: {
    metadataDescription:
      'Complete lesson series on the Ramhal’s books taught by Rabbi Mordechai Chriqui, from the first lesson to the end of each work.',
    title: 'Complete lessons on the Ramhal’s books',
    lead: 'Rabbi Mordechai Chriqui teaches each work from beginning to end.',
    youtubeChannel: 'YouTube channel',
    seriesTitle: 'Lesson series',
    lessons: (count: number) => `${count} lessons`,
    start: 'Start with lesson one',
    playlist: 'All lessons',
    book: 'Book in the store',
    thumbnailAlt: (title: string) => `First lesson in the ${title} series`,
  },
  fr: {
    metadataDescription:
      'Séries complètes de cours sur les livres du Ramhal par le Rav Mordekhaï Chriqui, du premier cours jusqu’à la fin de l’ouvrage.',
    title: 'Étude complète des livres du Ramhal',
    lead: 'Le Rav Mordekhaï Chriqui enseigne chaque ouvrage du début à la fin.',
    youtubeChannel: 'Chaîne YouTube',
    seriesTitle: 'Séries de cours',
    lessons: (count: number) => `${count} cours`,
    start: 'Commencer par le premier cours',
    playlist: 'Tous les cours',
    book: 'Livre en boutique',
    thumbnailAlt: (title: string) => `Premier cours de la série ${title}`,
  },
} as const

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/courses'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  return {
    title: CONTENT[locale].title,
    description: CONTENT[locale].metadataDescription,
  }
}

export default async function CoursesPage({
  params,
}: PageProps<'/[locale]/courses'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const content = CONTENT[locale]
  const [books, socialLinks] = await Promise.all([getCatalogueBooks(locale), getSocialLinks(locale)])
  const booksBySlug = new Map(books.map((book) => [book.urlSlug, book]))
  const youtubeLink = socialLinkForPlatform(socialLinks, 'youtube')

  return (
    <article>
      <section className="border-b border-border bg-paper-deep">
        <div className="page-container py-12 lg:py-16">
          <div className="flex max-w-3xl flex-col items-start gap-5">
            <h1 className="type-display">{content.title}</h1>
            <p className="max-w-2xl text-xl leading-relaxed sm:text-2xl">
              {content.lead}
            </p>
            {youtubeLink ? (
              <div className="pt-2">
                <a
                  href={youtubePlaylistsUrl(youtubeLink.url)}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: 'outline', size: 'lg' })}
                >
                  <CirclePlay data-icon="inline-start" aria-hidden />
                  {content.youtubeChannel}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="page-container py-12 lg:py-16">
        <div className="mb-10 max-w-3xl">
          <div className="relative border-b border-border pb-3">
            <h2 className="type-heading">{content.seriesTitle}</h2>
            <span
              aria-hidden
              className="absolute start-0 -bottom-px h-[3px] w-16 bg-gold"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {FULL_BOOK_COURSES.map((course, courseIndex) => {
            const bookSlug = preferredBookSlug(course, locale)
            const book = bookSlug ? booksBySlug.get(bookSlug) : undefined

            return (
              <Card
                key={course.id}
                className="gap-0 rounded-[2px] border border-border py-0 ring-0"
              >
                <a
                  href={firstLessonUrl(course)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${content.start}: ${course.title[locale]}`}
                  className="group/video block outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
                >
                  <AspectRatio
                    ratio={16 / 9}
                    className="relative overflow-hidden bg-muted"
                  >
                    <Image
                      src={firstLessonThumbnailUrl(course)}
                      alt={content.thumbnailAlt(course.title[locale])}
                      fill
                      loading={courseIndex === 0 ? 'eager' : 'lazy'}
                      sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-200 group-hover/video:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover/video:scale-100"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex size-12 items-center justify-center rounded-full border border-gold bg-background/95 text-teal shadow-sm transition-transform group-hover/video:scale-105 motion-reduce:transition-none motion-reduce:group-hover/video:scale-100">
                        <Play
                          className="size-5"
                          fill="currentColor"
                          aria-hidden
                        />
                      </span>
                    </span>
                  </AspectRatio>
                </a>

                <CardContent className="flex flex-1 flex-col items-start p-5">
                  <h3 className="type-subheading text-teal-deep">
                    {course.title[locale]}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ListVideo className="size-4 text-gold-ink" aria-hidden />
                    {content.lessons(course.lessonCount)}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <a
                      href={firstLessonUrl(course)}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({ size: 'sm' })}
                    >
                      <Play
                        data-icon="inline-start"
                        fill="currentColor"
                        aria-hidden
                      />
                      {content.start}
                    </a>
                    <a
                      href={playlistUrl(course)}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({
                        variant: 'outline',
                        size: 'sm',
                      })}
                    >
                      <ListVideo data-icon="inline-start" aria-hidden />
                      {content.playlist}
                    </a>
                  </div>

                  {book ? (
                    <Link
                      href={bookPath(locale, book.urlSlug)}
                      className="group/book mt-5 flex w-full items-center gap-3 border-t border-border pt-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="group/cover w-10 shrink-0">
                        <CoverImage
                          book={{ bookLanguage: book.bookLanguage, categorySlug: book.category?.slug }}
                          cover={
                            typeof book.cover === 'object' ? book.cover : null
                          }
                          sizes="40px"
                          title={book.displayTitle}
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">
                          {content.book}
                        </span>
                        <span className="line-clamp-2 text-sm font-medium text-teal group-hover/book:underline">
                          {book.displayTitle}
                        </span>
                      </span>
                      <ArrowUpRight
                        className="ms-auto size-4 shrink-0 text-teal rtl:-scale-x-100"
                        aria-hidden
                      />
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </article>
  )
}
