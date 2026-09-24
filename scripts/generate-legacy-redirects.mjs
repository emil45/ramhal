#!/usr/bin/env node
// Builds src/lib/legacyRedirects.json — where each URL of the legacy site ramhal.com
// goes on this site — from:
//   - the crawl of the legacy site (scripts/scrape/out/he.json),
//   - Books.legacyUrls in the database DATABASE_URI names (book targets are the
//     book's current urlSlug; URLs of the retired enramhal.com and frramhal.com are skipped),
//   - the hand-written table of non-book equivalents (scripts/legacy-redirects/).
// Output is sorted, so a diff shows exactly which redirects changed. Run it after a
// slug change or a catalogue import (README, "Legacy URLs"). It refuses duplicate
// sources, a legacy URL claimed by two books, hand-table paths that were never
// crawled, and targets that would loop or chain.
//
// Run through vite-node (npm run redirects:generate) for the same reason as
// import:books: the full Payload config cannot be loaded by plain Node.
import { readFile, writeFile } from 'node:fs/promises'

import { getPayload } from 'payload'

import { LEGACY_HOST, normalizeLegacyPath } from '../src/lib/legacyRedirects.ts'
import { bookPath, cataloguePath, coursesPath, donatePath, localePath } from '../src/lib/routes.ts'
import config from '../src/payload.config.ts'
import { PAGE_EQUIVALENCES } from './legacy-redirects/pageEquivalences.mjs'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

const OUTPUT_FILE = new URL('../src/lib/legacyRedirects.json', import.meta.url)
const LOCALE = 'he'

// Not pages of the crawl, but URLs the crawled pages link to or the scraper paginates:
// the site's own home address (`/site/index.asp`, `/?depart_id=…&lat=…`) and the
// category listing's pagination endpoint (scripts/scrape/seeds.mjs, PAGINATION).
const HOME_ALIASES = ['/site/index.asp']
const CATEGORY_LISTING_ALIASES = ['/site/detail/detail/detaildetail.asp']

const PAGE_TARGETS = {
  catalogue: cataloguePath,
  ramhal: (locale) => localePath(locale, '/ramhal'),
  beitRamhal: (locale) => localePath(locale, '/beit-ramhal'),
  rabbiChriqui: (locale) => localePath(locale, '/rabbi-chriqui'),
  donate: donatePath,
  courses: coursesPath,
}

function fail(message) {
  throw new Error(`redirects:generate: ${message}`)
}

function normalized(pathname, origin) {
  const path = normalizeLegacyPath(pathname)
  if (path === null) fail(`${origin}: not valid percent-encoding: ${pathname}`)
  return path
}

// The host of a legacy URL, or null when it is on one of the retired domains.
function legacyPath(url) {
  const { hostname, pathname } = new URL(url)
  if (hostname.replace(/^www\./, '') !== LEGACY_HOST) return null
  return normalized(pathname, url)
}

async function readCrawl() {
  const { pages } = JSON.parse(await readFile(new URL('../scripts/scrape/out/he.json', import.meta.url), 'utf8'))
  const byPath = new Map()
  for (const page of pages) byPath.set(legacyPath(page.url), page)
  return byPath
}

async function readBookLegacyUrls() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'books',
    depth: 0,
    pagination: false,
    select: { urlSlug: true, legacyUrls: true },
  })
  await payload.destroy()
  return docs
}

const redirects = {}
const origins = new Map()

function addRedirect(path, target, origin) {
  if (origins.has(path)) fail(`${path} is claimed twice: by ${origins.get(path)} and by ${origin}`)
  if (path === target) fail(`${path} would redirect to itself (${origin})`)
  origins.set(path, origin)
  redirects[path] = target
}

const crawl = await readCrawl()
const books = await readBookLegacyUrls()

const bookSources = new Set()
for (const book of books) {
  for (const { url } of book.legacyUrls ?? []) {
    const path = legacyPath(url)
    if (path === null) continue
    addRedirect(path, bookPath(LOCALE, book.urlSlug), `book ${book.urlSlug}`)
    bookSources.add(path)
  }
}

const slugs = new Set(books.map((book) => book.urlSlug))
const pageSources = new Set()
const claim = (rawPath, target, origin) => {
  const path = normalized(rawPath, origin)
  if (!crawl.has(path)) fail(`${origin}: ${rawPath} is not in the crawl`)
  addRedirect(path, target, origin)
  pageSources.add(path)
}
for (const [name, buildTarget] of Object.entries(PAGE_TARGETS)) {
  for (const rawPath of PAGE_EQUIVALENCES[name]) claim(rawPath, buildTarget(LOCALE), name)
}
for (const [rawPath, slug] of Object.entries(PAGE_EQUIVALENCES.books)) {
  if (!slugs.has(slug)) fail(`${rawPath}: no book has urlSlug "${slug}"`)
  claim(rawPath, bookPath(LOCALE, slug), `book ${slug}`)
}

for (const path of HOME_ALIASES) addRedirect(path, localePath(LOCALE, '/'), 'home alias')
for (const path of CATEGORY_LISTING_ALIASES) addRedirect(path, cataloguePath(LOCALE), 'listing alias')

for (const [path, target] of Object.entries(redirects)) {
  if (Object.hasOwn(redirects, normalized(target, path))) fail(`${path} redirects to ${target}, which is itself redirected`)
}

const sorted = Object.fromEntries(Object.entries(redirects).sort(([first], [second]) => (first < second ? -1 : first > second ? 1 : 0)))
await writeFile(OUTPUT_FILE, `${JSON.stringify(sorted, null, 2)}\n`)

let toBook = 0
let toPage = 0
let homeServed = 0
const deliberateNotFound = []
for (const [path, page] of crawl) {
  if (bookSources.has(path)) toBook += 1
  else if (pageSources.has(path)) toPage += 1
  else if (path === '/') homeServed += 1
  else {
    const section = Array.isArray(page.breadcrumb) && page.breadcrumb.every((part) => part.length < 80)
      ? (page.breadcrumb[1] ?? page.breadcrumb[0] ?? '(no breadcrumb)')
      : '(no breadcrumb)'
    deliberateNotFound.push({ type: page.type, section, path, words: page.wordCount })
  }
}
console.log(`Coverage of the ${crawl.size} crawled ${LEGACY_HOST} pages: to a book ${toBook}, to a page ${toPage}, served as home ${homeServed}, deliberate 404 ${deliberateNotFound.length}`)
console.log(`Redirects written: ${Object.keys(sorted).length}`)
console.log('\nDeliberate 404s:')
for (const entry of deliberateNotFound) console.log(`${entry.type}\t${entry.section}\t${entry.path}\t${entry.words}`)
process.exit(0)
