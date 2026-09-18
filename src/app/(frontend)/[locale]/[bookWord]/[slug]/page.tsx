import { notFound } from 'next/navigation'

import { AddToCartButton } from '@/components/storefront/AddToCartButton'
import { CoverImage } from '@/components/storefront/CoverImage'
import { PriceTag } from '@/components/storefront/PriceTag'
import { RichText } from '@/components/storefront/RichText'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { isPurchasable } from '@/lib/availability'
import { getCatalogueBookBySlug, getCatalogueBooks } from '@/lib/booksData'
import { BOOK_SEGMENT } from '@/lib/routes'
import { isLocale, LOCALE_CONFIG, LOCALES } from '@/lib/locale'

export const revalidate = 3600

export async function generateStaticParams() {
  const params: { bookWord: string; locale: string; slug: string }[] = []
  for (const locale of LOCALES) {
    const books = await getCatalogueBooks(locale)
    for (const book of books) {
      if (book.displaySlug) params.push({ locale, bookWord: BOOK_SEGMENT[locale], slug: book.displaySlug })
    }
  }
  return params
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
  const book = await getCatalogueBookBySlug(locale, slug)
  if (!book) notFound()

  const currency = LOCALE_CONFIG[locale].currency
  const purchasable = isPurchasable(book, currency)

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-8 sm:grid-cols-[240px_1fr]">
      <div className="mx-auto w-48 sm:mx-0 sm:w-full">
        <CoverImage
          categorySlug={book.category?.slug}
          cover={typeof book.cover === 'object' ? book.cover : null}
          sizes="240px"
          title={book.displayTitle}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-teal-deep">{book.displayTitle}</h1>
          {book.subtitle ? <p className="mt-1 text-muted-foreground">{book.subtitle}</p> : null}
        </div>

        <div className="text-lg">
          <PriceTag book={book} dict={dict} locale={locale} />
        </div>

        {purchasable ? (
          <div>
            <AddToCartButton bookId={book.id} locale={locale} />
          </div>
        ) : (
          <div className="rounded-md border border-border bg-secondary/50 p-4 text-sm">
            <p className="font-medium text-foreground">{dict.book.unavailableTitle}</p>
            <p className="mt-1 text-muted-foreground">{dict.book.unavailableBody}</p>
            <a href="mailto:info@machon-ramhal.org" className="mt-2 inline-block text-teal underline-offset-4 hover:underline">
              {dict.book.contactUs}
            </a>
          </div>
        )}

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-border pt-4 text-sm">
          {book.category ? (
            <>
              <dt className="text-muted-foreground">{dict.book.category}</dt>
              <dd>{book.category.title}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">{dict.book.language}</dt>
          <dd>{dict.bookLanguageLabel[book.bookLanguage]}</dd>
          {book.hebrewYear ? (
            <>
              <dt className="text-muted-foreground">{dict.book.hebrewYear}</dt>
              <dd>{book.hebrewYear}</dd>
            </>
          ) : null}
          {book.isbn ? (
            <>
              <dt className="text-muted-foreground">{dict.book.isbn}</dt>
              <dd>{book.isbn}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">{dict.book.publisher}</dt>
          <dd>{dict.book.publisherValue}</dd>
        </dl>

        {book.description ? (
          <div className="border-t border-border pt-4">
            <RichText content={book.description} />
          </div>
        ) : null}

        <p className="border-t border-border pt-4 text-xs text-muted-foreground">{dict.book.shippingNote}</p>
      </div>
    </div>
  )
}
