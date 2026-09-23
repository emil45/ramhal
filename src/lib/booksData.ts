import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import { DEFAULT_LOCALE, LOCALES } from '@/lib/locale'

import type { Book, Category } from '@/payload-types'
import type { Locale } from '@/lib/locale'

export type CatalogueBook = Omit<Book, 'category'> & {
  category: Category | null
  displayTitle: string
}

async function payloadClient() {
  return getPayload({ config })
}

/**
 * Best available title across locales — current locale first, then the
 * default locale, then whichever locale actually has one. Title is
 * structural: every catalogue card needs a name, so it falls back.
 * Description is real editorial content and never does — see
 * src/collections/Books.ts's own comment on why description has no
 * fallback. The public URL no longer goes through this fallback at all —
 * see urlSlug's own comment in src/collections/Books.ts.
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
type AllLocalesShape = { id: number; title: unknown }

export async function getCatalogueBooks(locale: Locale): Promise<CatalogueBook[]> {
  const payload = await payloadClient()

  const [content, structural] = await Promise.all([
    payload.find({ collection: 'books', locale, fallbackLocale: false, depth: 1, limit: 500 }),
    payload.find({
      collection: 'books',
      locale: 'all',
      depth: 0,
      limit: 500,
      select: { title: true },
    }) as Promise<{ docs: AllLocalesShape[] }>,
  ])

  const structuralById = new Map(structural.docs.map((doc) => [doc.id, doc]))

  return content.docs.map((book) => {
    const fields = structuralById.get(book.id)
    const titles = (fields?.title ?? {}) as Partial<Record<Locale, string>>

    return {
      ...book,
      category: typeof book.category === 'object' ? book.category : null,
      displayTitle: bestAcrossLocales(titles, locale),
    }
  })
}

/**
 * urlSlug is enforced unique at the database level (src/collections/Books.ts),
 * so two matches here can only mean that constraint was bypassed outside
 * Payload — a real data bug, not a case to resolve by picking one silently.
 * Throwing is the correct behaviour:
 * AGENTS.md is explicit that a caught failure must be handled or allowed to
 * throw, never swallowed.
 */
export async function getCatalogueBookBySlug(locale: Locale, slug: string): Promise<CatalogueBook | null> {
  const books = await getCatalogueBooks(locale)
  const matches = books.filter((book) => book.urlSlug === slug)

  if (matches.length > 1) {
    throw new Error(
      `Data integrity: ${matches.length} books share the canonical URL slug "${slug}" ` +
        `(ids ${matches.map((book) => book.id).join(', ')}). urlSlug is supposed to be unique across the ` +
        'whole catalogue — see src/collections/Books.ts.',
    )
  }

  return matches[0] ?? null
}
