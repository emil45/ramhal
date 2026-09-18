import { randomUUID } from 'node:crypto'
import { unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import type { Currency } from '@/lib/currency'
import type { Book } from '@/payload-types'
import type { Payload } from 'payload'

// ---------------------------------------------------------------------------
// Shape of scripts/scrape/out/reconciliation.json — only the fields this
// import actually reads. See scripts/scrape/reconcile.mjs for how it's built.
// ---------------------------------------------------------------------------

type SiteKey = 'en' | 'fr' | 'he'

// bookLanguage is a superset of SiteKey: 'unknown' is an honest admission
// that a Latin-script title with no shelf category could be French or
// English — see deriveBookLanguage.
type BookLanguage = SiteKey | 'unknown'

type Price = { currency: string; raw: string; value: number }

type Page = {
  breadcrumb: string[] | null
  media: { images: { alt: string | null; src: string }[] }
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
  images: Partial<Record<SiteKey, string[]>>
  legacyUrls: { site: SiteKey; url: string }[]
  missingDescriptionIn: SiteKey[]
  priceImplausible: boolean
  priceZero: boolean
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

const CURRENCY_CODE: Record<string, Currency> = { $: 'USD', '€': 'EUR', '₪': 'ILS', EUR: 'EUR', ILS: 'ILS', USD: 'USD' }

const HAS_HEBREW = /[֐-׿]/

/**
 * Wraps plain text in the minimal valid Lexical document shape richtext-lexical
 * expects (verified against its own slate/plugin migration converters —
 * @payloadcms/richtext-lexical/dist/features/migrations/*​/converter/index.js —
 * rather than guessed; a root/paragraph/text node each need their own
 * direction/format/indent/version fields, not just `type` and `children`).
 */
function toLexicalRichText(text: string): NonNullable<Book['description']> {
  const direction: 'ltr' | 'rtl' = HAS_HEBREW.test(text) ? 'rtl' : 'ltr'
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
 * the English site, which carries none). Hebrew script is a confident
 * signal (see the reconciliation report: the English and French sites
 * mostly sell Hebrew-titled books) and returns 'he'. Latin script is NOT a
 * confident signal — it cannot distinguish French from English (see
 * docs/reviews/REVIEW-01-findings.md #7, which caught French titles such as
 * "La voix des justes" being filed as English) — so it returns 'unknown'
 * rather than guessing.
 */
function deriveBookLanguage(categories: Partial<Record<SiteKey, string | null>>, titles: string[]): BookLanguage {
  for (const raw of Object.values(categories)) {
    const slug = raw ? CATEGORY_SLUG[raw] : undefined
    const language = slug ? CATEGORY_TO_LANGUAGE[slug] : undefined
    if (language) return language
  }
  if (titles.some((t) => HAS_HEBREW.test(t))) return 'he'
  return 'unknown'
}

const SITE_PREFERENCE: SiteKey[] = ['he', 'fr', 'en']

/**
 * The first candidate cover image across sites, in a fixed site order for
 * determinism. parse.mjs has already stripped site-wide chrome (nav icons,
 * "other products" sidebar thumbnails) from these lists, so what's left —
 * when anything is — is that page's own product image. Old-site quality,
 * kept anyway; see docs/reviews/REVIEW-01-verdict.md's "THEN" section.
 */
function pickCoverImageUrl(images: Partial<Record<SiteKey, string[]>>): string | null {
  for (const site of SITE_PREFERENCE) {
    const url = images[site]?.[0]
    if (url) return url
  }
  return null
}

function categorySlugOf(categories: Partial<Record<SiteKey, string | null>>): string | null {
  for (const raw of Object.values(categories)) {
    const slug = raw ? CATEGORY_SLUG[raw] : undefined
    if (slug) return slug
  }
  return null
}

function priceRows(prices: Partial<Record<SiteKey, Price | null>>): { amount: number; currency: Currency }[] {
  const rows: { amount: number; currency: Currency }[] = []
  for (const price of Object.values(prices)) {
    if (!price) continue
    const currency = CURRENCY_CODE[price.currency]
    if (!currency) continue
    rows.push({ amount: Math.round(price.value * 100), currency })
  }
  return rows
}

async function categoryIdBySlug(payload: Payload): Promise<Map<string, number>> {
  const result = await payload.find({ collection: 'categories', limit: 100 })
  const map = new Map<string, number>()
  for (const doc of result.docs) map.set(doc.slug, doc.id)
  return map
}

type ReviewReason = NonNullable<Book['reviewReasons']>[number]

type BookInput = {
  bookLanguage: BookLanguage
  categorySlug: string | null
  coverImageUrl: string | null
  descriptions: Partial<Record<SiteKey, string | null>>
  importKey: string
  legacyUrls: string[]
  prices: { amount: number; currency: Currency }[]
  reviewNote: string | null
  reviewReasons: ReviewReason[]
  titles: Partial<Record<SiteKey, string>>
}

function isSiteKey(language: BookLanguage): language is SiteKey {
  return language !== 'unknown'
}

function buildBookInput(importKey: string, view: ImportView, titles: Partial<Record<SiteKey, string>>, reviewNote: string | null): BookInput | null {
  const prices = priceRows(view.prices)
  if (prices.length === 0) return null // nothing to import — see the report for how many, if any

  const bookLanguage = deriveBookLanguage(view.categories, Object.values(titles))

  const reasons: ReviewReason[] = []
  if (view.missingDescriptionIn.length > 0) reasons.push('missing-description')
  if (view.priceImplausible) reasons.push('price-mismatch')
  if (reviewNote) reasons.push('ambiguous-match')
  if (!('he' in titles) && (('fr' in titles) || ('en' in titles))) reasons.push('absent-from-hebrew')
  if (bookLanguage === 'unknown') reasons.push('language-uncertain')
  if (view.priceZero) reasons.push('zero-price')

  // Falls back to the language-named category — hebrew-books, french-books,
  // english-books — only when bookLanguage is actually known. When it isn't
  // (Latin script, no breadcrumb), there is no honest category to assign
  // either: the legacy sites' own categories ARE those three language
  // shelves, so guessing one would repeat the same mistake. `category` is
  // not required for exactly this reason — left blank and flagged instead.
  const categorySlug = categorySlugOf(view.categories) ?? (isSiteKey(bookLanguage) ? LANGUAGE_TO_CATEGORY[bookLanguage] : null)

  return {
    importKey,
    titles,
    descriptions: view.descriptions,
    prices,
    categorySlug,
    coverImageUrl: pickCoverImageUrl(view.images),
    bookLanguage,
    legacyUrls: [...new Set(view.legacyUrls.map((u) => u.url))],
    reviewReasons: [...new Set(reasons)],
    reviewNote,
  }
}

/**
 * Downloads a candidate cover image to a temp file for Payload's upload
 * collection to read (Payload's Local API takes a `filePath`, not raw
 * bytes). Returns null — never throws — on a non-2xx response or a network
 * error: these are old, external URLs, and a 404 among them should skip
 * that one book's cover, not fail the whole import run.
 */
async function downloadToTempFile(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    const extension = path.extname(new URL(url).pathname) || '.jpg'
    const tempPath = path.join(os.tmpdir(), `ramhal-cover-${randomUUID()}${extension}`)
    await writeFile(tempPath, buffer)
    return tempPath
  } catch {
    return null
  }
}

type CoverResult = 'attached' | 'fetch-failed' | 'no-candidate'

/** Only called on a newly created book — a cover, like every other field an
 * import writes at creation, is not re-attempted or overwritten on a rerun
 * (see upsertBook's own comment). */
async function attachCover(payload: Payload, bookId: number | string, locale: SiteKey, alt: string, coverImageUrl: string | null): Promise<CoverResult> {
  if (!coverImageUrl) return 'no-candidate'

  const tempPath = await downloadToTempFile(coverImageUrl)
  if (!tempPath) return 'fetch-failed'

  try {
    const media = await payload.create({ collection: 'media', locale, data: { alt }, filePath: tempPath })
    // Same locale as the book's own creation — required, localized fields
    // (title, slug) validate against whichever locale is in play, and a book
    // absent from Hebrew (see reviewReasons) has no 'he' title to validate.
    await payload.update({ collection: 'books', id: bookId, locale, data: { cover: media.id } })
    return 'attached'
  } finally {
    await unlink(tempPath).catch(() => {})
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
type UpsertResult = { cover?: CoverResult; status: 'created' | 'unchanged' | 'urls-added' }

async function upsertBook(payload: Payload, input: BookInput, categoryIds: Map<string, number>): Promise<UpsertResult> {
  const existing = await payload.find({
    collection: 'books',
    where: { importKey: { equals: input.importKey } },
    limit: 1,
  })

  if (existing.docs.length === 0) {
    const categoryId = input.categorySlug ? categoryIds.get(input.categorySlug) : undefined
    // Hebrew is this project's default locale (see AGENTS.md) — used only as
    // the last-resort fallback below, which candidate.sites in practice
    // never leaves empty.
    const primaryLocale: SiteKey = (Object.keys(input.titles)[0] as SiteKey | undefined) ?? 'he'

    const created = await payload.create({
      collection: 'books',
      locale: primaryLocale,
      data: {
        title: input.titles[primaryLocale] ?? Object.values(input.titles)[0] ?? '',
        // Required in the field config, but generateSlugFromTitle (a
        // beforeValidate hook) always fills a blank one from the title
        // above — see src/collections/hooks/generateSlugFromTitle.ts. urlSlug
        // reuses the same hook (see src/collections/Books.ts's own comment)
        // to become this book's one canonical public URL, and — unlike
        // slug — is enforced unique across the whole catalogue: a title that
        // collides with an existing book's urlSlug makes this create() throw,
        // which is deliberate (docs/tasks/TASK-07-storefront.md §A1).
        slug: '',
        urlSlug: '',
        description: input.descriptions[primaryLocale]
          ? toLexicalRichText(input.descriptions[primaryLocale] as string)
          : undefined,
        bookLanguage: input.bookLanguage,
        category: categoryId,
        prices: input.prices,
        // Required in the field config; defaultValue: 1 applies at runtime,
        // but the generated type doesn't know that — see docs/DECISIONS.md
        // §1, shippingUnits' own comment in Books.ts.
        shippingUnits: 1,
        // No publication date exists anywhere in the legacy sites' data — see
        // docs/reviews/REVIEW-01-findings.md #12. Left unset rather than
        // stamped with import time, which would make the entire back
        // catalogue read as newly published.
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

    const cover = await attachCover(payload, created.id, primaryLocale, created.title ?? '', input.coverImageUrl)

    return { status: 'created', cover }
  }

  const existingDoc = existing.docs[0]
  const existingUrls = new Set((existingDoc.legacyUrls ?? []).map((row: { url: string }) => row.url))
  const newUrls = input.legacyUrls.filter((url) => !existingUrls.has(url))
  if (newUrls.length === 0) return { status: 'unchanged' }

  await payload.update({
    collection: 'books',
    id: existingDoc.id,
    data: {
      legacyUrls: [...(existingDoc.legacyUrls ?? []), ...newUrls.map((url) => ({ url }))],
    },
  })
  return { status: 'urls-added' }
}

export type ImportSummary = {
  ambiguous: number
  confident: number
  coversAttached: number
  coversMissing: number
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
    coversAttached: 0,
    coversMissing: 0,
    skippedNoPrice: [],
  }

  async function run(input: BookInput | null, label: string, bucket: 'confident' | 'singleton' | 'ambiguous') {
    if (!input) {
      summary.skippedNoPrice.push(label)
      return
    }
    summary[bucket]++
    const result = await upsertBook(payload, input, categoryIds)
    if (result.status === 'created') {
      summary.created++
      if (result.cover === 'attached') summary.coversAttached++
      else summary.coversMissing++
    } else if (result.status === 'urls-added') summary.urlsAdded++
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
        images: { [member.site]: page.media.images.map((img) => img.src) },
        legacyUrls: entry.pages.map((p) => ({ site: member.site, url: p.url })),
        missingDescriptionIn: page.product.description ? [] : [member.site],
        priceImplausible: false, // single site — nothing to compare against
        priceZero: page.product.price?.value === 0,
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
