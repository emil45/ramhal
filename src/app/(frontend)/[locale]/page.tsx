import { Play } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getDictionary } from '@/app/(frontend)/dictionary'
import { CoverImage } from '@/components/storefront/CoverImage'
import { LessonCard } from '@/components/storefront/LessonCard'
import { NewsCard } from '@/components/storefront/NewsCard'
import { ProductCard } from '@/components/storefront/ProductCard'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { PageImage } from '@/components/storefront/blocks/PageImage'
import { buttonVariants } from '@/components/ui/button'
import { getCatalogueBookBySlug, getCatalogueBooks } from '@/lib/books/booksData'
import { collectBookImages } from '@/lib/books/bookImages'
import { selectHomeBooks } from '@/lib/books/homeBooks'
import { getAnnouncements } from '@/lib/content/announcementsData'
import { getEvents } from '@/lib/content/eventsData'
import { buildNewsStream } from '@/lib/content/homeStream'
import { getPageBySlug } from '@/lib/content/pagesData'
import { getSchedule } from '@/lib/content/scheduleData'
import { getCourses } from '@/lib/courses/coursesData'
import { isLocale, LOCALE_CONFIG } from '@/lib/locale/locale'
import { bookPath, cataloguePath, coursesPath, localePath } from '@/lib/locale/routes'

const HOME_BOOK_COUNT = 8
const HERO_BOOK_COUNT = 3
const HOME_LESSON_COUNT = 3

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale)
  const { currency, intlTag } = LOCALE_CONFIG[locale]
  const [books, announcements, events, schedule, place, rabbi, courses] = await Promise.all([
    getCatalogueBooks(locale),
    getAnnouncements(locale),
    getEvents(locale),
    getSchedule(locale),
    getPageBySlug('beit-ramhal', locale),
    getPageBySlug('rabbi-chriqui', locale),
    getCourses(locale),
  ])
  const featuredBooks = selectHomeBooks(
    books,
    locale,
    currency,
    courses.flatMap((course) => course.bookIds),
    HOME_BOOK_COUNT,
  )
  const heroBooks = await Promise.all(
    featuredBooks.slice(0, HERO_BOOK_COUNT).map(async (book) => {
      const detail = await getCatalogueBookBySlug(locale, book.urlSlug)
      const images = detail ? collectBookImages(detail.cover, detail.gallery) : []
      return { book, image: images.find((image) => image.filename?.includes('angle')) ?? images[0] }
    }),
  )
  const news = buildNewsStream(announcements, events)
  const studyHallImage = typeof place?.heroImage === 'object' ? place.heroImage : null
  const portrait = typeof rabbi?.heroImage === 'object' ? rabbi.heroImage : null

  return (
    <div>
      <section className="home-hero">
        <div className="page-container home-hero-grid">
          <div className="home-hero-copy">
            <p className="eyebrow">
              {dict.home.heroEyebrow} <span aria-hidden> / </span> {dict.home.since}
            </p>
            <h1 className="type-display home-title">
              {dict.home.heroTitle}
              <span>{dict.home.heroSecondLine}</span>
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
              {dict.home.tagline}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href={cataloguePath(locale)} className={buttonVariants({ size: 'lg' })}>
                {dict.home.browseCatalogue}
              </Link>
              <Link href={coursesPath(locale)} className="text-link">
                <Play className="size-4" aria-hidden />
                {dict.nav.courses}
              </Link>
            </div>
          </div>
          {heroBooks.length > 0 ? (
            <div className="hero-library">
              <div className="hero-book-stage">
                {heroBooks.map(({ book, image }, index) => (
                  <Link
                    key={book.id}
                    href={bookPath(locale, book.urlSlug)}
                    className={`hero-book hero-book-${index + 1}`}
                    aria-label={book.displayTitle}
                  >
                    {image ? (
                      <PageImage
                        media={image}
                        alt={book.displayTitle}
                        fill
                        sizes="(min-width: 1024px) 300px, 40vw"
                        className="object-contain"
                        priority
                      />
                    ) : (
                      <CoverImage
                        book={{ bookLanguage: book.bookLanguage, categorySlug: book.category?.slug }}
                        cover={typeof book.cover === 'object' ? book.cover : null}
                        title={book.displayTitle}
                        sizes="300px"
                        priority
                      />
                    )}
                  </Link>
                ))}
              </div>
              <p className="hero-library-caption">{dict.home.shelfCaption}</p>
            </div>
          ) : null}
        </div>
      </section>

      {featuredBooks.length > 0 ? (
        <section className="page-container section-space">
          <SectionHeading
            eyebrow={dict.home.booksEyebrow}
            description={dict.home.booksIntroduction}
            action={
              <Link href={cataloguePath(locale)} className="text-link">
                {dict.home.viewAllBooks}
              </Link>
            }
          >
            {dict.home.fromCatalogueTitle}
          </SectionHeading>
          <div
            className="home-book-shelf"
            role="region"
            aria-label={dict.home.fromCatalogueTitle}
            tabIndex={0}
          >
            {featuredBooks.map((book) => (
              <ProductCard key={book.id} book={book} dict={dict} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {courses.length > 0 ? (
        <section className="teaching-section section-space">
          <div className="page-container">
            <div className="teaching-intro">
              <div>
                <SectionHeading
                  eyebrow={dict.home.teachingEyebrow}
                  description={dict.home.teachingIntroduction}
                  action={
                    <Link href={coursesPath(locale)} className="text-link">
                      {dict.home.allLessons}
                    </Link>
                  }
                >
                  {dict.home.teachingTitle}
                </SectionHeading>
              </div>
              {portrait ? (
                <Link
                  href={localePath(locale, '/rabbi-chriqui')}
                  className="teaching-portrait"
                  aria-label={dict.home.meetRabbi}
                >
                  <PageImage
                    media={portrait}
                    alt={dict.nav.chriqui}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </Link>
              ) : null}
            </div>
            <div className="grid gap-7 md:grid-cols-3">
              {courses.slice(0, HOME_LESSON_COUNT).map((course) => (
                <LessonCard key={course.id} course={course} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="page-container section-space">
        <div className="place-feature">
          {studyHallImage ? (
            <div className="place-feature-image">
              <PageImage
                media={studyHallImage}
                alt={dict.nav.beitRamhal}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="place-feature-copy">
            <p className="eyebrow">{dict.home.placeEyebrow}</p>
            <h2 className="type-title mt-4">{dict.home.placeTitle}</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {dict.home.placeIntroduction}
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              <Link href={localePath(locale, '/beit-ramhal')} className="text-link">
                {dict.home.discoverPlace}
              </Link>
              <Link href={localePath(locale, '/rabbi-chriqui')} className="text-link">
                {dict.home.meetRabbi}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {news.length > 0 ? (
        <section id="news" className="page-container section-space border-t border-border">
          <SectionHeading eyebrow={dict.home.updatesEyebrow}>{dict.home.updatesTitle}</SectionHeading>
          <ul className="grid gap-6 md:grid-cols-3">
            {news.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <NewsCard item={item} intlTag={intlTag} imageLabel={dict.home.viewAnnouncement} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(schedule.shiurim?.length ?? 0) > 0 || (schedule.prayers?.length ?? 0) > 0 ? (
        <section id="schedule" className="schedule-section">
          <div className="page-container grid gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="eyebrow">{dict.nav.beitRamhal}</p>
              <h2 className="type-title mt-3">{dict.home.visitTitle}</h2>
              <p className="mt-3 text-muted-foreground">{dict.home.visitIntroduction}</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              {[
                {
                  title: dict.home.shiurimTitle,
                  items: (schedule.shiurim ?? []).map((item) => ({
                    title: `${item.title} · ${item.days}`,
                    time: item.time,
                  })),
                },
                {
                  title: dict.home.prayersTitle,
                  items: (schedule.prayers ?? []).map((item) => ({ title: item.name, time: item.time })),
                },
              ]
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <div key={group.title}>
                    <h3 className="mb-3 font-medium text-teal-deep">{group.title}</h3>
                    <ul>
                      {group.items.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 text-sm"
                        >
                          <span>{item.title}</span>
                          <span className="shrink-0 text-muted-foreground">{item.time}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
