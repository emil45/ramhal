import { notFound } from 'next/navigation'

import { CatalogueClient } from '@/components/storefront/CatalogueClient'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { sortCatalogue } from '@/lib/availability'
import { getCatalogueBooks, getCategories } from '@/lib/booksData'
import { isLocale, LOCALE_CONFIG, LOCALES } from '@/lib/locale'
import { CATALOGUE_SEGMENT } from '@/lib/routes'

// Revalidated periodically rather than on every request — see
// docs/tasks/TASK-06-storefront.md §7 ("static per locale, revalidated on
// publish"). Wiring an afterChange hook to trigger on-demand revalidation
// immediately on publish is left for a follow-up — see docs/reports/TASK-06.md.
export const revalidate = 3600

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
  const [books, categories] = await Promise.all([getCatalogueBooks(locale), getCategories(locale)])
  // Purchasable-in-this-currency books lead; nothing is hidden — see
  // sortCatalogue's own comment and docs/tasks/TASK-07-storefront.md §A2.
  const sorted = sortCatalogue(books, currency)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 font-serif text-2xl font-semibold text-teal-deep">{dict.catalogue.title}</h1>
      <CatalogueClient books={sorted} categories={categories} locale={locale} />
    </div>
  )
}
