import type { Payload } from 'payload'

// ---------------------------------------------------------------------------
// Shape of scripts/scrape/out/reconciliation.json — only the fields this
// import actually reads. See scripts/scrape/reconcile.mjs for how it's built.
// ---------------------------------------------------------------------------

type SiteKey = 'en' | 'fr' | 'he'

type Price = { currency: string; raw: string; value: number }

type Page = {
  breadcrumb: string[] | null
  product: {
    description: string | null
    price: Price | null
    title: string
  }
  url: string
}

type SiteEntry = {
  normTitle: string
  pages: Page[]
  site: SiteKey
  titles: string[]
}

type ImportView = {
  categories: Partial<Record<SiteKey, string | null>>
  descriptions: Partial<Record<SiteKey, string | null>>
  legacyUrls: { site: SiteKey; url: string }[]
  missingDescriptionIn: SiteKey[]
  priceImplausible: boolean
  prices: Partial<Record<SiteKey, Price | null>>
  titles: Partial<Record<SiteKey, string[]>>
}

type MatchedCandidate = {
  bySite: Partial<Record<SiteKey, SiteEntry>>
  import: ImportView
  normTitle: string
  sites: SiteKey[]
}

type AmbiguousMember = { normTitle: string; site: SiteKey; titles: string[] }

type AmbiguousCluster = {
  bySite: Partial<Record<SiteKey, SiteEntry>>
  members: AmbiguousMember[]
}

export type Reconciliation = {
  books: {
    ambiguous: AmbiguousCluster[]
    confident: MatchedCandidate[]
    singleton: MatchedCandidate[]
  }
}

// ---------------------------------------------------------------------------

const CATEGORY_SLUG: Record<string, string> = {
  'ספרים בעברית': 'hebrew-books',
  'Hebrew Books': 'hebrew-books',
  'Livres en hébreu': 'hebrew-books',
  'ספרים בצרפתית': 'french-books',
  'French Books': 'french-books',
  'Livres en français': 'french-books',
  'ספרים באנגלית': 'english-books',
  'English Books': 'english-books',
  'Livres en anglais': 'english-books',
  'סידורים ומחזורים': 'siddurim-machzorim',
  'Siddurim and Machzorim': 'siddurim-machzorim',
  "Sidourim et Ma'hzorim": 'siddurim-machzorim',
  'CD/DVD': 'cd-dvd',
}

const CATEGORY_TO_LANGUAGE: Record<string, SiteKey> = {
  'hebrew-books': 'he',
  'french-books': 'fr',
  'english-books': 'en',
}
const LANGUAGE_TO_CATEGORY: Record<SiteKey, string> = {
  he: 'hebrew-books',
  fr: 'french-books',
  en: 'english-books',
}

const CURRENCY_CODE: Record<string, string> = { $: 'USD', '€': 'EUR', '₪': 'ILS', EUR: 'EUR', ILS: 'ILS', USD: 'USD' }

const HAS_HEBREW = /[֐-׿]/

/**
 * Wraps plain text in the minimal valid Lexical document shape richtext-lexical
 * expects (verified against its own slate/plugin migration converters —
 * @payloadcms/richtext-lexical/dist/features/migrations/*​/converter/index.js —
 * rather than guessed; a root/paragraph/text node each need their own
 * direction/format/indent/version fields, not just `type` and `children`).
 */
function toLexicalRichText(text: string) {
  const direction = HAS_HEBREW.test(text) ? 'rtl' : 'ltr'
  return {
    root: {
      type: 'root',
      direction,
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          direction,
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          version: 1,
          children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
        },
      ],
    },
  }
}

/**
 * bookLanguage priority: the category, when one of the three sites filed it
 * under a language-specific shelf (hebrew-books/french-books/english-books —
 * siddurim-machzorim and cd-dvd don't imply a language). Falling back to
 * script detection on the title when no category says so — true for most of
 * the catalogue (83 of 167 site-entries have no breadcrumb at all, mainly on
 * the English site, which carries none). Hebrew script wins the fallback
 * because that's the overwhelming majority case here (see the reconciliation
 * report: the English and French sites mostly sell Hebrew-titled books).
 */
function deriveBookLanguage(categories: Partial<Record<SiteKey, string | null>>, titles: string[]): SiteKey {
  for (const raw of Object.values(categories)) {
    const slug = raw ? CATEGORY_SLUG[raw] : undefined
    const language = slug ? CATEGORY_TO_LANGUAGE[slug] : undefined
    if (language) return language
  }
  if (titles.some((t) => HAS_HEBREW.test(t))) return 'he'
  return 'en'
}

function categorySlugOf(categories: Partial<Record<SiteKey, string | null>>): string | null {
  for (const raw of Object.values(categories)) {
    const slug = raw ? CATEGORY_SLUG[raw] : undefined
    if (slug) return slug
  }
  return null
}

function priceRows(prices: Partial<Record<SiteKey, Price | null>>): { amount: number; currency: string }[] {
  const rows: { amount: number; currency: string }[] = []
  for (const price of Object.values(prices)) {
    if (!price) continue
    const currency = CURRENCY_CODE[price.currency]
    if (!currency) continue
    rows.push({ amount: Math.round(price.value * 100), currency })
  }
  return rows
}

async function categoryIdBySlug(payload: Payload): Promise<Map<string, number | string>> {
  const result = await payload.find({ collection: 'categories', limit: 100 })
  const map = new Map<string, number | string>()
  for (const doc of result.docs) map.set(doc.slug, doc.id)
  return map
}

type BookInput = {
  bookLanguage: SiteKey
  categorySlug: string
  descriptions: Partial<Record<SiteKey, string | null>>
  importKey: string
  legacyUrls: string[]
  prices: { amount: number; currency: string }[]
  reviewNote: string | null
  reviewReasons: string[]
  titles: Partial<Record<SiteKey, string>>
}

function buildBookInput(importKey: string, view: ImportView, titles: Partial<Record<SiteKey, string>>, reviewNote: string | null): BookInput | null {
  const prices = priceRows(view.prices)
  if (prices.length === 0) return null // nothing to import — see the report for how many, if any

  const reasons: string[] = []
  if (view.missingDescriptionIn.length > 0) reasons.push('missing-description')
  if (view.priceImplausible) reasons.push('price-mismatch')
  if (reviewNote) reasons.push('ambiguous-match')
  if (!('he' in titles) && (('fr' in titles) || ('en' in titles))) reasons.push('absent-from-hebrew')

  const bookLanguage = deriveBookLanguage(view.categories, Object.values(titles))
  // `category` is required, but most site-entries carry no breadcrumb to
  // derive one from (83 of 167 — mainly the English site, which has none at
  // all). Falling back to the language-named category — hebrew-books,
  // french-books, english-books — that bookLanguage already resolved to,
  // since those three categories mean exactly "books in this language" in
  // the real taxonomy (see src/seed.ts's CATEGORIES).
  const categorySlug = categorySlugOf(view.categories) ?? LANGUAGE_TO_CATEGORY[bookLanguage]

  return {
    importKey,
    titles,
    descriptions: view.descriptions,
    prices,
    categorySlug,
    bookLanguage,
    legacyUrls: [...new Set(view.legacyUrls.map((u) => u.url))],
    reviewReasons: [...new Set(reasons)],
    reviewNote,
  }
}

/**
 * Idempotent, keyed on importKey.
 *
 * On a NEW importKey: creates the book with every field below.
 * On an EXISTING importKey: only unions in any legacyUrls not already on the
 * record. Nothing else is touched — not title, description, prices,
 * category, bookLanguage, needsReview, nor reviewReasons/reviewNote. Those
 * are exactly the fields the admin (the son) is expected to edit once a book
 * is flagged; a re-run that overwrote them would silently erase that work
 * every time the reconciliation is regenerated.
 */
async function upsertBook(payload: Payload, input: BookInput, categoryIds: Map<string, number | string>): Promise<'created' | 'unchanged' | 'urls-added'> {
  const existing = await payload.find({
    collection: 'books',
    where: { importKey: { equals: input.importKey } },
    limit: 1,
  })

  if (existing.docs.length === 0) {
    const categoryId = categoryIds.get(input.categorySlug)
    const primaryLocale: SiteKey = (Object.keys(input.titles)[0] as SiteKey | undefined) ?? input.bookLanguage

    const created = await payload.create({
      collection: 'books',
      locale: primaryLocale,
      data: {
        title: input.titles[primaryLocale] ?? Object.values(input.titles)[0] ?? '',
        description: input.descriptions[primaryLocale]
          ? toLexicalRichText(input.descriptions[primaryLocale] as string)
          : undefined,
        bookLanguage: input.bookLanguage,
        category: categoryId,
        prices: input.prices,
        publishedAt: new Date().toISOString(),
        legacyUrls: input.legacyUrls.map((url) => ({ url })),
        needsReview: input.reviewReasons.length > 0,
        reviewReasons: input.reviewReasons,
        reviewNote: input.reviewNote ?? undefined,
        importKey: input.importKey,
      },
    })

    for (const [locale, title] of Object.entries(input.titles) as [SiteKey, string][]) {
      if (locale === primaryLocale) continue
      await payload.update({
        collection: 'books',
        id: created.id,
        locale,
        data: {
          title,
          description: input.descriptions[locale] ? toLexicalRichText(input.descriptions[locale] as string) : undefined,
        },
      })
    }

    return 'created'
  }

  const existingDoc = existing.docs[0]
  const existingUrls = new Set((existingDoc.legacyUrls ?? []).map((row: { url: string }) => row.url))
  const newUrls = input.legacyUrls.filter((url) => !existingUrls.has(url))
  if (newUrls.length === 0) return 'unchanged'

  await payload.update({
    collection: 'books',
    id: existingDoc.id,
    data: {
      legacyUrls: [...(existingDoc.legacyUrls ?? []), ...newUrls.map((url) => ({ url }))],
    },
  })
  return 'urls-added'
}

export type ImportSummary = {
  ambiguous: number
  confident: number
  created: number
  singleton: number
  skippedNoPrice: string[]
  unchanged: number
  urlsAdded: number
}

export async function importBooks(payload: Payload, reconciliation: Reconciliation): Promise<ImportSummary> {
  const categoryIds = await categoryIdBySlug(payload)
  const summary: ImportSummary = {
    confident: 0,
    singleton: 0,
    ambiguous: 0,
    created: 0,
    unchanged: 0,
    urlsAdded: 0,
    skippedNoPrice: [],
  }

  async function run(input: BookInput | null, label: string, bucket: 'confident' | 'singleton' | 'ambiguous') {
    if (!input) {
      summary.skippedNoPrice.push(label)
      return
    }
    summary[bucket]++
    const result = await upsertBook(payload, input, categoryIds)
    if (result === 'created') summary.created++
    else if (result === 'urls-added') summary.urlsAdded++
    else summary.unchanged++
  }

  for (const candidate of reconciliation.books.confident) {
    const titles: Partial<Record<SiteKey, string>> = {}
    for (const site of candidate.sites) titles[site] = candidate.import.titles[site]?.[0] ?? candidate.normTitle
    const input = buildBookInput(candidate.normTitle, candidate.import, titles, null)
    await run(input, candidate.normTitle, 'confident')
  }

  for (const candidate of reconciliation.books.singleton) {
    const titles: Partial<Record<SiteKey, string>> = {}
    for (const site of candidate.sites) titles[site] = candidate.import.titles[site]?.[0] ?? candidate.normTitle
    const input = buildBookInput(candidate.normTitle, candidate.import, titles, null)
    await run(input, candidate.normTitle, 'singleton')
  }

  for (const cluster of reconciliation.books.ambiguous) {
    for (const member of cluster.members) {
      const entry = cluster.bySite[member.site]
      if (!entry) continue
      const page = entry.pages[0]
      const view: ImportView = {
        categories: { [member.site]: page.breadcrumb && page.breadcrumb.length >= 2 ? page.breadcrumb[page.breadcrumb.length - 2] : null },
        descriptions: { [member.site]: page.product.description },
        legacyUrls: entry.pages.map((p) => ({ site: member.site, url: p.url })),
        missingDescriptionIn: page.product.description ? [] : [member.site],
        priceImplausible: false, // single site — nothing to compare against
        prices: { [member.site]: page.product.price },
        titles: { [member.site]: member.titles },
      }
      const counterpart = cluster.members.find((m) => m !== member)
      const note = counterpart
        ? `Possible duplicate of "${counterpart.titles[0]}" (${counterpart.site}), similarity flagged but not auto-merged.`
        : null
      const input = buildBookInput(`${member.site}:${member.normTitle}`, view, { [member.site]: member.titles[0] }, note)
      await run(input, `${member.site}:${member.normTitle}`, 'ambiguous')
    }
  }

  return summary
}
