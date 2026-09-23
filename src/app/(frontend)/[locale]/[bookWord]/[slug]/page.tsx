import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AddToCartButton } from '@/components/storefront/AddToCartButton'
import { BookCourseCallout } from '@/components/storefront/BookCourseCallout'
import { CoverImage } from '@/components/storefront/CoverImage'
import { PriceTag } from '@/components/storefront/PriceTag'
import { RichText } from '@/components/storefront/RichText'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { isPurchasable } from '@/lib/availability'
import { getBookUrlSlugs, getCatalogueBookBySlug } from '@/lib/booksData'
import { BOOK_SEGMENT, cataloguePath } from '@/lib/routes'
import { getContactDetails } from '@/lib/siteSettingsData'
import { fullBookCourseForBook } from '@/lib/fullBookCourses'
import { isLocale, LOCALE_CONFIG, LOCALES } from '@/lib/locale'

export const revalidate = 3600

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

  const currency = LOCALE_CONFIG[locale].currency
  const purchasable = isPurchasable(book, currency)
  const course = fullBookCourseForBook(book.urlSlug)

  return (
    <div className="page-container py-8 md:py-12">
      <Link
        href={cataloguePath(locale)}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-teal hover:underline"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {dict.book.backToCatalogue}
      </Link>

      <div className="grid gap-10 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-14">
        <div className="mx-auto w-56 md:mx-0 md:w-full">
          <CoverImage
            book={{ bookLanguage: book.bookLanguage, categorySlug: book.category?.slug }}
            cover={typeof book.cover === 'object' ? book.cover : null}
            sizes="320px"
            title={book.displayTitle}
          />
        </div>

        <div className="flex max-w-2xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="type-title">{book.displayTitle}</h1>
            {book.subtitle ? <p className="text-lg text-muted-foreground">{book.subtitle}</p> : null}
          </div>

          {purchasable ? (
            <div className="flex flex-col gap-5">
              <p className="text-3xl">
                <PriceTag book={book} dict={dict} locale={locale} />
              </p>
              <AddToCartButton bookId={book.id} locale={locale} />
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
                  <a href={`mailto:${contact.email}`} className="mt-1 w-fit font-medium text-teal underline-offset-4 hover:underline">
                    {dict.book.contactUs}
                  </a>
                ) : null}
              </CardContent>
            </Card>
          )}

          {course ? <BookCourseCallout course={course} dict={dict} /> : null}

          <Separator />

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {book.category ? (
              <>
                <dt className="text-muted-foreground">{dict.book.category}</dt>
                <dd>{book.category.title}</dd>
              </>
            ) : null}
            <dt className="text-muted-foreground">{dict.book.language}</dt>
            <dd>{dict.bookLanguageLabel[book.bookLanguage]}</dd>
            {book.creatorCredit ? (
              <>
                <dt className="text-muted-foreground">{dict.book.creatorCredit}</dt>
                <dd>{book.creatorCredit}</dd>
              </>
            ) : null}
            {book.hebrewYear ? (
              <>
                <dt className="text-muted-foreground">{dict.book.hebrewYear}</dt>
                <dd>{book.hebrewYear}</dd>
              </>
            ) : null}
            {book.publicationPlace ? (
              <>
                <dt className="text-muted-foreground">{dict.book.publicationPlace}</dt>
                <dd>{book.publicationPlace}</dd>
              </>
            ) : null}
            {book.extent ? (
              <>
                <dt className="text-muted-foreground">{dict.book.extent}</dt>
                <dd>{book.extent}</dd>
              </>
            ) : null}
            {book.endorsementCredits ? (
              <>
                <dt className="text-muted-foreground">{dict.book.endorsementCredits}</dt>
                <dd>{book.endorsementCredits}</dd>
              </>
            ) : null}
            {book.isbn ? (
              <>
                <dt className="text-muted-foreground">{dict.book.isbn}</dt>
                <dd dir="ltr" className="text-start">
                  {book.isbn}
                </dd>
              </>
            ) : null}
            <dt className="text-muted-foreground">{dict.book.publisher}</dt>
            <dd>{book.publisherName ?? dict.book.publisherValue}</dd>
          </dl>

          {book.description ? (
            <>
              <Separator />
              <RichText content={book.description} />
            </>
          ) : null}

          <p className="text-xs leading-relaxed text-muted-foreground">{dict.book.shippingNote}</p>
        </div>
      </div>
    </div>
  )
}
