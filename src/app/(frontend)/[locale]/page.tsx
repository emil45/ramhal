import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { NewsBand } from '@/components/storefront/NewsBand'
import { NewsCard } from '@/components/storefront/NewsCard'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { PageImage } from '@/components/storefront/blocks/PageImage'
import { ProductCard } from '@/components/storefront/ProductCard'
import { buttonVariants } from '@/components/ui/button'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { getActiveAnnouncements } from '@/lib/announcementsData'
import { selectFeaturedBooks, selectNewBooks, sortCatalogue } from '@/lib/availability'
import { getCatalogueBooks } from '@/lib/booksData'
import { getUpcomingEvents } from '@/lib/eventsData'
import { buildNewsStream } from '@/lib/homeStream'
import { isLocale, LOCALE_CONFIG } from '@/lib/locale'
import { getPageBySlug } from '@/lib/pagesData'
import { cataloguePath, localePath } from '@/lib/routes'
import { getSchedule } from '@/lib/scheduleData'

import type { Media } from '@/payload-types'

// Same revalidation window as the catalogue and book pages (docs/DECISIONS.md §5).
export const revalidate = 3600

const BOOK_STRIP_COUNT = 6

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale)
  const { currency, intlTag } = LOCALE_CONFIG[locale]

  const [books, announcements, events, schedule, beitRamhalPage] = await Promise.all([
    getCatalogueBooks(locale),
    getActiveAnnouncements(locale),
    getUpcomingEvents(locale),
    getSchedule(locale),
    getPageBySlug('beit-ramhal', locale),
  ])
  const studyHallImage = beitRamhalPage?.heroImage as Media | null

  const newBooks = selectNewBooks(books, currency, BOOK_STRIP_COUNT)
  const newsStream = buildNewsStream(announcements, events, new Date())
  // "New books" is a claim about dates, so it only appears once books carry
  // one. Until then the strip is plainly a selection from the catalogue.
  const stripBooks = newBooks.length > 0 ? newBooks : selectFeaturedBooks(sortCatalogue(books, currency), currency, BOOK_STRIP_COUNT)
  const stripTitle = newBooks.length > 0 ? dict.home.newBooksTitle : dict.home.fromCatalogueTitle
  const shiurim = schedule.shiurim ?? []
  const prayers = schedule.prayers ?? []

  return (
    <div className="flex flex-col">
      <NewsBand item={newsStream[0]} intlTag={intlTag} moreLabel={dict.home.newsBandMore} />

      {/* 1. Masthead: who the institute is, and the way to its books. */}
      <section className="border-b border-border bg-paper-deep">
        <div className="page-container py-10 md:py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-10 lg:gap-14">
            <div className="flex flex-col items-start gap-5 md:w-[42%] md:shrink-0">
              <p className="flex items-center gap-3 text-sm font-semibold text-gold-ink">
                <span aria-hidden className="h-0.5 w-8 bg-gold" />
                {dict.home.since}
              </p>
              <h1 className="type-display">{dict.nav.home}</h1>
              <p className="max-w-xl text-lg leading-relaxed text-foreground md:text-xl">{dict.home.tagline}</p>
              <div className="mt-2 flex flex-wrap justify-start gap-3">
                <Link href={cataloguePath(locale)} className={buttonVariants({ size: 'lg' })}>
                  {dict.home.browseCatalogue}
                </Link>
                <Link href={localePath(locale, '/ramhal')} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
                  {dict.nav.ramhal}
                </Link>
              </div>
            </div>

            <span aria-hidden className="hidden h-64 w-px shrink-0 bg-gold/40 md:block" />

            <div className="relative flex aspect-[4/3] min-w-0 flex-1 flex-col overflow-hidden border border-gold/40 bg-teal-deep md:aspect-[3/2] lg:aspect-video">
              <div className="relative min-h-0 flex-[3]">
                {studyHallImage ? (
                  <PageImage
                    media={studyHallImage}
                    alt=""
                    fill
                    sizes="(min-width: 1152px) 594px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                    priority
                  />
                ) : null}
              </div>
              <div className="relative min-h-0 flex-1 border-t border-gold/70">
                <Image
                  src="/home/books-shelf-original.jpg"
                  alt=""
                  fill
                  sizes="(min-width: 1152px) 594px, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
              <span aria-hidden className="pointer-events-none absolute inset-2 border border-paper/45" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. One visitor-facing stream; announcements and events remain distinct in the admin. */}
      {newsStream.length > 0 ? (
        <section id="news" className="page-container scroll-mt-8 py-12">
          <SectionHeading>{dict.home.newsTitle}</SectionHeading>
          <ul className="flex flex-col gap-4">
            {newsStream.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <NewsCard item={item} intlTag={intlTag} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 3. A strip of books — "new books" once they carry dates, otherwise a plain selection
          from the catalogue (src/lib/availability.ts). Never claims more than it knows. */}
      {stripBooks.length > 0 ? (
        <section className="page-container py-12">
          <SectionHeading
            action={
              <Link href={cataloguePath(locale)} className="pb-0.5 text-sm font-medium text-teal underline-offset-4 hover:underline">
                {dict.home.viewAllBooks}
              </Link>
            }
          >
            {stripTitle}
          </SectionHeading>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
            {stripBooks.map((book) => (
              <ProductCard key={book.id} book={book} dict={dict} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 4. The standing shiur/prayer schedule — one global, already seeded, previously rendered nowhere. */}
      {shiurim.length > 0 || prayers.length > 0 ? (
        <section id="schedule" className="page-container scroll-mt-8 py-12">
          <SectionHeading>{dict.home.scheduleTitle}</SectionHeading>
          <div className="grid gap-8 sm:grid-cols-2">
            {shiurim.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{dict.home.shiurimTitle}</h3>
                <ul className="flex flex-col gap-2 text-sm">
                  {shiurim.map((shiur, index) => (
                    <li key={index} className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
                      <span>
                        <span className="font-medium text-foreground">{shiur.title}</span>
                        <span className="text-muted-foreground"> · {shiur.days}</span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">{shiur.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {prayers.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{dict.home.prayersTitle}</h3>
                <ul className="flex flex-col gap-2 text-sm">
                  {prayers.map((prayer, index) => (
                    <li key={index} className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
                      <span className="font-medium text-foreground">{prayer.name}</span>
                      <span className="text-muted-foreground">{prayer.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

    </div>
  )
}
