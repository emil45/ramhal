import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import { DEFAULT_LOCALE, LOCALES } from '@/lib/locale'

import type { Book, Category } from '@/payload-types'
import type { Locale } from '@/lib/locale'

export type CatalogueBook = Omit<Book, 'category'> & {
  category: Category | null
  displaySlug: string
  displayTitle: string
}

async function payloadClient() {
  return getPayload({ config })
}

/**
 * Best available value across locales — current locale first, then the
 * default locale, then whichever locale actually has one. Title and slug
 * are structural: every catalogue card needs a name and a working link, so
 * they fall back. Description is real editorial content and never does —
 * see docs/tasks/TASK-06-storefront.md §3a and src/collections/Books.ts's
 * own comment on why description has no fallback.
 */
function bestAcrossLocales(byLocale: Partial<Record<Locale, string | null | undefined>>, locale: Locale): string {
  for (const candidate of [locale, DEFAULT_LOCALE, ...LOCALES]) {
    const value = byLocale[candidate]
    if (value) return value
  }
  return ''
}

/**
 * `locale: 'all'` returns each localized field as a { [locale]: value }
 * object instead of a single string — a real Payload Local API mode, but
 * one the generated types don't model (they only describe the single-locale
 * shape). The cast documents that gap rather than hiding one.
 */
type AllLocalesShape = { id: number; slug: unknown; title: unknown }

export async function getCatalogueBooks(locale: Locale): Promise<CatalogueBook[]> {
  const payload = await payloadClient()

  const [content, structural] = await Promise.all([
    payload.find({ collection: 'books', locale, fallbackLocale: false, depth: 1, limit: 500 }),
    payload.find({
      collection: 'books',
      locale: 'all',
      depth: 0,
      limit: 500,
      select: { slug: true, title: true },
    }) as Promise<{ docs: AllLocalesShape[] }>,
  ])

  const structuralById = new Map(structural.docs.map((doc) => [doc.id, doc]))

  return content.docs.map((book) => {
    const fields = structuralById.get(book.id)
    const titles = (fields?.title ?? {}) as Partial<Record<Locale, string>>
    const slugs = (fields?.slug ?? {}) as Partial<Record<Locale, string>>

    return {
      ...book,
      category: typeof book.category === 'object' ? book.category : null,
      displayTitle: bestAcrossLocales(titles, locale),
      displaySlug: bestAcrossLocales(slugs, locale),
    }
  })
}

export async function getCatalogueBookBySlug(locale: Locale, slug: string): Promise<CatalogueBook | null> {
  const books = await getCatalogueBooks(locale)
  return books.find((book) => book.displaySlug === slug) ?? null
}

export async function getCategories(locale: Locale): Promise<Category[]> {
  const payload = await payloadClient()
  const result = await payload.find({ collection: 'categories', locale, limit: 100, sort: 'title' })
  return result.docs
}
