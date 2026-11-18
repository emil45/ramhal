import { ChevronLeft, PackageCheck, Store, Truck } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AddToCartButton } from '@/components/storefront/AddToCartButton'
import { BookBadges } from '@/components/storefront/BookBadges'
import { BookCourseCallout } from '@/components/storefront/BookCourseCallout'
import { BookColorPicker } from '@/components/storefront/BookColorPicker'
import { BookColorProvider } from '@/components/storefront/BookColorContext'
import { BookImageGallery } from '@/components/storefront/BookImageGallery'
import { BookPreviewButton } from '@/components/storefront/BookPreviewButton'
import { PriceTag } from '@/components/storefront/PriceTag'
import { ProductCard } from '@/components/storefront/ProductCard'
import { RichText } from '@/components/storefront/RichText'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { Card, CardContent } from '@/components/ui/card'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { isPurchasable, selectFeaturedBooks } from '@/lib/books/availability'
import { collectBookImages } from '@/lib/books/bookImages'
import { bookPreviewUrl } from '@/lib/books/bookPreview'
import { getBookUrlSlugs, getCatalogueBookBySlug, getRelatedBooks } from '@/lib/books/booksData'
import { shelfOf } from '@/lib/books/catalogueView'
import { BOOK_SEGMENT, cataloguePath } from '@/lib/locale/routes'
import { getContactDetails } from '@/lib/content/siteSettingsData'
import { getCoursesForBook } from '@/lib/courses/coursesData'
import { isLocale, LOCALE_CONFIG, LOCALES } from '@/lib/locale/locale'
import { findShippingZone } from '@/lib/shop/shipping'
import { getShippingZones } from '@/lib/shop/shippingData'
import { selectSale } from '@/lib/shop/salePrice'

const RELATED_BOOK_COUNT = 4

export async function generateStaticParams() {
  const slugs = await getBookUrlSlugs()
  return LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, bookWord: BOOK_SEGMENT[locale], slug })))
}

export default async function BookPage({ params }: PageProps<'/[locale]/[bookWord]/[slug]'>) {
  const rawParams = await params
  const locale = rawParams.locale
  // Next does not decode non-ASCII dynamic segments (verified: a Hebrew
  // bookWord/slug arrives here still percent-encoded), unlike a normal
  // navigation's resolved pathname — decode explicitly before comparing
  // against real values.
  const bookWord = decodeURIComponent(rawParams.bookWord)
  const slug = decodeURIComponent(rawParams.slug)
  if (!isLocale(locale) || bookWord !== BOOK_SEGMENT[locale]) notFound()

  const dict = getDictionary(locale)
  const [book, contact] = await Promise.all([getCatalogueBookBySlug(locale, slug), getContactDetails(locale)])
  if (!book) notFound()
  const [courses, relatedCandidates, shippingZones] = await Promise.all([
    getCoursesForBook(locale, book.id),
    getRelatedBooks(locale, book),
    getShippingZones(),
  ])

  const { currency, estimatedShippingCountry } = LOCALE_CONFIG[locale]
  const relatedBooks = selectFeaturedBooks(relatedCandidates, currency, RELATED_BOOK_COUNT)
  const shippingZone = findShippingZone(shippingZones, estimatedShippingCountry)
  const sale = selectSale(book, currency)
  const publisher = book.publisherName ?? (shelfOf(book) === 'institute' ? dict.book.publisherValue : null)
  const purchasable = isPurchasable(book, currency)
  const images = collectBookImages(book.cover, book.gallery)
  const previewUrl = bookPreviewUrl(book.previewPdf)
  const colors = (book.colors ?? []).flatMap((color) =>
    color.id ? [{ id: color.id, name: color.name, swatch: color.swatch, images: collectBookImages(null, color.images) }] : [],
  )
  const imageOf = (position: number, total: number) => dict.book.imageOf(position, total)

  return (
    <BookColorProvider firstColorId={colors[0]?.id ?? null}>
      <div className="page-container py-8 md:py-12">
        <nav aria-label={dict.book.breadcrumbLabel} className="mb-8 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={cataloguePath(locale)} className="underline-offset-4 hover:text-teal hover:underline">
                {dict.catalogue.title}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronLeft className="size-4 ltr:rotate-180" />
            </li>
            <li>{dict.catalogue.shelf[shelfOf(book)]}</li>
          </ol>
        </nav>

        <div className="grid gap-10 md:grid-cols-[minmax(0,24rem)_1fr] md:gap-12 lg:grid-cols-[minmax(0,28rem)_1fr] lg:gap-16">
          <div className="relative mx-auto w-full max-w-80 md:max-w-none">
            <BookImageGallery
              book={{ bookLanguage: book.bookLanguage, categorySlug: book.category?.slug }}
              direction={LOCALE_CONFIG[locale].direction}
              images={images}
              colorImages={Object.fromEntries(
                colors.map((color) => [
                  color.id,
                  { images: color.images, thumbnailLabels: color.images.map((_, index) => imageOf(index + 1, color.images.length)) },
                ]),
              )}
              labels={{
                close: dict.book.closeImage,
                images: dict.book.imagesLabel,
                next: dict.gallery.nextImage,
                previous: dict.gallery.previousImage,
                zoom: dict.book.zoomImage,
              }}
              sizes="(min-width: 1024px) 448px, (min-width: 768px) 384px, 320px"
              thumbnailLabels={images.map((_, index) => imageOf(index + 1, images.length))}
              title={book.displayTitle}
            />
            <BookBadges dict={dict} isNew={book.markedNew === true} percentOff={sale?.percentOff ?? null} size="page" />
          </div>

          <div className="flex max-w-2xl flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h1 className="type-title">{book.displayTitle}</h1>
              {book.subtitle ? <p className="font-serif text-xl text-foreground">{book.subtitle}</p> : null}
            </div>

            {purchasable ? (
              <div className="flex flex-col gap-6 border-y border-border py-6">
                <PriceTag book={book} dict={dict} locale={locale} className="text-3xl" />
                {colors.length > 0 ? <BookColorPicker colors={colors} label={dict.book.colorLabel} /> : null}
                <AddToCartButton bookId={book.id} locale={locale} />
                <ul className="flex flex-col gap-2.5 text-sm text-foreground">
                  <li className="flex items-center gap-3">
                    <Truck aria-hidden className="size-5 shrink-0 text-teal" />
                    {dict.book.homeDelivery}
                  </li>
                  {shippingZone.freeAboveUnits !== null ? (
                    <li className="flex items-center gap-3">
                      <PackageCheck aria-hidden className="size-5 shrink-0 text-teal" />
                      {dict.book.freeShippingFrom(shippingZone.freeAboveUnits)}
                    </li>
                  ) : null}
                  {shippingZone.allowPickup ? (
                    <li className="flex items-center gap-3">
                      <Store aria-hidden className="size-5 shrink-0 text-teal" />
                      {dict.book.freePickup}
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : (
              // PriceTag already says a book isn't purchasable in a badge
              // (src/components/storefront/PriceTag.tsx) — this note explains why
              // and what to do, so the price row itself is skipped here.
              <Card size="sm" className="bg-paper-deep">
                <CardContent className="flex flex-col gap-1 text-sm">
                  <p className="font-medium text-foreground">{dict.book.unavailableTitle}</p>
                  <p className="text-muted-foreground">{dict.book.unavailableBody}</p>
                  {contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className="mt-1 inline-flex min-h-12 w-fit items-center font-medium text-teal underline underline-offset-4 hover:text-teal-deep"
                    >
                      {dict.book.contactUs}
                    </a>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {previewUrl ? (
              <BookPreviewButton
                url={previewUrl}
                labels={{
                  close: dict.book.closeImage,
                  openInTab: dict.book.previewOpenInTab,
                  preview: dict.book.preview,
                  title: dict.book.previewTitle(book.displayTitle),
                }}
              />
            ) : null}

            {courses.map((course) => (
              <BookCourseCallout key={course.id} course={course} dict={dict} />
            ))}

            {book.description ? (
              <section className="flex flex-col gap-3">
                <h2 className="type-heading">{dict.book.aboutTitle}</h2>
                <RichText content={book.description} />
              </section>
            ) : null}

            <section className="flex flex-col gap-3">
              <h2 className="type-heading">{dict.book.detailsTitle}</h2>
              <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] text-sm [&>dd]:border-b [&>dd]:border-border [&>dd]:py-2.5 [&>dt]:border-b [&>dt]:border-border [&>dt]:py-2.5 [&>dt]:text-muted-foreground">
                {book.category ? (
                  <>
                    <dt>{dict.book.category}</dt>
                    <dd>{book.category.title}</dd>
                  </>
                ) : null}
                <dt>{dict.book.language}</dt>
                <dd>{dict.bookLanguageLabel[book.bookLanguage]}</dd>
                {book.creatorCredit ? (
                  <>
                    <dt>{dict.book.creatorCredit}</dt>
                    <dd>{book.creatorCredit}</dd>
                  </>
                ) : null}
                {publisher ? (
                  <>
                    <dt>{dict.book.publisher}</dt>
                    <dd>{publisher}</dd>
                  </>
                ) : null}
                {book.hebrewYear ? (
                  <>
                    <dt>{dict.book.hebrewYear}</dt>
                    <dd>{book.hebrewYear}</dd>
                  </>
                ) : null}
                {book.publicationPlace ? (
                  <>
                    <dt>{dict.book.publicationPlace}</dt>
                    <dd>{book.publicationPlace}</dd>
                  </>
                ) : null}
                {book.extent ? (
                  <>
                    <dt>{dict.book.extent}</dt>
                    <dd>{book.extent}</dd>
                  </>
                ) : null}
                {book.endorsementCredits ? (
                  <>
                    <dt>{dict.book.endorsementCredits}</dt>
                    <dd>{book.endorsementCredits}</dd>
                  </>
                ) : null}
                {book.isbn ? (
                  <>
                    <dt>{dict.book.isbn}</dt>
                    <dd dir="ltr" className="text-start">
                      {book.isbn}
                    </dd>
                  </>
                ) : null}
              </dl>
              <p className="text-sm leading-relaxed text-muted-foreground">{dict.book.shippingNote}</p>
            </section>
          </div>
        </div>

        {relatedBooks.length > 0 ? (
          <section className="mt-16 border-t border-border pt-12 md:mt-24">
            <SectionHeading
              action={
                <Link
                  href={cataloguePath(locale)}
                  className="inline-flex min-h-12 items-center px-1 text-base font-medium text-teal underline underline-offset-4 hover:text-teal-deep"
                >
                  {dict.home.viewAllBooks}
                </Link>
              }
            >
              {dict.book.relatedTitle}
            </SectionHeading>
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-4 sm:gap-x-6 lg:gap-x-8">
              {relatedBooks.map((related) => (
                <ProductCard key={related.id} book={related} dict={dict} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </BookColorProvider>
  )
}
