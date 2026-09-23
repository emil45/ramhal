import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { DEFAULT_LOCALE, LOCALES } from '@/lib/locale'

import type { Where } from 'payload'
import type { Book, Category } from '@/payload-types'
import type { Locale } from '@/lib/locale'

/**
 * What a catalogue card, the homepage strip and the courses page read — and
 * nothing more. Every field is used by ProductCard, CoverImage, PriceTag,
 * the catalogue's sort/filter helpers or the courses page; description and
 * gallery in particular are absent on purpose, since they are the bulk of a
 * book document and no card renders them.
 */
const CARD_FIELDS_SELECT = {
  id: true,
  urlSlug: true,
  bookLanguage: true,
  prices: true,
  publishedAt: true,
  cover: true,
  category: true,
} as const

type CardBookFields = Pick<Book, 'id' | 'urlSlug' | 'bookLanguage' | 'prices' | 'publishedAt' | 'cover' | 'category'>

type DisplayFields = { category: Category | null; displayTitle: string }

export type CatalogueBook = Omit<CardBookFields, 'category'> & DisplayFields

/** The whole book, for its own page. */
export type CatalogueBookDetail = Omit<Book, 'category'> & DisplayFields

type TitlesByLocale = Partial<Record<Locale, string>>

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
 * shape). The casts document that gap rather than hiding one.
 */
type AllLocalesShape = { id: number; title: unknown }

async function titlesByLocale(where?: Where): Promise<Map<number, TitlesByLocale>> {
  const payload = await payloadClient()
  const { docs } = (await payload.find({
    collection: 'books',
    locale: 'all',
    depth: 0,
    pagination: false,
    select: { title: true },
    where,
  })) as { docs: AllLocalesShape[] }

  return new Map(docs.map((doc) => [doc.id, (doc.title ?? {}) as TitlesByLocale]))
}

function displayFields(
  book: { id: number; category?: number | Category | null },
  titles: Map<number, TitlesByLocale>,
  locale: Locale,
): DisplayFields {
  return {
    category: typeof book.category === 'object' ? book.category : null,
    displayTitle: bestAcrossLocales(titles.get(book.id) ?? {}, locale),
  }
}

/**
 * Every book, card-sized. Wrapped in React's `cache()` so the several
 * components of one render that ask for the list pay for it once.
 */
export const getCatalogueBooks = cache(async (locale: Locale): Promise<CatalogueBook[]> => {
  const payload = await payloadClient()

  const [content, titles] = await Promise.all([
    payload.find({
      collection: 'books',
      locale,
      fallbackLocale: false,
      depth: 1,
      pagination: false,
      select: CARD_FIELDS_SELECT,
    }),
    titlesByLocale(),
  ])

  return content.docs.map((book) => ({ ...book, ...displayFields(book, titles, locale) }))
})

/**
 * urlSlug is not localized — one column, identical in every locale — so
 * this single query is every book page's route parameter in all three
 * locales. It is deliberately not getCatalogueBooks: building the route
 * list needs no titles, prices or covers.
 */
export const getBookUrlSlugs = cache(async (): Promise<string[]> => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'books',
    depth: 0,
    pagination: false,
    select: { urlSlug: true },
  })
  return docs.map((book) => book.urlSlug)
})

/**
 * Fetches exactly one book — a book page must never cost a whole-catalogue
 * read. urlSlug is enforced unique at the database level
 * (src/collections/Books.ts), so `limit: 2` exists only to notice a second
 * match: that can only mean the constraint was bypassed outside Payload — a
 * real data bug, not a case to resolve by picking one silently. Throwing is
 * the correct behaviour: AGENTS.md is explicit that a caught failure must be
 * handled or allowed to throw, never swallowed.
 */
export const getCatalogueBookBySlug = cache(
  async (locale: Locale, slug: string): Promise<CatalogueBookDetail | null> => {
    const payload = await payloadClient()
    const where: Where = { urlSlug: { equals: slug } }

    const [content, titles] = await Promise.all([
      payload.find({ collection: 'books', locale, fallbackLocale: false, depth: 1, limit: 2, where }),
      titlesByLocale(where),
    ])

    if (content.docs.length > 1) {
      throw new Error(
        `Data integrity: ${content.docs.length} books share the canonical URL slug "${slug}" ` +
          `(ids ${content.docs.map((book) => book.id).join(', ')}). urlSlug is supposed to be unique across the ` +
          'whole catalogue — see src/collections/Books.ts.',
      )
    }

    const [book] = content.docs
    return book ? { ...book, ...displayFields(book, titles, locale) } : null
  },
)
