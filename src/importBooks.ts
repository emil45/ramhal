import { randomUUID } from 'node:crypto'
import { unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { getImportBookUrlSlug } from './lib/importBookUrlSlug.ts'
import { isRecordedMediaTitle } from './lib/recordedMedia.ts'

import type { Currency } from './lib/currency.ts'
import type { Book } from './payload-types.ts'
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

export type ImportView = {
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

// A legacy shelf breadcrumb is evidence of a book's LANGUAGE, never of its
// category (docs/DECISIONS.md §13) — hebrew-books/french-books/english-books
// no longer exist as categories to assign. siddurim-machzorim and cd-dvd
// aren't languages, so they're handled separately below, not through this map.
const SHELF_LANGUAGE: Record<string, SiteKey> = {
  'ספרים בעברית': 'he',
  'Hebrew Books': 'he',
  'Livres en hébreu': 'he',
  'ספרים בצרפתית': 'fr',
  'French Books': 'fr',
  'Livres en français': 'fr',
  'ספרים באנגלית': 'en',
  'English Books': 'en',
  'Livres en anglais': 'en',
}

// Shelves the institute no longer sells online. A book filed under one of
// these — or titled like a recording, see isRecordedMediaTitle — is skipped on
// import, so a re-import never resurrects what was deleted from the catalogue.
const DISCONTINUED_SHELF_LABELS: readonly string[] = ['CD/DVD']

// The legacy sites never had a Siddurim/Machzorim shelf of their own — every
// canonical prayer book was filed under the plain Hebrew-books breadcrumb.
// siddurim-machzorim is a distinction this catalogue draws that the legacy
// sites didn't, so it can only come from a human reading the title, not from
// the scraped breadcrumb.
const REVIEWED_CATEGORY_SLUG: Readonly<Record<string, string>> = {
  'מחזור כיפור רמחל חדש צבע חום': 'siddurim-machzorim',
  'מחזור כיפור רמחל חדש צבע לבן': 'siddurim-machzorim',
  'מחזור רה לרמחל': 'siddurim-machzorim',
  'סידור כוונות לשבת כריכת עור מהודרת פורמט גדול': 'siddurim-machzorim',
  'סידור שבת פורמט קטן': 'siddurim-machzorim',
  'he:סידור כוונות לימות החול (פורמט קטן)': 'siddurim-machzorim',
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
 * bookLanguage priority: the legacy shelf breadcrumb, when one of the three
 * sites filed it under a language-specific shelf (SHELF_LANGUAGE —
 * siddurim-machzorim and cd-dvd don't imply a language, so they're not in
 * that map). Falling back to script detection on the title when no shelf
 * says so — true for most of the catalogue (83 of 167 site-entries have no
 * breadcrumb at all, mainly on the English site, which carries none).
 * Hebrew script is a confident signal (see the reconciliation report: the
 * English and French sites mostly sell Hebrew-titled books) and returns
 * 'he'. Latin script is NOT a confident signal — it cannot distinguish
 * French from English (a real defect once filed French titles such as
 * "La voix des justes" as English) — so it returns 'unknown' rather than
 * guessing.
 */
function deriveBookLanguage(categories: Partial<Record<SiteKey, string | null>>, titles: string[]): BookLanguage {
  for (const raw of Object.values(categories)) {
    const language = raw ? SHELF_LANGUAGE[raw] : undefined
    if (language) return language
  }
  if (titles.some((t) => HAS_HEBREW.test(t))) return 'he'
  return 'unknown'
}

/**
 * A title's key in `titles` is the SITE it was scraped from, not the
 * language of the text — the son's Hebrew books are sometimes cross-listed
 * on the French or English legacy storefronts with no separate Hebrew-site
 * entry, so `titles` can hold `{ fr: "<hebrew text>" }` with no `he` key at
 * all. Writing that straight to Payload's `fr` locale, as the site key
 * suggests, buried the book's actual (Hebrew) title where the admin's
 * default Hebrew locale would never see it — found by a real data audit.
 * This reassigns any Hebrew-script title to
 * the `he` locale regardless of which site it came from; the first one
 * found wins per locale, so a book already correctly matched to a real `he`
 * site entry is untouched, and a duplicate Hebrew string on a second site is
 * dropped rather than also written under that site's own key — a missing
 * translation must read as absent, not backfilled with the same Hebrew text
 * relabelled as French or English.
 */
export function localizeTitles(titles: Partial<Record<SiteKey, string>>): Partial<Record<SiteKey, string>> {
  const result: Partial<Record<SiteKey, string>> = {}
  for (const site of Object.keys(titles) as SiteKey[]) {
    const title = titles[site]
    if (title === undefined) continue
    const locale: SiteKey = HAS_HEBREW.test(title) ? 'he' : site
    if (!(locale in result)) result[locale] = title
  }
  return result
}

const SITE_PREFERENCE: SiteKey[] = ['he', 'fr', 'en']

/**
 * The first candidate cover image across sites, in a fixed site order for
 * determinism. parse.mjs has already stripped site-wide chrome (nav icons,
 * "other products" sidebar thumbnails) from these lists, so what's left —
 * when anything is — is that page's own product image. Old-site quality,
 * kept anyway rather than dropped, since a weak real photo still beats none.
 */
function pickCoverImageUrl(images: Partial<Record<SiteKey, string[]>>): string | null {
  for (const site of SITE_PREFERENCE) {
    const url = images[site]?.[0]
    if (url) return url
  }
  return null
}

function isDiscontinuedShelf(categories: Partial<Record<SiteKey, string | null>>): boolean {
  return Object.values(categories).some((raw) => raw && DISCONTINUED_SHELF_LABELS.includes(raw))
}

function priceRows(prices: Partial<Record<SiteKey, Price | null>>): { amount: number; currency: Currency }[] {
  const rows: { amount: number; currency: Currency }[] = []
  for (const price of Object.values(prices)) {
    if (!price) continue
    const currency = CURRENCY_CODE[price.currency]
    if (!currency) continue
    // Prices scrape as major-unit decimals already (e.g. 55.00); round to the
    // cent to drop any float noise from the scraper's own parsing.
    rows.push({ amount: Math.round(price.value * 100) / 100, currency })
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
  urlSlug: string | undefined
}

export function buildBookInput(rawImportKey: string, view: ImportView, rawTitles: Partial<Record<SiteKey, string>>, reviewNote: string | null): BookInput | null {
  // www.ramhal.com's five book-category pages are the catalogue source of
  // truth (docs/DECISIONS.md §12). frramhal.com and enramhal.com may enrich
  // a matched canonical book, but a listing found only on those hosts is
  // stale catalogue drift and must never create a book of its own.
  if (!view.legacyUrls.some(({ site }) => site === 'he')) return null

  const importKey = rawImportKey
  const prices = priceRows(view.prices)
  if (prices.length === 0) return null // nothing to import — see the report for how many, if any

  if (isDiscontinuedShelf(view.categories)) return null
  if (Object.values(rawTitles).some(isRecordedMediaTitle)) return null

  const titles = localizeTitles(rawTitles)
  const bookLanguage = deriveBookLanguage(view.categories, Object.values(titles))

  const reasons: ReviewReason[] = []
  if (view.missingDescriptionIn.length > 0) reasons.push('missing-description')
  if (view.priceImplausible) reasons.push('price-mismatch')
  if (reviewNote) reasons.push('ambiguous-match')
  if (!('he' in titles) && (('fr' in titles) || ('en' in titles))) reasons.push('absent-from-hebrew')
  if (bookLanguage === 'unknown') reasons.push('language-uncertain')
  if (view.priceZero) reasons.push('zero-price')

  // Category says what KIND of work a book is, never its language
  // (docs/DECISIONS.md §13) — a legacy shelf is evidence for bookLanguage
  // above, never for category. The only source of a category is a human
  // reading the title and recognising a siddur or machzor; every other book
  // is left uncategorised.
  const categorySlug = REVIEWED_CATEGORY_SLUG[importKey] ?? null

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
    urlSlug: getImportBookUrlSlug(importKey),
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
 * The price rows a re-import would add to an already-existing book: any
 * currency the candidate has that the existing record doesn't, added
 * alongside what's there. Never replaces an existing currency's amount —
 * that's exactly the kind of admin edit upsertBook otherwise refuses to
 * touch. This is what turns a REVIEWED_DUPLICATE_IMPORT_KEY entry into a
 * real merge: the survivor keeps its own price(s), and gains whichever ones
 * only the (now-deleted) duplicate had.
 */
export function newPriceRowsFor(
  existingPrices: readonly { amount: number; currency: Currency }[],
  candidatePrices: readonly { amount: number; currency: Currency }[],
): { amount: number; currency: Currency }[] {
  const existingCurrencies = new Set(existingPrices.map((price) => price.currency))
  return candidatePrices.filter((price) => !existingCurrencies.has(price.currency))
}

/**
 * Idempotent, keyed on importKey.
 *
 * On a NEW importKey: creates the book with every field below.
 * On an EXISTING importKey: unions in any legacyUrls not already on the
 * record, and any price in a currency the record doesn't already have (see
 * newPriceRowsFor — this is how REVIEWED_DUPLICATE_IMPORT_KEY's merges bring
 * over a price the survivor was missing). Nothing else is touched — not
 * title, description, category, bookLanguage, needsReview, nor
 * reviewReasons/reviewNote. Those are exactly the fields the admin (the son)
 * is expected to edit once a book is flagged; a re-run that overwrote them
 * would silently erase that work every time the reconciliation is
 * regenerated.
 */
type UpsertResult = { cover?: CoverResult; status: 'created' | 'prices-added' | 'unchanged' | 'urls-added' }

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
        // slug — is enforced unique across the whole catalogue. Three reviewed
        // legacy-title collisions have stable `-2` overrides; every other book
        // lets the hook generate this from its title.
        slug: '',
        urlSlug: input.urlSlug ?? '',
        description: input.descriptions[primaryLocale]
          ? toLexicalRichText(input.descriptions[primaryLocale] as string)
          : undefined,
        bookLanguage: input.bookLanguage,
        category: categoryId,
        prices: input.prices,
        // Required in the field config; defaultValue: 1 applies at runtime,
        // but the generated type doesn't know that — see shippingUnits' own
        // comment in Books.ts.
        shippingUnits: 1,
        // No publication date exists anywhere in the legacy sites' data.
        // Left unset rather than stamped with import time, which would make
        // the entire back catalogue read as newly published.
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
  const newPrices = newPriceRowsFor(existingDoc.prices, input.prices)
  if (newUrls.length === 0 && newPrices.length === 0) return { status: 'unchanged' }

  await payload.update({
    collection: 'books',
    id: existingDoc.id,
    data: {
      legacyUrls: [...(existingDoc.legacyUrls ?? []), ...newUrls.map((url) => ({ url }))],
      prices: [...existingDoc.prices, ...newPrices],
    },
  })
  return { status: newUrls.length > 0 ? 'urls-added' : 'prices-added' }
}

export type ImportSummary = {
  ambiguous: number
  confident: number
  coversAttached: number
  coversMissing: number
  created: number
  pricesAdded: number
  singleton: number
  skipped: string[]
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
    pricesAdded: 0,
    coversAttached: 0,
    coversMissing: 0,
    skipped: [],
  }

  async function run(input: BookInput | null, label: string, bucket: 'confident' | 'singleton' | 'ambiguous') {
    if (!input) {
      summary.skipped.push(label)
      return
    }
    summary[bucket]++
    const result = await upsertBook(payload, input, categoryIds)
    if (result.status === 'created') {
      summary.created++
      if (result.cover === 'attached') summary.coversAttached++
      else summary.coversMissing++
    } else if (result.status === 'urls-added') summary.urlsAdded++
    else if (result.status === 'prices-added') summary.pricesAdded++
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
