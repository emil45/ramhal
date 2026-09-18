import { notFound } from 'next/navigation'

import { CatalogueClient } from '@/components/storefront/CatalogueClient'
import { getDictionary } from '@/app/(frontend)/dictionary'
import { getCatalogueBooks, getCategories } from '@/lib/booksData'
import { isLocale } from '@/lib/locale'

// Revalidated periodically rather than on every request — see
// docs/tasks/TASK-06-storefront.md §7 ("static per locale, revalidated on
// publish"). Wiring an afterChange hook to trigger on-demand revalidation
// immediately on publish is left for a follow-up — see docs/reports/TASK-06.md.
export const revalidate = 3600

export default async function CataloguePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale)
  const [books, categories] = await Promise.all([getCatalogueBooks(locale), getCategories(locale)])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 font-serif text-2xl font-semibold text-teal-deep">{dict.catalogue.title}</h1>
      <CatalogueClient books={books} categories={categories} locale={locale} />
    </div>
  )
}
