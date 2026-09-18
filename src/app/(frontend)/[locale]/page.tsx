import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ProductCard } from '@/components/storefront/ProductCard'
import { RichText } from '@/components/storefront/RichText'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { getActiveAnnouncements } from '@/lib/announcementsData'
import { selectNewBooks } from '@/lib/availability'
import { getCatalogueBooks } from '@/lib/booksData'
import { getUpcomingEvents } from '@/lib/eventsData'
import { isLocale, LOCALE_CONFIG } from '@/lib/locale'
import { cataloguePath } from '@/lib/routes'
import { getSchedule } from '@/lib/scheduleData'

// Same revalidation window as the catalogue and book pages — see
// docs/tasks/TASK-06-storefront.md §7.
export const revalidate = 3600

const NEW_BOOKS_COUNT = 6

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale)
  const { currency, intlTag } = LOCALE_CONFIG[locale]

  const [books, announcements, events, schedule] = await Promise.all([
    getCatalogueBooks(locale),
    getActiveAnnouncements(locale),
    getUpcomingEvents(locale),
    getSchedule(locale),
  ])

  const newBooks = selectNewBooks(books, currency, NEW_BOOKS_COUNT)
  const shiurim = schedule.shiurim ?? []
  const prayers = schedule.prayers ?? []
  const eventDateFormatter = new Intl.DateTimeFormat(intlTag, { dateStyle: 'long' })

  return (
    <div className="flex flex-col">
      {/* 1. The institute, in one line — not a hero image (docs/tasks/TASK-07-storefront.md §B). */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:text-start">
        <Image src="/logo.png" alt="" width={96} height={96} className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" priority />
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <p className="max-w-xl text-lg leading-relaxed text-foreground">{dict.home.tagline}</p>
          <Link
            href={cataloguePath(locale)}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-deep"
          >
            {dict.home.browseCatalogue}
          </Link>
        </div>
      </section>

      {/* 2. Announcements — nothing dated may ever go stale here (docs/DECISIONS.md §9); the
          section itself disappears rather than render empty. */}
      {announcements.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl border-t border-border px-4 py-8">
          <h2 className="mb-4 font-serif text-xl font-semibold text-teal-deep">{dict.home.announcementsTitle}</h2>
          <ul className="flex flex-col gap-4">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="rounded-md border border-border bg-card p-4">
                <h3 className="font-medium text-foreground">{announcement.title}</h3>
                {announcement.body ? (
                  <div className="mt-2">
                    <RichText content={announcement.body} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 3. New books — purchasable-in-this-currency only, most recent first (src/lib/availability.ts#selectNewBooks). */}
      {newBooks.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl border-t border-border px-4 py-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold text-teal-deep">{dict.home.newBooksTitle}</h2>
            <Link href={cataloguePath(locale)} className="text-sm text-teal underline-offset-4 hover:underline">
              {dict.home.viewAllBooks}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {newBooks.map((book) => (
              <ProductCard key={book.id} book={book} dict={dict} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 4. The standing shiur/prayer schedule — one global, already seeded, previously rendered nowhere. */}
      {shiurim.length > 0 || prayers.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl border-t border-border px-4 py-8">
          <h2 className="mb-4 font-serif text-xl font-semibold text-teal-deep">{dict.home.scheduleTitle}</h2>
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

      {/* 5. Upcoming events — same disappear-if-empty rule as announcements. */}
      {events.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl border-t border-border px-4 py-8">
          <h2 className="mb-4 font-serif text-xl font-semibold text-teal-deep">{dict.home.eventsTitle}</h2>
          <ul className="flex flex-col gap-4">
            {events.map((event) => (
              <li key={event.id} className="rounded-md border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium text-foreground">{event.title}</h3>
                  <span className="text-sm text-muted-foreground">{eventDateFormatter.format(new Date(event.startsAt))}</span>
                </div>
                {event.location ? <p className="mt-1 text-sm text-muted-foreground">{event.location}</p> : null}
                {event.description ? (
                  <div className="mt-2">
                    <RichText content={event.description} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
