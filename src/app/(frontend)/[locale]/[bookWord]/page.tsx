import { notFound } from 'next/navigation'

import { CatalogueClient } from '@/components/storefront/CatalogueClient'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { sortCatalogue } from '@/lib/availability'
import { getCatalogueBooks } from '@/lib/booksData'
import { isLocale, LOCALE_CONFIG, LOCALES } from '@/lib/locale'
import { CATALOGUE_SEGMENT } from '@/lib/routes'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale, bookWord: CATALOGUE_SEGMENT[locale] }))
}

export default async function CataloguePage({ params }: PageProps<'/[locale]/[bookWord]'>) {
  const rawParams = await params
  const locale = rawParams.locale
  // Next does not decode a non-ASCII dynamic segment — see the identical
  // comment on the book-page route, which this mirrors.
  const bookWord = decodeURIComponent(rawParams.bookWord)
  if (!isLocale(locale) || bookWord !== CATALOGUE_SEGMENT[locale]) notFound()

  const dict = getDictionary(locale)
  const { currency } = LOCALE_CONFIG[locale]
  const books = await getCatalogueBooks(locale)
  // Purchasable-in-this-currency books lead; nothing is hidden — see
  // sortCatalogue's own comment.
  const sorted = sortCatalogue(books, currency)

  return (
    <div className="page-container py-10">
      <SectionHeading as="h1">{dict.catalogue.title}</SectionHeading>
      <CatalogueClient books={sorted} locale={locale} />
    </div>
  )
}
